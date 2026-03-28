import Character from '#models/character'
import Enemy from '#models/enemy'
import DungeonRun from '#models/dungeon_run'
import DungeonFloor from '#models/dungeon_floor'
import InventoryItem from '#models/inventory_item'
import EnemyLootTable from '#models/enemy_loot_table'
import PartyMember from '#models/party_member'
import CombatSkill from '#models/combat_skill'
import CharacterTalent from '#models/character_talent'
import ClickerService from '#services/clicker_service'
import CompanionService from '#services/companion_service'
import TalentService from '#services/talent_service'
import DailyMissionService from '#services/daily_mission_service'
import QuestService from '#services/quest_service'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'

interface ActiveEffect {
  type: string // debuff_def, debuff_atk, buff_atk, buff_def, buff_all, dot, turret, shield, guaranteed_crit, stun
  value: number
  turnsLeft: number
  sourceCharId: number
  targetType: 'enemy' | 'player'
}

interface CombatLogEntry {
  action: string
  damage?: number
  isCrit?: boolean
  enemyHpLeft?: number
  playerHpLeft?: number
  blocked?: boolean
  creditsReward?: number
  xpReward?: number
  loot?: { name: string; rarity: string }[]
  newLevel?: number
  bossName?: string
  enemyName?: string
  enemyHp?: number
  defenderId?: number
  defenderName?: string
  skillName?: string
  healed?: number
  stolen?: number
  message?: string
  auto?: boolean
  characterName?: string
  characterId?: number
  afkCount?: number
  nextTurnSeconds?: number
  creditsLost?: number
  revivedHp?: number
  itemName?: string
}

export default class CombatService {
  private static readonly DEFAULT_TURN_MS = 30000
  private static readonly AFK_TURN_MS = 5000
  private static readonly DEATH_REVIVE_HP = 10
  private static readonly DEATH_CREDITS_LOSS_PERCENT = 10

  private static parseFloorEnemyIds(floor: DungeonFloor) {
    try {
      const parsed = JSON.parse(floor.enemyIds)
      if (!Array.isArray(parsed)) return []

      return parsed.filter((entry): entry is number => Number.isInteger(entry) && entry > 0)
    } catch {
      return []
    }
  }

  private static async getRandomFloorEnemy(floor: DungeonFloor) {
    const enemyIds = this.parseFloorEnemyIds(floor)
    if (enemyIds.length === 0) {
      throw new Error('No dungeon enemies configured')
    }

    const enemies = await Enemy.query().whereIn('id', enemyIds)
    if (enemies.length === 0) {
      throw new Error('No valid dungeon enemies found')
    }

    return enemies[Math.floor(Math.random() * enemies.length)]
  }

  private static async resolveRunEnemy(run: DungeonRun) {
    if (run.currentEnemyId) {
      const currentEnemy = await Enemy.find(run.currentEnemyId)
      if (currentEnemy) {
        return currentEnemy
      }
    }

    const floor = await DungeonFloor.findOrFail(run.dungeonFloorId)

    if (floor.bossEnemyId && run.enemiesDefeated >= 3) {
      const boss = await Enemy.find(floor.bossEnemyId)
      if (boss) {
        run.currentEnemyId = boss.id
        run.currentEnemyHp = run.currentEnemyHp > 0 ? run.currentEnemyHp : boss.hp
        return boss
      }
    }

    const fallbackEnemy = await this.getRandomFloorEnemy(floor)
    run.currentEnemyId = fallbackEnemy.id
    run.currentEnemyHp = run.currentEnemyHp > 0 ? run.currentEnemyHp : fallbackEnemy.hp
    return fallbackEnemy
  }

  static async startRun(character: Character, floorId: number) {
    const floor = await DungeonFloor.findOrFail(floorId)

    if (character.level < floor.minLevel) {
      throw new Error(`Level ${floor.minLevel} required`)
    }

    // Check no active run
    const activeRun = await DungeonRun.query()
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .first()

    if (activeRun) {
      throw new Error('Already in a dungeon run')
    }

    // Spawn first enemy
    const enemy = await this.getRandomFloorEnemy(floor)

    const run = await DungeonRun.create({
      characterId: character.id,
      dungeonFloorId: floorId,
      status: 'in_progress',
      currentEnemyId: enemy.id,
      currentEnemyHp: enemy.hp,
      enemiesDefeated: 0,
    })

    return { run, enemy, floor }
  }

  private static rollCrit(critChance: number, critDamage: number, baseDamage: number) {
    const isCrit = Math.random() * 100 < critChance
    if (isCrit) {
      return { damage: Math.floor(baseDamage * (critDamage / 100)), isCrit: true }
    }
    return { damage: baseDamage, isCrit: false }
  }

  private static getAfkPenalties(run: DungeonRun): Record<string, number> {
    return JSON.parse(run.afkPenalties || '{}')
  }

  private static setAfkPenalties(run: DungeonRun, penalties: Record<string, number>) {
    run.afkPenalties = JSON.stringify(penalties)
  }

  private static async trackDungeonFloorClearQuest(run: DungeonRun, fallbackCharacter: Character) {
    if (!run.partyId) {
      await QuestService.trackObjectiveProgress(fallbackCharacter, 'dungeon_floor_clear', 1).catch(
        () => {}
      )
      return
    }

    const members = await PartyMember.query().where('partyId', run.partyId).preload('character')

    for (const member of members) {
      await QuestService.trackObjectiveProgress(member.character, 'dungeon_floor_clear', 1).catch(
        () => {}
      )
    }
  }

  private static markCharacterAfk(run: DungeonRun, characterId: number): number {
    const penalties = this.getAfkPenalties(run)
    const key = String(characterId)
    penalties[key] = (penalties[key] || 0) + 1
    this.setAfkPenalties(run, penalties)
    return penalties[key]
  }

