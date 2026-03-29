import { DateTime } from 'luxon'
import Character from '#models/character'
import BossRushRun from '#models/boss_rush_run'
import Enemy from '#models/enemy'
import InventoryItem from '#models/inventory_item'
import EnemyLootTable from '#models/enemy_loot_table'
import CharacterBossRushSeasonStat from '#models/character_boss_rush_season_stat'
import Season from '#models/season'
import CombatSkill from '#models/combat_skill'
import CharacterTalent from '#models/character_talent'
import ClickerService from '#services/clicker_service'
import CompanionService from '#services/companion_service'
import TalentService from '#services/talent_service'
import SeasonService from '#services/season_service'
import CombatService from '#services/combat_service'

interface ActiveEffect {
  type: string
  value: number
  turnsLeft: number
  sourceCharId: number
  targetType: 'enemy' | 'player'
}

interface PendingRewardItem {
  itemId: number
  name: string
  rarity: string
  quantity: number
}

interface PendingRewardBucket {
  credits: number
  xp: number
  items: PendingRewardItem[]
}

interface ScaledEnemy {
  id: number
  name: string
  nameEn: string | null
  description: string
  descriptionEn: string | null
  icon: string
  tier: number
  hp: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  xpReward: number
  creditsRewardMin: number
  creditsRewardMax: number
}

export default class BossRushService {
  private static readonly STARTING_REVIVE_HP = 10

  static async getActiveSeasonOrFail() {
    const season = await SeasonService.getCurrentBossRushSeason()
    if (!season) {
      throw new Error('Boss Rush is disabled for the active season')
    }

    return season
  }

  static async getActiveRun(characterId: number) {
    return BossRushRun.query()
      .where('characterId', characterId)
      .where('status', 'in_progress')
      .orderBy('id', 'desc')
      .first()
  }

  static async startRun(character: Character) {
    const season = await this.getActiveSeasonOrFail()

    const activeRun = await this.getActiveRun(character.id)
    if (activeRun) {
      return activeRun
    }

    const run = await BossRushRun.create({
      characterId: character.id,
      seasonId: season.id,
      status: 'in_progress',
      currentFloor: 1,
      bossesDefeated: 0,
      currentEnemyId: null,
      currentEnemyHp: 0,
      combatLog: '[]',
      skillCooldowns: '{}',
      activeEffects: '[]',
      pendingRewards: '{}',
    })

    await this.spawnNextBoss(run)
    await run.save()

    return run
  }

  static async getCurrentEnemyState(run: BossRushRun) {
    if (!run.currentEnemyId) {
      const spawned = await this.spawnNextBoss(run)
      await run.save()
      return spawned
    }

    const enemy = await Enemy.find(run.currentEnemyId)
    if (!enemy) {
      const spawned = await this.spawnNextBoss(run)
      await run.save()
      return spawned
    }

    return {
      enemy,
      scaled: this.scaleEnemy(enemy, run.currentFloor),
    }
  }

  static getPendingRewardsForCharacter(run: BossRushRun, characterId: number) {
    const rewards = this.getPendingRewards(run)
    return (
      rewards[String(characterId)] || {
        credits: 0,
        xp: 0,
        items: [],
      }
    )
  }

  static async getSeasonRank(stat: CharacterBossRushSeasonStat) {
    const ahead = await CharacterBossRushSeasonStat.query()
      .where('seasonId', stat.seasonId)
      .whereHas('character', (query) =>
        query.whereHas('user', (userQuery) => userQuery.where('isGuest', false))
      )
      .where((query) => {
        query
          .where('bestFloor', '>', stat.bestFloor)
          .orWhere((subquery) => {
            subquery
              .where('bestFloor', stat.bestFloor)
              .where('totalBossesKilled', '>', stat.totalBossesKilled)
          })
          .orWhere((subquery) => {
            subquery
              .where('bestFloor', stat.bestFloor)
              .where('totalBossesKilled', stat.totalBossesKilled)
              .where('characterId', '<', stat.characterId)
          })
      })
      .count('* as total')

    return Number(ahead[0]?.$extras.total || 0) + 1
  }