  private static clearCharacterAfk(run: DungeonRun, characterId: number) {
    const penalties = this.getAfkPenalties(run)
    const key = String(characterId)

    if (!(key in penalties)) {
      return
    }

    delete penalties[key]
    this.setAfkPenalties(run, penalties)
  }

  private static isCharacterAfkPenalized(run: DungeonRun, characterId: number) {
    const penalties = this.getAfkPenalties(run)
    return (penalties[String(characterId)] || 0) > 0
  }

  private static getTurnDurationMs(run: DungeonRun, characterId: number | null) {
    if (!characterId) {
      return this.DEFAULT_TURN_MS
    }

    return this.isCharacterAfkPenalized(run, characterId) ? this.AFK_TURN_MS : this.DEFAULT_TURN_MS
  }

  private static setTurnDeadline(run: DungeonRun, characterId: number | null) {
    run.turnDeadline = characterId ? Date.now() + this.getTurnDurationMs(run, characterId) : null
  }

  private static applyDeathPenalty(character: Character) {
    const creditsLost = Math.min(
      character.credits,
      Math.floor(character.credits * (this.DEATH_CREDITS_LOSS_PERCENT / 100))
    )

    character.credits = Math.max(0, character.credits - creditsLost)
    character.hpCurrent = Math.min(character.hpMax, this.DEATH_REVIVE_HP)

    return {
      creditsLost,
      revivedHp: character.hpCurrent,
    }
  }

  /** Auto-attack for timed out player — callable from controller */
  static async performAutoAttackPublic(character: Character, run: DungeonRun) {
    return this.performAutoAttack(character, run)
  }

  /** Auto-attack for timed out player (basic attack, no crits) */
  private static async performAutoAttack(character: Character, run: DungeonRun) {
    const persistentLog = JSON.parse(run.combatLog || '[]')
    const afkCount = this.markCharacterAfk(run, character.id)
    persistentLog.push({
      action: 'player_afk',
      characterName: character.name,
      characterId: character.id,
      afkCount,
      nextTurnSeconds: Math.floor(this.AFK_TURN_MS / 1000),
    })

    if (character.hpCurrent <= 0) {
      const nextTurnId = await this.getNextTurnId(run, character.id)
      if (nextTurnId) {
        run.currentTurnId = nextTurnId
        this.setTurnDeadline(run, nextTurnId)
      } else {
        await this.handlePartyDefeat(run)
      }
      run.combatLog = JSON.stringify(persistentLog)
      await run.save()
      return
    }

    const enemy = await this.resolveRunEnemy(run)
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const rawDmg = Math.max(1, character.attack + bonuses.attackBonus - enemy.defense)
    run.currentEnemyHp = Math.max(0, run.currentEnemyHp - rawDmg)

    persistentLog.push({
      action: 'player_attack',
      damage: rawDmg,
      isCrit: false,
      enemyHpLeft: run.currentEnemyHp,
      characterName: character.name,
      characterId: character.id,
      auto: true,
    })
    run.combatLog = JSON.stringify(persistentLog)

    // Switch turn
    const nextTurnId = await this.getNextTurnId(run, character.id)
    if (nextTurnId) {
      run.currentTurnId = nextTurnId
      this.setTurnDeadline(run, nextTurnId)
    } else {
      await this.handlePartyDefeat(run)
    }
    await run.save()
  }

  /** Get next turn character id in party rotation */
  private static async getNextTurnId(
    run: DungeonRun,
    currentCharId: number
  ): Promise<number | null> {
    if (!run.partyId) return currentCharId
    const members = await PartyMember.query()
      .where('partyId', run.partyId)
      .orderBy('id', 'asc')
      .preload('character')

    const ids = members.map((member) => member.characterId)
    const aliveIds = new Set(
      members.filter((member) => member.character.hpCurrent > 0).map((member) => member.characterId)
    )

    if (aliveIds.size === 0) {
      return null
    }

    const idx = ids.indexOf(currentCharId)
    if (idx === -1) {
      return members.find((member) => aliveIds.has(member.characterId))?.characterId ?? null
    }

    for (let offset = 1; offset <= ids.length; offset++) {
      const nextId = ids[(idx + offset) % ids.length]
      if (aliveIds.has(nextId)) {
        return nextId
      }
    }

    return null
  }

  private static getEnemyTargetWeight(character: Character) {
    let weight = 1

    switch (character.chosenSpec) {
      case 'samurai':
        weight += 2.5
        break
      case 'chrome_dealer':
        weight += 0.75
        break
      case 'netrunner':
        weight += 0.15
        break
      case 'hacker':
        weight -= 0.1
        break
    }

    weight += Math.min(character.defense / 100, 1.5)
    weight += Math.min(character.hpMax / 250, 1.5)

    return Math.max(0.5, weight)
  }

  private static async selectEnemyTarget(run: DungeonRun, actingCharacter: Character) {
    if (!run.partyId) {
      return actingCharacter
    }

    const members = await PartyMember.query().where('partyId', run.partyId).preload('character')

    const aliveCharacters = members
      .map((member) =>
        member.characterId === actingCharacter.id ? actingCharacter : member.character
      )
      .filter((memberCharacter) => memberCharacter.hpCurrent > 0)

    if (aliveCharacters.length === 0) {
      return actingCharacter
    }

    const weightedTargets = aliveCharacters.map((memberCharacter) => ({
      character: memberCharacter,
      weight: this.getEnemyTargetWeight(memberCharacter),
    }))

    const totalWeight = weightedTargets.reduce((sum, target) => sum + target.weight, 0)
    let roll = Math.random() * totalWeight

    for (const target of weightedTargets) {
      roll -= target.weight
      if (roll <= 0) {
        return target.character
      }
    }

    return weightedTargets[weightedTargets.length - 1].character
  }

  private static async handlePartyDefeat(run: DungeonRun) {
    run.status = 'defeat'
    run.endedAt = DateTime.now()
    run.currentTurnId = null
    run.turnDeadline = null

    if (run.partyId) {
      const members = await PartyMember.query().where('partyId', run.partyId).preload('character')

      for (const member of members) {
        if (member.character.hpCurrent <= 0) {
          this.applyDeathPenalty(member.character)
          await member.character.save()
        }
      }

      const { default: Party } = await import('#models/party')
      const party = await Party.find(run.partyId)
      if (party) {
        party.status = 'waiting'
        party.dungeonRunId = null
        party.dungeonFloorId = null
        party.countdownStart = null
        await party.save()
      }
    }
  }

  private static async handleEnemyCounterAttack(
    run: DungeonRun,
    enemy: Enemy,
    effects: ActiveEffect[],
    actingCharacter: Character,
    log: any[]
  ) {
    const target = await this.selectEnemyTarget(run, actingCharacter)
    const targetBonuses = await ClickerService.calculateEquipBonuses(target)
    const targetTalentBonuses = await TalentService.getCharacterBonuses(target.id)
    const targetCombatMult = 1 + targetTalentBonuses.combatPercent / 100
    const targetMods = this.applyPlayerModifiers(
      {
        attack: target.attack + targetTalentBonuses.atkFlat,
        defense: target.defense + targetTalentBonuses.defFlat,
      },
      effects,
      target.id
    )

    const shielded = this.hasShield(effects, target.id)

    if (shielded) {
      log.push({
        action: 'enemy_attack',
        damage: 0,
        blocked: true,
        playerHpLeft: target.hpCurrent,
        defenderId: target.id,
        defenderName: target.name,
      })
      effects = this.consumeEffect(effects, target.id, 'shield')
      this.setEffects(run, effects)
      await target.save()
      return effects
    }

    const enemyMods = this.applyEnemyModifiers(enemy, effects)
    const effectiveDef = Math.floor(
      (targetMods.defense + targetBonuses.defenseBonus) * targetCombatMult
    )
    const rawEnemyAttack = Math.max(1, enemyMods.attack - effectiveDef)
    const enemyVariance = Math.floor(Math.random() * Math.floor(rawEnemyAttack * 0.3))
    const baseEnemyDamage = rawEnemyAttack + enemyVariance
    const enemyHit = this.rollCrit(enemy.critChance, enemy.critDamage, baseEnemyDamage)

    target.hpCurrent = Math.max(0, target.hpCurrent - enemyHit.damage)
    log.push({
      action: 'enemy_attack',
      damage: enemyHit.damage,
      isCrit: enemyHit.isCrit,
      playerHpLeft: target.hpCurrent,
      defenderId: target.id,
      defenderName: target.name,
    })

    if (target.hpCurrent <= 0) {
      if (run.partyId) {
        log.push({ action: 'party_member_down', defenderId: target.id, defenderName: target.name })
        await target.save()

        const remainingAliveMembers = await PartyMember.query()
          .where('partyId', run.partyId)
          .preload('character')

        const hasAliveMember = remainingAliveMembers.some(
          (member) => member.character.hpCurrent > 0
        )
        if (!hasAliveMember) {
          await this.handlePartyDefeat(run)
          log.push({
            action: 'defeat',
            defenderId: target.id,
            defenderName: target.name,
            creditsLost: Math.min(
              target.credits,
              Math.floor(target.credits * (this.DEATH_CREDITS_LOSS_PERCENT / 100))
            ),
            revivedHp: Math.min(target.hpMax, this.DEATH_REVIVE_HP),
          })
        }

        return effects
      }

      run.status = 'defeat'
      run.endedAt = DateTime.now()
      const penalty = this.applyDeathPenalty(target)
      log.push({
        action: 'defeat',
        defenderId: target.id,
        defenderName: target.name,
        creditsLost: penalty.creditsLost,
        revivedHp: penalty.revivedHp,
      })
    }

    await target.save()

    return effects
  }