  static async getLeaderboard(seasonId: number, limit = 25) {
    const rows = await CharacterBossRushSeasonStat.query()
      .where('seasonId', seasonId)
      .where('bestFloor', '>', 0)
      .preload('character')
      .whereHas('character', (query) =>
        query.whereHas('user', (userQuery) => userQuery.where('isGuest', false))
      )
      .orderBy('bestFloor', 'desc')
      .orderBy('totalBossesKilled', 'desc')
      .orderBy('characterId', 'asc')
      .limit(limit)

    return rows.map((entry) => ({
      id: entry.id,
      characterId: entry.characterId,
      name: entry.character.name,
      level: entry.character.level,
      bestFloor: entry.bestFloor,
      totalBossesKilled: entry.totalBossesKilled,
    }))
  }

  static async getSeasonHistory(characterId: number) {
    return CharacterBossRushSeasonStat.query()
      .where('characterId', characterId)
      .preload('season')
      .orderBy('id', 'desc')
      .limit(8)
  }

  static async claimSeasonReward(character: Character, statId: number) {
    const stat = await CharacterBossRushSeasonStat.query()
      .where('id', statId)
      .where('characterId', character.id)
      .preload('season')
      .firstOrFail()

    if (!stat.finalRank || stat.rewardCredits <= 0) {
      throw new Error('Aucune recompense disponible pour cette saison')
    }

    if (stat.rewardClaimed) {
      throw new Error('Cette recompense a deja ete recuperee')
    }

    character.credits += stat.rewardCredits
    await character.save()

    stat.rewardClaimed = true
    await stat.save()

    return stat
  }

  static async getCombatPreview(character: Character, run: BossRushRun) {
    const { scaled } = await this.getCurrentEnemyState(run)
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

    const enemyMods = this.applyEnemyModifiers(scaled, effects)

    return {
      player: {
        attack: Math.floor((playerMods.attack + bonuses.attackBonus) * combatMult),
        defense: Math.floor((playerMods.defense + bonuses.defenseBonus) * combatMult),
      },
      enemy: {
        attack: enemyMods.attack,
        defense: enemyMods.defense,
        isStunned: enemyMods.isStunned,
      },
    }
  }

  static async attack(character: Character, runId: number) {
    const run = await BossRushRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    const { enemy, scaled } = await this.getCurrentEnemyState(run)
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effectiveCritChance = Math.min(100, character.critChance + bonuses.critChanceBonus)
    let effects = this.getEffects(run)
    const log: any[] = []

    const tickResult = this.tickEffects(run)
    effects = tickResult.effects
    log.push(...tickResult.log)
    if (tickResult.dotDamage + tickResult.turretDamage > 0) {
      run.currentEnemyHp = Math.max(
        0,
        run.currentEnemyHp - tickResult.dotDamage - tickResult.turretDamage
      )
    }

    this.tickCooldowns(run, character.id)

    const baseAtk = character.attack + talentBonuses.atkFlat
    const baseDef = character.defense + talentBonuses.defFlat
    const combatMult = 1 + talentBonuses.combatPercent / 100
    const enemyMods = this.applyEnemyModifiers(scaled, effects)
    const playerMods = this.applyPlayerModifiers(
      { attack: baseAtk, defense: baseDef },
      effects,
      character.id
    )

    const rawPlayerAttack = Math.max(
      1,
      Math.floor((playerMods.attack + bonuses.attackBonus) * combatMult) - enemyMods.defense
    )
    const variance = Math.floor(Math.random() * Math.max(1, Math.floor(rawPlayerAttack * 0.3)))
    const basePlayerDamage = rawPlayerAttack + variance
    const forceCrit = this.hasGuaranteedCrit(effects, character.id)
    const playerHit = forceCrit
      ? {
          damage: Math.floor(basePlayerDamage * (character.critDamage / 100)),
          isCrit: true,
        }
      : this.rollCrit(effectiveCritChance, character.critDamage, basePlayerDamage)

    if (forceCrit) {
      effects = this.consumeEffect(effects, character.id, 'guaranteed_crit')
    }

    run.currentEnemyHp = Math.max(0, run.currentEnemyHp - playerHit.damage)
    log.push({
      action: 'player_attack',
      damage: playerHit.damage,
      isCrit: playerHit.isCrit,
      enemyHpLeft: run.currentEnemyHp,
    })

    this.setEffects(run, effects)

    if (run.currentEnemyHp <= 0) {
      return this.handleEnemyDeath(character, run, enemy, scaled, log, effects)
    }

    effects = await this.handleEnemyCounterAttack(run, scaled, effects, character, log)
    this.setEffects(run, effects)
    await character.save()
    this.appendLog(run, log)
    await run.save()

    const currentEnemy = await this.getCurrentEnemyState(run)

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: currentEnemy.scaled,
    }
  }

  static async useConsumable(character: Character, runId: number, inventoryItemId: number) {
    const run = await BossRushRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    const invItem = await InventoryItem.query()
      .where('id', inventoryItemId)
      .where('characterId', character.id)
      .preload('item')
      .firstOrFail()

    if (invItem.item.type !== 'consumable') {
      throw new Error('Not a consumable')
    }

    const log: any[] = []
    switch (invItem.item.effectType) {
      case 'hp_restore': {
        const effectiveHpMax = await CompanionService.getEffectiveHpMax(character)
        const healed = Math.min(invItem.item.effectValue || 0, effectiveHpMax - character.hpCurrent)
        character.hpCurrent += healed
        log.push({
          action: 'item_use',
          itemName: invItem.item.name,
          healed,
          playerHpLeft: character.hpCurrent,
        })
        break
      }
      default:
        log.push({
          action: 'item_use',
          itemName: invItem.item.name,
          message: `Used ${invItem.item.name}`,
        })
    }

    invItem.quantity -= 1
    if (invItem.quantity <= 0) {
      await invItem.delete()
    } else {
      await invItem.save()
    }

    await character.save()
    this.appendLog(run, log)
    await run.save()

    return { log, run: run.serialize(), character: character.serialize() }
  }

  static async useSkill(character: Character, runId: number, skillId: number) {
    const run = await BossRushRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    const skill = await CombatSkill.findOrFail(skillId)
    if (!character.chosenSpec || character.chosenSpec !== skill.spec) {
      throw new Error('Skill non disponible pour ta spec')
    }

    const unlocked = await CharacterTalent.query().where('characterId', character.id).preload('talent')
    const maxTier = unlocked.reduce((max, ct) => Math.max(max, ct.talent.tier), 0)
    if (maxTier < skill.tierRequired) {
      throw new Error('Talent requis non debloque')
    }

    const cooldowns = this.getCooldowns(run, character.id)
    if (cooldowns[skillId] && cooldowns[skillId] > 0) {
      throw new Error(`Skill en cooldown (${cooldowns[skillId]} tours)`)
    }

    const { enemy, scaled } = await this.getCurrentEnemyState(run)
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effectiveCritChance = Math.min(100, character.critChance + bonuses.critChanceBonus)
    let effects = this.getEffects(run)
    const log: any[] = []

    const tickResult = this.tickEffects(run)
    effects = tickResult.effects
    log.push(...tickResult.log)
    if (tickResult.dotDamage + tickResult.turretDamage > 0) {
      run.currentEnemyHp = Math.max(
        0,
        run.currentEnemyHp - tickResult.dotDamage - tickResult.turretDamage
      )
    }

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
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.5)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'debuff_def': {
        effects.push({ type: 'debuff_def', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'enemy' })
        log.push({ action: 'skill_use', skillName: skill.name, message: `DEF ennemi -${skill.effectValue}% pendant ${skill.duration} tours` })
        break
      }
      case 'debuff_atk': {
        effects.push({ type: 'debuff_atk', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'enemy' })
        log.push({ action: 'skill_use', skillName: skill.name, message: `ATK ennemi -${skill.effectValue}% pendant ${skill.duration} tours` })
        break
      }
      case 'steal_damage': {
        const enemyMods = this.applyEnemyModifiers(scaled, effects)
        const dmg = Math.max(1, skill.effectValue + effectiveAtk - enemyMods.defense)
        const stolen = Math.floor(dmg * 0.5)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        character.credits += stolen
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, stolen, enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'damage_stun': {
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.3)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        effects.push({ type: 'stun', value: 0, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'enemy' })
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, stun: true, enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'guaranteed_crit': {
        effects.push({ type: 'guaranteed_crit', value: 0, turnsLeft: 2, sourceCharId: character.id, targetType: 'player' })
        log.push({ action: 'skill_use', skillName: skill.name, message: 'Prochaine attaque = critique garanti' })
        break
      }
      case 'purge_damage': {
        effects = effects.filter((e) => e.targetType !== 'enemy' || e.type === 'dot' || e.type === 'turret')
        const dmg = skill.effectValue + Math.floor(effectiveAtk * 0.3)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, message: 'Protections ennemies purgees', enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'heal_percent': {
        const effectiveHpMax = await CompanionService.getEffectiveHpMax(character)
        const healed = Math.floor((effectiveHpMax * skill.effectValue) / 100)
        const actualHeal = Math.min(healed, effectiveHpMax - character.hpCurrent)
        character.hpCurrent = Math.min(effectiveHpMax, character.hpCurrent + healed)
        log.push({ action: 'skill_use', skillName: skill.name, healed: actualHeal, message: `+${actualHeal} HP` })
        break
      }
      case 'double_hit': {
        const enemyMods = this.applyEnemyModifiers(scaled, effects)
        for (let i = 0; i < 2; i++) {
          const rawDmg = Math.max(1, effectiveAtk - enemyMods.defense)
          const variance = Math.floor(Math.random() * Math.max(1, Math.floor(rawDmg * 0.3)))
          const hit = this.rollCrit(effectiveCritChance, character.critDamage, rawDmg + variance)
          run.currentEnemyHp = Math.max(0, run.currentEnemyHp - hit.damage)
          log.push({ action: 'skill_use', skillName: `${skill.name} #${i + 1}`, damage: hit.damage, isCrit: hit.isCrit, enemyHpLeft: run.currentEnemyHp })
        }
        break
      }
      case 'damage_dot': {
        const enemyMods = this.applyEnemyModifiers(scaled, effects)
        const dmg = Math.max(1, skill.effectValue + effectiveAtk - enemyMods.defense)
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        const dotDmg = Math.floor(dmg * 0.3)
        effects.push({ type: 'dot', value: dotDmg, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'enemy' })
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, dot: dotDmg, duration: skill.duration, enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'shield': {
        effects.push({ type: 'shield', value: 0, turnsLeft: 2, sourceCharId: character.id, targetType: 'player' })
        log.push({ action: 'skill_use', skillName: skill.name, message: 'Bouclier actif — prochain coup absorbe' })
        break
      }
      case 'mega_strike': {
        const enemyMods = this.applyEnemyModifiers(scaled, effects)
        const rawDmg = Math.max(1, effectiveAtk - enemyMods.defense)
        const dmg = Math.floor(rawDmg * 3 * (character.critDamage / 100))
        run.currentEnemyHp = Math.max(0, run.currentEnemyHp - dmg)
        log.push({ action: 'skill_use', skillName: skill.name, damage: dmg, isCrit: true, enemyHpLeft: run.currentEnemyHp })
        break
      }
      case 'turret': {
        effects.push({ type: 'turret', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'enemy' })
        log.push({ action: 'skill_use', skillName: skill.name, message: `Tourelle deployee — ${skill.effectValue} degats/tour pendant ${skill.duration} tours` })
        break
      }
      case 'buff_all': {
        effects.push({ type: 'buff_all', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetType: 'player' })
        log.push({ action: 'skill_use', skillName: skill.name, message: `ATK et DEF +${skill.effectValue}% pendant ${skill.duration} tours` })
        break
      }
      default:
        throw new Error('Skill effect non supporte')
    }

    this.setCooldown(run, character.id, skillId, skill.cooldown)
    this.tickCooldowns(run, character.id)
    this.setEffects(run, effects)

    if (run.currentEnemyHp <= 0) {
      return this.handleEnemyDeath(character, run, enemy, scaled, log, effects)
    }

    const enemyMods = this.applyEnemyModifiers(scaled, effects)
    if (!enemyMods.isStunned) {
      effects = await this.handleEnemyCounterAttack(run, scaled, effects, character, log)
    } else {
      log.push({ action: 'enemy_stunned', message: "L'ennemi est paralyse!" })
    }

    this.setEffects(run, effects)
    await character.save()
    this.appendLog(run, log)
    await run.save()

    const currentEnemy = await this.getCurrentEnemyState(run)

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: currentEnemy.scaled,
    }
  }

  static async flee(character: Character, runId: number) {
    const run = await BossRushRun.findOrFail(runId)
    await this.validateRunAccess(character, run)

    run.status = 'fled'
    run.endedAt = DateTime.now()
    await this.claimPendingRewards(run, character)
    await this.updateSeasonStats(run, character)
    this.appendLog(run, [{ action: 'fled' }])
    await run.save()

    return { run: run.serialize(), character: character.serialize() }
  }

  private static async handleEnemyDeath(
    character: Character,
    run: BossRushRun,
    enemy: Enemy,
    scaled: ScaledEnemy,
    log: any[],
    effects: ActiveEffect[]
  ) {
    run.bossesDefeated += 1

    const creditsReward = Math.floor(
      Math.random() * (scaled.creditsRewardMax - scaled.creditsRewardMin + 1) + scaled.creditsRewardMin
    )
    const loot = await this.rollLoot(enemy.id)
    this.queuePendingRewards(run, character.id, {
      creditsReward,
      xpReward: scaled.xpReward,
      loot,
    })

    log.push({
      action: 'enemy_defeated',
      creditsReward,
      xpReward: scaled.xpReward,
      loot: loot.map((entry) => ({ name: entry.name, rarity: entry.rarity })),
    })

    effects = effects.filter((entry) => entry.targetType !== 'enemy')
    this.setEffects(run, effects)

    run.currentFloor += 1
    const next = await this.spawnNextBoss(run)
    log.push({
      action: 'new_enemy',
      enemyName: next.enemy.name,
      enemyHp: next.scaled.hp,
    })

    this.appendLog(run, log)
    await run.save()

    return {
      log,
      run: run.serialize(),
      character: character.serialize(),
      currentEnemy: next.scaled,
    }
  }

  private static async handleEnemyCounterAttack(
    run: BossRushRun,
    enemy: ScaledEnemy,
    effects: ActiveEffect[],
    character: Character,
    log: any[]
  ) {
    const bonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const targetCombatMult = 1 + talentBonuses.combatPercent / 100
    const targetMods = this.applyPlayerModifiers(
      {
        attack: character.attack + talentBonuses.atkFlat,
        defense: character.defense + talentBonuses.defFlat,
      },
      effects,
      character.id
    )

    const shielded = this.hasShield(effects, character.id)
    if (shielded) {
      log.push({
        action: 'enemy_attack',
        damage: 0,
        blocked: true,
        playerHpLeft: character.hpCurrent,
        defenderId: character.id,
        defenderName: character.name,
      })
      return this.consumeEffect(effects, character.id, 'shield')
    }

    const enemyMods = this.applyEnemyModifiers(enemy, effects)
    const effectiveDef = Math.floor((targetMods.defense + bonuses.defenseBonus) * targetCombatMult)
    const rawEnemyAttack = Math.max(1, enemyMods.attack - effectiveDef)
    const enemyVariance = Math.floor(Math.random() * Math.max(1, Math.floor(rawEnemyAttack * 0.3)))
    const baseEnemyDamage = rawEnemyAttack + enemyVariance
    const enemyHit = this.rollCrit(enemyMods.critChance, enemyMods.critDamage, baseEnemyDamage)

    character.hpCurrent = Math.max(0, character.hpCurrent - enemyHit.damage)
    log.push({
      action: 'enemy_attack',
      damage: enemyHit.damage,
      isCrit: enemyHit.isCrit,
      playerHpLeft: character.hpCurrent,
      defenderId: character.id,
      defenderName: character.name,
    })

    if (character.hpCurrent <= 0) {
      run.status = 'defeat'
      run.endedAt = DateTime.now()
      character.hpCurrent = Math.min(character.hpMax, this.STARTING_REVIVE_HP)
      await this.claimPendingRewards(run, character)
      await this.updateSeasonStats(run, character)
      log.push({
        action: 'defeat',
        defenderId: character.id,
        defenderName: character.name,
        revivedHp: character.hpCurrent,
      })
    }

    return effects
  }

  private static async updateSeasonStats(run: BossRushRun, character: Character) {
    if (!run.seasonId) return

    const season = await Season.find(run.seasonId)
    if (!season) {
      return
    }

    const stat = await SeasonService.getOrCreateBossRushSeasonStat(character, season)
    stat.runsPlayed += 1
    stat.totalBossesKilled += run.bossesDefeated
    stat.bestFloor = Math.max(stat.bestFloor, run.bossesDefeated)
    await stat.save()
  }

  private static async validateRunAccess(character: Character, run: BossRushRun) {
    if (run.status !== 'in_progress' || run.characterId !== character.id) {
      throw new Error('Invalid run')
    }
  }

  private static async spawnNextBoss(run: BossRushRun) {
    const enemy = await this.pickEnemyForFloor(run.currentFloor)
    const scaled = this.scaleEnemy(enemy, run.currentFloor)
    run.currentEnemyId = enemy.id
    run.currentEnemyHp = scaled.hp

    return { enemy, scaled }
  }

  private static async pickEnemyForFloor(floor: number) {
    const enemies = await Enemy.query().orderBy('tier', 'asc').orderBy('id', 'asc')
    if (enemies.length === 0) {
      throw new Error('No enemies configured')
    }

    const maxTier = enemies.reduce((max, enemy) => Math.max(max, enemy.tier), 1)
    const targetTier = Math.min(maxTier, 1 + Math.floor((floor - 1) / 4))
    const pool =
      enemies.filter((enemy) => enemy.tier >= Math.max(1, targetTier - 1) && enemy.tier <= targetTier + 1) ||
      enemies

    return pool[Math.floor(Math.random() * pool.length)] || enemies[0]
  }

  private static scaleEnemy(enemy: Enemy, floor: number): ScaledEnemy {
    const depth = Math.max(0, floor - 1)
    const hp = Math.floor(enemy.hp * Math.pow(1.18, depth))
    const attack = Math.floor(enemy.attack * Math.pow(1.08, depth))
    const defense = Math.floor(enemy.defense * Math.pow(1.06, depth))
    const xpReward = Math.floor(enemy.xpReward * Math.pow(1.12, depth))
    const creditsRewardMin = Math.floor(enemy.creditsRewardMin * Math.pow(1.1, depth))
    const creditsRewardMax = Math.max(
      creditsRewardMin,
      Math.floor(enemy.creditsRewardMax * Math.pow(1.1, depth))
    )

    return {
      id: enemy.id,
      name: enemy.name,
      nameEn: enemy.nameEn,
      description: enemy.description,
      descriptionEn: enemy.descriptionEn,
      icon: enemy.icon,
      tier: enemy.tier,
      hp,
      attack,
      defense,
      critChance: Math.min(65, enemy.critChance + Math.floor(depth / 3)),
      critDamage: enemy.critDamage + Math.floor(depth / 2),
      xpReward,
      creditsRewardMin,
      creditsRewardMax,
    }
  }

  private static appendLog(run: BossRushRun, log: any[]) {
    const persistentLog = JSON.parse(run.combatLog || '[]')
    persistentLog.push(...log)
    run.combatLog = JSON.stringify(persistentLog)
  }

  private static getPendingRewards(run: BossRushRun): Record<string, PendingRewardBucket> {
    try {
      const parsed = JSON.parse(run.pendingRewards || '{}') as Record<string, PendingRewardBucket>
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  private static setPendingRewards(run: BossRushRun, rewards: Record<string, PendingRewardBucket>) {
    run.pendingRewards = JSON.stringify(rewards)
  }

  private static queuePendingRewards(
    run: BossRushRun,
    characterId: number,
    reward: { creditsReward: number; xpReward: number; loot: { itemId: number; name: string; rarity: string }[] }
  ) {
    const rewards = this.getPendingRewards(run)
    const key = String(characterId)
    const bucket = rewards[key] || { credits: 0, xp: 0, items: [] }

    bucket.credits += reward.creditsReward
    bucket.xp += reward.xpReward

    for (const loot of reward.loot) {
      const existing = bucket.items.find((entry) => entry.itemId === loot.itemId)
      if (existing) {
        existing.quantity += 1
      } else {
        bucket.items.push({
          itemId: loot.itemId,
          name: loot.name,
          rarity: loot.rarity,
          quantity: 1,
        })
      }
    }

    rewards[key] = bucket
    this.setPendingRewards(run, rewards)
  }

  private static async claimPendingRewards(run: BossRushRun, currentCharacter?: Character) {
    const rewards = this.getPendingRewards(run)

    for (const [characterIdKey, bucket] of Object.entries(rewards)) {
      const characterId = Number(characterIdKey)
      if (!characterId) continue

      const character =
        currentCharacter && currentCharacter.id === characterId
          ? currentCharacter
          : await Character.find(characterId)
      if (!character) continue

      character.credits += bucket.credits
      character.xp += bucket.xp

      while (character.xp >= character.level * 100) {
        character.levelUp()
        await CompanionService.refillHpAfterLevelUp(character)
      }

      await character.save()

      for (const item of bucket.items) {
        const existing = await InventoryItem.query()
          .where('characterId', character.id)
          .where('itemId', item.itemId)
          .first()

        if (existing) {
          existing.quantity += item.quantity
          await existing.save()
        } else {
          await InventoryItem.create({
            characterId: character.id,
            itemId: item.itemId,
            quantity: item.quantity,
            isEquipped: false,
          })
        }
      }
    }
  }

  private static async rollLoot(enemyId: number) {
    const lootTable = await EnemyLootTable.query().where('enemyId', enemyId).preload('item')
    const drops: { itemId: number; name: string; rarity: string }[] = []

    for (const entry of lootTable) {
      if (Math.random() <= entry.dropChance) {
        drops.push({ itemId: entry.itemId, name: entry.item.name, rarity: entry.item.rarity })
      }
    }

    return drops
  }

  static async getAvailableSkills(character: Character) {
    return CombatService.getAvailableSkills(character)
  }

  private static rollCrit(critChance: number, critDamage: number, baseDamage: number) {
    const isCrit = Math.random() * 100 < critChance
    if (isCrit) {
      return { damage: Math.floor(baseDamage * (critDamage / 100)), isCrit: true }
    }
    return { damage: baseDamage, isCrit: false }
  }

  private static getCooldowns(run: BossRushRun, characterId: number): Record<number, number> {
    const all = JSON.parse(run.skillCooldowns || '{}')
    return all[characterId] || {}
  }

  private static setCooldown(run: BossRushRun, characterId: number, skillId: number, turns: number) {
    const all = JSON.parse(run.skillCooldowns || '{}')
    if (!all[characterId]) all[characterId] = {}
    all[characterId][skillId] = turns
    run.skillCooldowns = JSON.stringify(all)
  }

  private static tickCooldowns(run: BossRushRun, characterId: number) {
    const all = JSON.parse(run.skillCooldowns || '{}')
    const cd = all[characterId] || {}
    for (const skillId of Object.keys(cd)) {
      cd[skillId] = Math.max(0, cd[skillId] - 1)
    }
    all[characterId] = cd
    run.skillCooldowns = JSON.stringify(all)
  }

  private static getEffects(run: BossRushRun): ActiveEffect[] {
    return JSON.parse(run.activeEffects || '[]')
  }

  private static setEffects(run: BossRushRun, effects: ActiveEffect[]) {
    run.activeEffects = JSON.stringify(effects)
  }

  private static applyEnemyModifiers(
    enemy: { attack: number; defense: number; critChance: number; critDamage: number },
    effects: ActiveEffect[]
  ) {
    let atkMod = 0
    let defMod = 0
    for (const effect of effects) {
      if (effect.targetType !== 'enemy') continue
      if (effect.type === 'debuff_def') defMod += effect.value
      if (effect.type === 'debuff_atk') atkMod += effect.value
      if (effect.type === 'stun') atkMod = 100
    }

    return {
      attack: Math.max(0, Math.floor(enemy.attack * (1 - atkMod / 100))),
      defense: Math.max(0, Math.floor(enemy.defense * (1 - defMod / 100))),
      critChance: enemy.critChance,
      critDamage: enemy.critDamage,
      isStunned: effects.some(
        (effect) => effect.targetType === 'enemy' && effect.type === 'stun' && effect.turnsLeft > 0
      ),
    }
  }

  private static applyPlayerModifiers(
    character: { attack: number; defense: number },
    effects: ActiveEffect[],
    charId: number
  ) {
    let atkBonus = 0
    let defBonus = 0
    for (const effect of effects) {
      if (effect.targetType !== 'player' || effect.sourceCharId !== charId) continue
      if (effect.type === 'buff_atk' || effect.type === 'buff_all') atkBonus += effect.value
      if (effect.type === 'buff_def' || effect.type === 'buff_all') defBonus += effect.value
    }

    return {
      attack: Math.floor(character.attack * (1 + atkBonus / 100)),
      defense: Math.floor(character.defense * (1 + defBonus / 100)),
    }
  }

  private static hasGuaranteedCrit(effects: ActiveEffect[], charId: number) {
    return effects.some(
      (effect) =>
        effect.targetType === 'player' &&
        effect.sourceCharId === charId &&
        effect.type === 'guaranteed_crit' &&
        effect.turnsLeft > 0
    )
  }

  private static hasShield(effects: ActiveEffect[], charId: number) {
    return effects.some(
      (effect) =>
        effect.targetType === 'player' &&
        effect.sourceCharId === charId &&
        effect.type === 'shield' &&
        effect.turnsLeft > 0
    )
  }

  private static consumeEffect(effects: ActiveEffect[], charId: number, type: string) {
    return effects.map((effect) => {
      if (effect.targetType === 'player' && effect.sourceCharId === charId && effect.type === type) {
        return { ...effect, turnsLeft: 0 }
      }
      return effect
    })
  }

  private static tickEffects(run: BossRushRun) {
    let effects = this.getEffects(run)
    const log: any[] = []
    let dotDamage = 0
    let turretDamage = 0

    for (const effect of effects) {
      if (effect.turnsLeft <= 0) continue
      if (effect.type === 'dot' && effect.targetType === 'enemy') {
        dotDamage += effect.value
        log.push({ action: 'skill_effect', effectType: 'dot', damage: effect.value, message: `Saignement: -${effect.value} HP` })
      }
      if (effect.type === 'turret' && effect.targetType === 'enemy') {
        turretDamage += effect.value
        log.push({ action: 'skill_effect', effectType: 'turret', damage: effect.value, message: `Tourelle: -${effect.value} HP` })
      }
    }

    effects = effects
      .map((effect) => ({ ...effect, turnsLeft: effect.turnsLeft - 1 }))
      .filter((effect) => effect.turnsLeft > 0)

    return { effects, log, dotDamage, turretDamage }
  }
}