  static async attack(character: Character, runId: number) {
    const run = await DungeonRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    // Enforce turns in group mode
    if (run.partyId && run.currentTurnId) {
      // Check for timeout — auto-attack if deadline passed
      if (run.turnDeadline && Date.now() > run.turnDeadline && run.currentTurnId !== character.id) {
        // Force the timed-out player's basic attack first
        const timedOutChar = await Character.find(run.currentTurnId)
        if (timedOutChar) {
          await this.performAutoAttack(timedOutChar, run)
        } else {
          const nextTurnId = await this.getNextTurnId(run, run.currentTurnId)
          run.currentTurnId = nextTurnId
          this.setTurnDeadline(run, nextTurnId)
          await run.save()
        }
        // Now it might be this character's turn, or the run might be over
        if (run.status !== 'in_progress') {
          await run.save()
          return { log: JSON.parse(run.combatLog), run: run.serialize(), currentEnemy: null }
        }
      }

      if (run.currentTurnId !== character.id) {
        throw new Error("Ce n'est pas ton tour")
      }
    }

    this.clearCharacterAfk(run, character.id)

    const enemy = await this.resolveRunEnemy(run)
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effectiveCritChance = Math.min(100, character.critChance + bonuses.critChanceBonus)
    let effects = this.getEffects(run)

    const log: any[] = []

    // Tick effects (DOTs, turrets)
    const tickResult = this.tickEffects(run, character.id)
    effects = tickResult.effects
    log.push(...tickResult.log)
    if (tickResult.dotDamage + tickResult.turretDamage > 0) {
      run.currentEnemyHp = Math.max(
        0,
        run.currentEnemyHp - tickResult.dotDamage - tickResult.turretDamage
      )
    }

    // Tick cooldowns
    this.tickCooldowns(run, character.id)

    // Apply modifiers from active effects (includes talent bonuses)
    const baseAtk = character.attack + talentBonuses.atkFlat
    const baseDef = character.defense + talentBonuses.defFlat
    const combatMult = 1 + talentBonuses.combatPercent / 100
    const enemyMods = this.applyEnemyModifiers(enemy, effects)
    const playerMods = this.applyPlayerModifiers(
      { attack: baseAtk, defense: baseDef },
      effects,
      character.id
    )

    // Player attacks (with talent combat multiplier)
    const rawPlayerAttack = Math.max(
      1,
      Math.floor((playerMods.attack + bonuses.attackBonus) * combatMult) - enemyMods.defense
    )
    const variance = Math.floor(Math.random() * Math.floor(rawPlayerAttack * 0.3))
    const basePlayerDamage = rawPlayerAttack + variance

    // Check guaranteed crit
    const forceCrit = this.hasGuaranteedCrit(effects, character.id)
    let playerHit: { damage: number; isCrit: boolean }
    if (forceCrit) {
      playerHit = {
        damage: Math.floor(basePlayerDamage * (character.critDamage / 100)),
        isCrit: true,
      }
      effects = this.consumeEffect(effects, character.id, 'guaranteed_crit')
    } else {
      playerHit = this.rollCrit(effectiveCritChance, character.critDamage, basePlayerDamage)
    }

    run.currentEnemyHp = Math.max(0, run.currentEnemyHp - playerHit.damage)

    log.push({
      action: 'player_attack',
      damage: playerHit.damage,
      isCrit: playerHit.isCrit,
      enemyHpLeft: run.currentEnemyHp,
    })

    this.setEffects(run, effects)

    // Check enemy death
    if (run.currentEnemyHp <= 0) {
      run.enemiesDefeated += 1

      // Rewards
      const creditsReward = Math.floor(
        Math.random() * (enemy.creditsRewardMax - enemy.creditsRewardMin) + enemy.creditsRewardMin
      )
      character.credits += creditsReward
      character.xp += enemy.xpReward

      // Level up check
      const xpForNextLevel = character.level * 100
      if (character.xp >= xpForNextLevel) {
        character.levelUp()
        await CompanionService.refillHpAfterLevelUp(character)
        log.push({ action: 'level_up', newLevel: character.level })
      }

      // Loot roll
      const loot = await this.rollLoot(enemy.id, character.id)

      log.push({
        action: 'enemy_defeated',
        creditsReward,
        xpReward: enemy.xpReward,
        loot: loot.map((l) => ({ name: l.name, rarity: l.rarity })),
      })

      // Track daily missions
      DailyMissionService.trackProgress(character.id, 'kill').catch(() => {})
      DailyMissionService.trackProgress(character.id, 'earn_credits', creditsReward).catch(() => {})

      // Check if run complete (3 enemies per floor, or boss)
      const floor = await DungeonFloor.findOrFail(run.dungeonFloorId)

      if (run.enemiesDefeated >= 3) {
        if (floor.bossEnemyId && run.enemiesDefeated === 3) {
          // Spawn boss
          const boss = await Enemy.find(floor.bossEnemyId)
          if (boss) {
            run.currentEnemyId = boss.id
            run.currentEnemyHp = boss.hp
            log.push({ action: 'boss_spawn', bossName: boss.name })
          } else {
            run.status = 'victory'
            run.endedAt = DateTime.now()
            log.push({ action: 'victory' })
            DailyMissionService.trackProgress(character.id, 'dungeon_clear').catch(() => {})
            await this.trackDungeonFloorClearQuest(run, character)
          }
        } else {
          // Victory
          run.status = 'victory'
          run.endedAt = DateTime.now()
          log.push({ action: 'victory' })
          DailyMissionService.trackProgress(character.id, 'dungeon_clear').catch(() => {})
          await this.trackDungeonFloorClearQuest(run, character)
          transmit.broadcast('game/notifications', {
            type: 'dungeon',
            message: `${character.name} a termine un donjon!`,
          })
          // Reset party status if group run
          if (run.partyId) {
            const { default: Party } = await import('#models/party')
            const party = await Party.find(run.partyId)
            if (party) {
              party.status = 'waiting'
              party.dungeonRunId = null
              party.dungeonFloorId = null
              party.countdownStart = null
              await party.save()
            }
          }
        }
      } else {
        // Spawn next enemy
        const nextEnemy = await this.getRandomFloorEnemy(floor)
        run.currentEnemyId = nextEnemy.id
        run.currentEnemyHp = nextEnemy.hp
        log.push({ action: 'new_enemy', enemyName: nextEnemy.name, enemyHp: nextEnemy.hp })
      }

      await character.save()
    } else {
      // Enemy attacks back (unless stunned)
      if (enemyMods.isStunned) {
        log.push({ action: 'enemy_stunned', message: "L'ennemi est paralyse!" })
      } else {
        effects = await this.handleEnemyCounterAttack(run, enemy, effects, character, log)
      }

      await character.save()
    }

    // Update persistent combat log for group runs
    if (run.partyId) {
      const persistentLog = JSON.parse(run.combatLog || '[]')
      for (const entry of log) {
        persistentLog.push({ ...entry, characterName: character.name, characterId: character.id })
      }
      run.combatLog = JSON.stringify(persistentLog)

      // Switch turn to next player (if run still in progress)
      if (run.status === 'in_progress') {
        const nextTurnId = await this.getNextTurnId(run, character.id)
        if (nextTurnId) {
          run.currentTurnId = nextTurnId
          this.setTurnDeadline(run, nextTurnId)
        } else {
          await this.handlePartyDefeat(run)
        }
      } else {
        run.currentTurnId = null
        run.turnDeadline = null
      }
    }

    await run.save()

    const currentEnemy = run.currentEnemyId ? await Enemy.find(run.currentEnemyId) : null

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: currentEnemy?.serialize() || null,
    }
  }

  private static async validateRunAccess(character: Character, run: DungeonRun) {
    if (run.status !== 'in_progress') throw new Error('Invalid run')
    if (run.partyId) {
      const isMember = await PartyMember.query()
        .where('partyId', run.partyId)
        .where('characterId', character.id)
        .first()
      if (!isMember) throw new Error('Invalid run')
      if (character.hpCurrent <= 0) throw new Error('Ton personnage est KO')
    } else if (run.characterId !== character.id) {
      throw new Error('Invalid run')
    }
  }

  static async flee(character: Character, runId: number) {
    const run = await DungeonRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    run.status = 'fled'
    run.endedAt = DateTime.now()
    await run.save()

    // Reset party status if this was a party run
    if (run.partyId) {
      const { default: Party } = await import('#models/party')
      const party = await Party.find(run.partyId)
      if (party && party.status === 'in_dungeon') {
        party.status = 'waiting'
        party.dungeonRunId = null
        party.dungeonFloorId = null
        party.countdownStart = null
        await party.save()
      }
    }

    return { run: run.serialize() }
  }

  static async useConsumable(character: Character, runId: number, inventoryItemId: number) {
    const run = await DungeonRun.findOrFail(runId)
    await this.validateRunAccess(character, run)
    this.clearCharacterAfk(run, character.id)

    const invItem = await InventoryItem.query()
      .where('id', inventoryItemId)
      .where('characterId', character.id)
      .preload('item')
      .firstOrFail()

    if (invItem.item.type !== 'consumable') {
      throw new Error('Not a consumable')
    }

    let effect = ''
    const log: CombatLogEntry[] = []
    switch (invItem.item.effectType) {
      case 'hp_restore': {
        const effectiveHpMax = await CompanionService.getEffectiveHpMax(character)
        const healed = Math.min(invItem.item.effectValue || 0, effectiveHpMax - character.hpCurrent)
        character.hpCurrent += healed
        effect = `Restored ${healed} HP`
        log.push({
          action: 'item_use',
          itemName: invItem.item.name,
          healed,
          playerHpLeft: character.hpCurrent,
        })
        break
      }
      default:
        effect = `Used ${invItem.item.name}`
        log.push({
          action: 'item_use',
          itemName: invItem.item.name,
          message: effect,
        })
    }

    invItem.quantity -= 1
    if (invItem.quantity <= 0) {
      await invItem.delete()
    } else {
      await invItem.save()
    }

    await character.save()

    if (run.partyId) {
      const persistentLog = JSON.parse(run.combatLog || '[]')
      for (const entry of log) {
        persistentLog.push({ ...entry, characterName: character.name, characterId: character.id })
      }
      run.combatLog = JSON.stringify(persistentLog)
    }

    await run.save()

    return { effect, log, character: character.serialize(), run: run.serialize() }
  }

  private static async rollLoot(enemyId: number, characterId: number) {
    const lootTable = await EnemyLootTable.query().where('enemyId', enemyId).preload('item')
    const drops: any[] = []

    for (const entry of lootTable) {
      if (Math.random() <= entry.dropChance) {
        const existing = await InventoryItem.query()
          .where('characterId', characterId)
          .where('itemId', entry.itemId)
          .first()

        if (existing) {
          existing.quantity += 1
          await existing.save()
        } else {
          await InventoryItem.create({
            characterId,
            itemId: entry.itemId,
            quantity: 1,
            isEquipped: false,
          })
        }

        drops.push({ name: entry.item.name, rarity: entry.item.rarity })
      }
    }

    return drops
  }

  // ═══════════════════════════════════════════
  // COMBAT SKILLS SYSTEM
  // ═══════════════════════════════════════════

  /** Get available skills for a character based on their spec and unlocked talents */
  static async getAvailableSkills(character: Character) {
    if (!character.chosenSpec) return []

    // Find the highest talent tier unlocked
    const unlocked = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent')

    const maxTier = unlocked.reduce((max, ct) => Math.max(max, ct.talent.tier), 0)

    const skills = await CombatSkill.query()
      .where('spec', character.chosenSpec)
      .where('tierRequired', '<=', maxTier)
      .orderBy('tierRequired', 'asc')
      .orderBy('id', 'asc')

    const uniqueSkills: CombatSkill[] = []
    const seen = new Set<string>()

    for (const skill of skills) {
      const key = `${skill.spec}:${skill.name}`
      if (seen.has(key)) continue
      seen.add(key)
      uniqueSkills.push(skill)
    }

    return uniqueSkills
  }

  static async getCombatPreview(character: Character, enemy: Enemy | null, run: DungeonRun) {
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effects = this.getEffects(run)
    const combatMult = 1 + talentBonuses.combatPercent / 100

    const playerMods = this.applyPlayerModifiers(
      {
        attack: character.attack + talentBonuses.atkFlat,
        defense: character.defense + talentBonuses.defFlat,
      },
      effects,
      character.id
    )

    const preview = {
      player: {
        attack: Math.floor((playerMods.attack + bonuses.attackBonus) * combatMult),
        defense: Math.floor((playerMods.defense + bonuses.defenseBonus) * combatMult),
      },
      enemy: null as null | { attack: number; defense: number; isStunned: boolean },
    }

    if (enemy) {
      const enemyMods = this.applyEnemyModifiers(enemy, effects)
      preview.enemy = {
        attack: enemyMods.attack,
        defense: enemyMods.defense,
        isStunned: enemyMods.isStunned,
      }
    }

    return preview
  }

  /** Get cooldowns for a character in a run */
  private static getCooldowns(run: DungeonRun, characterId: number): Record<number, number> {
    const all = JSON.parse(run.skillCooldowns || '{}')
    return all[characterId] || {}
  }

  /** Set cooldown for a skill */
  private static setCooldown(run: DungeonRun, characterId: number, skillId: number, turns: number) {
    const all = JSON.parse(run.skillCooldowns || '{}')
    if (!all[characterId]) all[characterId] = {}
    all[characterId][skillId] = turns
    run.skillCooldowns = JSON.stringify(all)
  }

  /** Tick all cooldowns down by 1 for a character */
  private static tickCooldowns(run: DungeonRun, characterId: number) {
    const all = JSON.parse(run.skillCooldowns || '{}')
    const cd = all[characterId] || {}
    for (const skillId of Object.keys(cd)) {
      cd[skillId] = Math.max(0, cd[skillId] - 1)
    }
    all[characterId] = cd
    run.skillCooldowns = JSON.stringify(all)
  }

  /** Get active effects */
  private static getEffects(run: DungeonRun): ActiveEffect[] {
    return JSON.parse(run.activeEffects || '[]')
  }

  /** Save active effects */
  private static setEffects(run: DungeonRun, effects: ActiveEffect[]) {
    run.activeEffects = JSON.stringify(effects)
  }

  /** Apply active effects modifiers to enemy stats */
  private static applyEnemyModifiers(
    enemy: { attack: number; defense: number },
    effects: ActiveEffect[]
  ) {
    let atkMod = 0
    let defMod = 0
    for (const e of effects) {
      if (e.targetType !== 'enemy') continue
      if (e.type === 'debuff_def') defMod += e.value
      if (e.type === 'debuff_atk') atkMod += e.value
      if (e.type === 'stun') atkMod = 100 // stunned = no attack
    }
    return {
      attack: Math.max(0, Math.floor(enemy.attack * (1 - atkMod / 100))),
      defense: Math.max(0, Math.floor(enemy.defense * (1 - defMod / 100))),
      isStunned: effects.some(
        (e) => e.targetType === 'enemy' && e.type === 'stun' && e.turnsLeft > 0
      ),
    }
  }

  /** Apply player buff modifiers */
  private static applyPlayerModifiers(
    character: { attack: number; defense: number },
    effects: ActiveEffect[],
    charId: number
  ) {
    let atkBonus = 0
    let defBonus = 0
    for (const e of effects) {
      if (e.targetType !== 'player' || e.sourceCharId !== charId) continue
      if (e.type === 'buff_atk' || e.type === 'buff_all') atkBonus += e.value
      if (e.type === 'buff_def' || e.type === 'buff_all') defBonus += e.value
    }
    return {
      attack: Math.floor(character.attack * (1 + atkBonus / 100)),
      defense: Math.floor(character.defense * (1 + defBonus / 100)),
    }
  }

  /** Check if player has guaranteed crit */
  private static hasGuaranteedCrit(effects: ActiveEffect[], charId: number): boolean {
    return effects.some(
      (e) =>
        e.targetType === 'player' &&
        e.sourceCharId === charId &&
        e.type === 'guaranteed_crit' &&
        e.turnsLeft > 0
    )
  }

  /** Check if player has shield */
  private static hasShield(effects: ActiveEffect[], charId: number): boolean {
    return effects.some(
      (e) =>
        e.targetType === 'player' &&
        e.sourceCharId === charId &&
        e.type === 'shield' &&
        e.turnsLeft > 0
    )
  }

  /** Remove consumed one-shot effects (guaranteed_crit, shield) after use */
  private static consumeEffect(
    effects: ActiveEffect[],
    charId: number,
    type: string
  ): ActiveEffect[] {
    return effects.map((e) => {
      if (e.targetType === 'player' && e.sourceCharId === charId && e.type === type) {
        return { ...e, turnsLeft: 0 }
      }
      return e
    })
  }

  /** Tick effects down and apply DOTs/turrets, return log entries */
  private static tickEffects(
    run: DungeonRun,
    _characterId: number
  ): { effects: ActiveEffect[]; log: any[]; dotDamage: number; turretDamage: number } {
    let effects = this.getEffects(run)
    const log: any[] = []
    let dotDamage = 0
    let turretDamage = 0

    for (const e of effects) {
      if (e.turnsLeft <= 0) continue

      // DOT damages enemy
      if (e.type === 'dot' && e.targetType === 'enemy') {
        dotDamage += e.value
        log.push({
          action: 'skill_effect',
          effectType: 'dot',
          damage: e.value,
          message: `Saignement: -${e.value} HP`,
        })
      }

      // Turret damages enemy
      if (e.type === 'turret' && e.targetType === 'enemy') {
        turretDamage += e.value
        log.push({
          action: 'skill_effect',
          effectType: 'turret',
          damage: e.value,
          message: `Tourelle: -${e.value} HP`,
        })
      }
    }

    // Tick down
    effects = effects
      .map((e) => ({ ...e, turnsLeft: e.turnsLeft - 1 }))
      .filter((e) => e.turnsLeft > 0)

    return { effects, log, dotDamage, turretDamage }
  }

  /** Use a combat skill */
  static async useSkill(character: Character, runId: number, skillId: number) {
    const run = await DungeonRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    // Enforce turns in group mode
    if (run.partyId && run.currentTurnId) {
      if (run.turnDeadline && Date.now() > run.turnDeadline && run.currentTurnId !== character.id) {
        const timedOutChar = await Character.find(run.currentTurnId)
        if (timedOutChar) {
          await this.performAutoAttack(timedOutChar, run)
        } else {
          const nextTurnId = await this.getNextTurnId(run, run.currentTurnId)
          run.currentTurnId = nextTurnId
          this.setTurnDeadline(run, nextTurnId)
          await run.save()
        }
        if (run.status !== 'in_progress') {
          await run.save()
          return { log: JSON.parse(run.combatLog), run: run.serialize(), currentEnemy: null }
        }
      }
      if (run.currentTurnId !== character.id) {
        throw new Error("Ce n'est pas ton tour")
      }
    }

    this.clearCharacterAfk(run, character.id)

    const skill = await CombatSkill.findOrFail(skillId)

    // Verify character has this skill unlocked
    if (!character.chosenSpec || character.chosenSpec !== skill.spec) {
      throw new Error('Skill non disponible pour ta spec')
    }

    const unlocked = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent')
    const maxTier = unlocked.reduce((max, ct) => Math.max(max, ct.talent.tier), 0)
    if (maxTier < skill.tierRequired) {
      throw new Error('Talent requis non debloque')
    }

    // Check cooldown
    const cooldowns = this.getCooldowns(run, character.id)
    if (cooldowns[skillId] && cooldowns[skillId] > 0) {
      throw new Error(`Skill en cooldown (${cooldowns[skillId]} tours)`)
    }

    const enemy = await this.resolveRunEnemy(run)
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effectiveCritChance = Math.min(100, character.critChance + bonuses.critChanceBonus)
    let effects = this.getEffects(run)

    const log: any[] = []

    // Tick effects (DOTs, turrets)
    const tickResult = this.tickEffects(run, character.id)
    effects = tickResult.effects
    log.push(...tickResult.log)

    // Apply DOT/turret damage
    if (tickResult.dotDamage + tickResult.turretDamage > 0) {
      run.currentEnemyHp = Math.max(
        0,
        run.currentEnemyHp - tickResult.dotDamage - tickResult.turretDamage
      )
    }

    // Apply the skill (with talent bonuses)
    const baseAtk = character.attack + talentBonuses.atkFlat
    const combatMult = 1 + talentBonuses.combatPercent / 100
    const playerMods = this.applyPlayerModifiers(
      { attack: baseAtk, defense: character.defense + talentBonuses.defFlat },
      effects,
      character.id
    )
    const effectiveAtk = Math.floor((playerMods.attack + bonuses.attackBonus) * combatMult)

    switch (skill.effectType) {
      case 'pure_damage': {
        // Ignore defense entirely
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.5)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'debuff_def': {
        effects.push({
          type: 'debuff_def',
          value: skill.effectValue,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'enemy',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: `DEF ennemi -${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }

      case 'debuff_atk': {
        effects.push({
          type: 'debuff_atk',
          value: skill.effectValue,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'enemy',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: `ATK ennemi -${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }

      case 'steal_damage': {
        const enemyMods = this.applyEnemyModifiers(enemy, effects)
        const dmg = Math.max(1, skill.effectValue + effectiveAtk - enemyMods.defense)
        const stolen = Math.floor(dmg * 0.5)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        character.credits += stolen
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          stolen,
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'damage_stun': {
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.3)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        effects.push({
          type: 'stun',
          value: 0,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'enemy',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          stun: true,
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'guaranteed_crit': {
        effects.push({
          type: 'guaranteed_crit',
          value: 0,
          turnsLeft: 2,
          sourceCharId: character.id,
          targetType: 'player',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: 'Prochaine attaque = critique garanti',
        })
        break
      }

      case 'purge_damage': {
        // Remove all enemy buffs + deal damage
        effects = effects.filter(
          (e) => e.targetType !== 'enemy' || e.type === 'dot' || e.type === 'turret'
        )
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.3)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          message: 'Protections ennemies purgees',
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'heal_percent': {
        const effectiveHpMax = await CompanionService.getEffectiveHpMax(character)
        const healed = Math.floor((effectiveHpMax * skill.effectValue) / 100)
        const actualHeal = Math.min(healed, effectiveHpMax - character.hpCurrent)
        character.hpCurrent = Math.min(effectiveHpMax, character.hpCurrent + healed)
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          healed: actualHeal,
          message: `+${actualHeal} HP`,
        })
        break
      }

      case 'double_hit': {
        const enemyMods = this.applyEnemyModifiers(enemy, effects)
        for (let i = 0; i < 2; i++) {
          const rawDmg = Math.max(1, effectiveAtk - enemyMods.defense)
          const variance = Math.floor(Math.random() * Math.floor(rawDmg * 0.3))
          const hit = this.rollCrit(effectiveCritChance, character.critDamage, rawDmg + variance)
          run.currentEnemyHp = Math.max(0, run.currentEnemyHp - hit.damage)
          log.push({
            action: 'skill_use',
            skillName: `${skill.name} #${i + 1}`,
            damage: hit.damage,
            isCrit: hit.isCrit,
            enemyHpLeft: run.currentEnemyHp,
          })
        }
        break
      }

      case 'damage_dot': {
        const enemyMods = this.applyEnemyModifiers(enemy, effects)
        const dmg = Math.max(1, skill.effectValue + effectiveAtk - enemyMods.defense)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        const dotDmg = Math.floor(dmg * 0.3)
        effects.push({
          type: 'dot',
          value: dotDmg,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'enemy',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          dot: dotDmg,
          duration: skill.duration,
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'shield': {
        effects.push({
          type: 'shield',
          value: 0,
          turnsLeft: 2,
          sourceCharId: character.id,
          targetType: 'player',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: 'Bouclier actif — prochain coup absorbe',
        })
        break
      }

      case 'mega_strike': {
        const enemyMods = this.applyEnemyModifiers(enemy, effects)
        const rawDmg = Math.max(1, effectiveAtk - enemyMods.defense)
        const dmg = Math.floor(rawDmg * 3 * (character.critDamage / 100))
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          damage: dmg,
          isCrit: true,
          enemyHpLeft: run.currentEnemyHp,
        })
        break
      }

      case 'turret': {
        effects.push({
          type: 'turret',
          value: skill.effectValue,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'enemy',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: `Tourelle deployee — ${skill.effectValue} degats/tour pendant ${skill.duration} tours`,
        })
        break
      }

      case 'buff_all': {
        effects.push({
          type: 'buff_all',
          value: skill.effectValue,
          turnsLeft: skill.duration,
          sourceCharId: character.id,
          targetType: 'player',
        })
        log.push({
          action: 'skill_use',
          skillName: skill.name,
          message: `ATK et DEF +${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }
    }

    // Set cooldown
    this.setCooldown(run, character.id, skillId, skill.cooldown)
    this.tickCooldowns(run, character.id)

    // Save effects
    this.setEffects(run, effects)

    // Check enemy death after skill
    if (run.currentEnemyHp <= 0) {
      return this.handleEnemyDeath(character, run, enemy, bonuses, log, effects)
    }

    // Enemy counter-attack (unless stunned)
    const enemyMods = this.applyEnemyModifiers(enemy, effects)
    if (!enemyMods.isStunned) {
      effects = await this.handleEnemyCounterAttack(run, enemy, effects, character, log)
    } else {
      log.push({ action: 'enemy_stunned', message: "L'ennemi est paralyse!" })
    }

    await character.save()

    // Group run: persistent log + turn switch
    if (run.partyId) {
      const persistentLog = JSON.parse(run.combatLog || '[]')
      for (const entry of log) {
        persistentLog.push({ ...entry, characterName: character.name, characterId: character.id })
      }
      run.combatLog = JSON.stringify(persistentLog)

      if (run.status === 'in_progress') {
        const nextTurnId = await this.getNextTurnId(run, character.id)
        if (nextTurnId) {
          run.currentTurnId = nextTurnId
          this.setTurnDeadline(run, nextTurnId)
        } else {
          await this.handlePartyDefeat(run)
        }
      } else {
        run.currentTurnId = null
        run.turnDeadline = null
      }
    }

    await run.save()

    const currentEnemy = run.currentEnemyId ? await Enemy.find(run.currentEnemyId) : null

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: currentEnemy?.serialize() || null,
    }
  }

  /** Handle enemy death (shared between attack and useSkill) */
  private static async handleEnemyDeath(
    character: Character,
    run: DungeonRun,
    enemy: Enemy,
    _bonuses: any,
    log: any[],
    effects: ActiveEffect[]
  ) {
    run.enemiesDefeated += 1

    const creditsReward = Math.floor(
      Math.random() * (enemy.creditsRewardMax - enemy.creditsRewardMin) + enemy.creditsRewardMin
    )
    character.credits += creditsReward
    character.xp += enemy.xpReward

    const xpForNextLevel = character.level * 100
    if (character.xp >= xpForNextLevel) {
      character.levelUp()
      await CompanionService.refillHpAfterLevelUp(character)
      log.push({ action: 'level_up', newLevel: character.level })
    }

    const loot = await this.rollLoot(enemy.id, character.id)
    log.push({
      action: 'enemy_defeated',
      creditsReward,
      xpReward: enemy.xpReward,
      loot: loot.map((l) => ({ name: l.name, rarity: l.rarity })),
    })

    DailyMissionService.trackProgress(character.id, 'kill').catch(() => {})
    DailyMissionService.trackProgress(character.id, 'earn_credits', creditsReward).catch(() => {})

    const floor = await DungeonFloor.findOrFail(run.dungeonFloorId)

    // Clear enemy-targeted effects on new enemy
    effects = effects.filter((e) => e.targetType !== 'enemy')
    this.setEffects(run, effects)

    if (run.enemiesDefeated >= 3) {
      if (floor.bossEnemyId && run.enemiesDefeated === 3) {
        const boss = await Enemy.find(floor.bossEnemyId)
        if (boss) {
          run.currentEnemyId = boss.id
          run.currentEnemyHp = boss.hp
          log.push({ action: 'boss_spawn', bossName: boss.name })
        } else {
          run.status = 'victory'
          run.endedAt = DateTime.now()
          log.push({ action: 'victory' })
          DailyMissionService.trackProgress(character.id, 'dungeon_clear').catch(() => {})
          await this.trackDungeonFloorClearQuest(run, character)
          transmit.broadcast('game/notifications', {
            type: 'dungeon',
            message: `${character.name} a termine un donjon!`,
          })
          if (run.partyId) {
            const { default: Party } = await import('#models/party')
            const party = await Party.find(run.partyId)
            if (party) {
              party.status = 'waiting'
              party.dungeonRunId = null
              party.dungeonFloorId = null
              party.countdownStart = null
              await party.save()
            }
          }
          await character.save()
        }
      } else {
        run.status = 'victory'
        run.endedAt = DateTime.now()
        log.push({ action: 'victory' })
        DailyMissionService.trackProgress(character.id, 'dungeon_clear').catch(() => {})
        await this.trackDungeonFloorClearQuest(run, character)
        transmit.broadcast('game/notifications', {
          type: 'dungeon',
          message: `${character.name} a termine un donjon!`,
        })
        if (run.partyId) {
          const { default: Party } = await import('#models/party')
          const party = await Party.find(run.partyId)
          if (party) {
            party.status = 'waiting'
            party.dungeonRunId = null
            party.dungeonFloorId = null
            party.countdownStart = null
            await party.save()
          }
        }
      }
    } else {
      const nextEnemy = await this.getRandomFloorEnemy(floor)
      run.currentEnemyId = nextEnemy.id
      run.currentEnemyHp = nextEnemy.hp
      log.push({ action: 'new_enemy', enemyName: nextEnemy.name, enemyHp: nextEnemy.hp })
    }

    await character.save()

    // Group run log
    if (run.partyId) {
      const persistentLog = JSON.parse(run.combatLog || '[]')
      for (const entry of log) {
        persistentLog.push({ ...entry, characterName: character.name, characterId: character.id })
      }
      run.combatLog = JSON.stringify(persistentLog)

      if (run.status === 'in_progress') {
        const nextTurnId = await this.getNextTurnId(run, character.id)
        if (nextTurnId) {
          run.currentTurnId = nextTurnId
          this.setTurnDeadline(run, nextTurnId)
        } else {
          await this.handlePartyDefeat(run)
        }
      } else {
        run.currentTurnId = null
        run.turnDeadline = null
      }
    }

    await run.save()
    const currentEnemy = run.currentEnemyId ? await Enemy.find(run.currentEnemyId) : null

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: currentEnemy?.serialize() || null,
    }
  }
}
