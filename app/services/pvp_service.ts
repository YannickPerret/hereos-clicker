import Character from '#models/character'
import CharacterTalent from '#models/character_talent'
import CombatSkill from '#models/combat_skill'
import PvpMatch from '#models/pvp_match'
import ClickerService from '#services/clicker_service'
import transmit from '@adonisjs/transmit/services/main'

interface PvpActiveEffect {
  type: string
  value: number
  turnsLeft: number
  sourceCharId: number
  targetCharId: number
}

export default class PvpService {
  private static rollCrit(critChance: number, critDamage: number, baseDamage: number) {
    const isCrit = Math.random() * 100 < critChance
    return isCrit
      ? { damage: Math.floor(baseDamage * (critDamage / 100)), isCrit: true }
      : { damage: baseDamage, isCrit: false }
  }

  private static getLog(match: PvpMatch) {
    return JSON.parse(match.log || '[]')
  }

  private static setLog(match: PvpMatch, log: any[]) {
    match.log = JSON.stringify(log)
  }

  private static getEffects(match: PvpMatch): PvpActiveEffect[] {
    return JSON.parse(match.activeEffects || '[]')
  }

  private static setEffects(match: PvpMatch, effects: PvpActiveEffect[]) {
    match.activeEffects = JSON.stringify(effects)
  }

  private static getCooldowns(match: PvpMatch, characterId: number): Record<number, number> {
    const all = JSON.parse(match.skillCooldowns || '{}')
    return all[characterId] || {}
  }

  private static setCooldown(match: PvpMatch, characterId: number, skillId: number, turns: number) {
    const all = JSON.parse(match.skillCooldowns || '{}')
    if (!all[characterId]) all[characterId] = {}
    all[characterId][skillId] = turns
    match.skillCooldowns = JSON.stringify(all)
  }

  private static tickCooldowns(match: PvpMatch, characterId: number) {
    const all = JSON.parse(match.skillCooldowns || '{}')
    const cooldowns = all[characterId] || {}

    for (const skillId of Object.keys(cooldowns)) {
      cooldowns[skillId] = Math.max(0, cooldowns[skillId] - 1)
    }

    all[characterId] = cooldowns
    match.skillCooldowns = JSON.stringify(all)
  }

  private static getHp(match: PvpMatch, characterId: number) {
    return match.challengerId === characterId ? match.challengerHp : match.defenderHp
  }

  private static getHpMax(match: PvpMatch, characterId: number) {
    return match.challengerId === characterId ? match.challengerHpMax : match.defenderHpMax
  }

  private static setHp(match: PvpMatch, characterId: number, hp: number) {
    if (match.challengerId === characterId) {
      match.challengerHp = Math.max(0, hp)
      return
    }

    match.defenderHp = Math.max(0, hp)
  }

  private static getOpponentId(match: PvpMatch, characterId: number) {
    return match.challengerId === characterId ? match.defenderId : match.challengerId
  }

  private static applyModifiers(stats: { attack: number; defense: number }, effects: PvpActiveEffect[], characterId: number) {
    let attackMod = 0
    let defenseMod = 0

    for (const effect of effects) {
      if (effect.targetCharId !== characterId || effect.turnsLeft <= 0) continue

      if (effect.type === 'debuff_atk') attackMod -= effect.value
      if (effect.type === 'debuff_def') defenseMod -= effect.value
      if (effect.type === 'buff_atk' || effect.type === 'buff_all') attackMod += effect.value
      if (effect.type === 'buff_def' || effect.type === 'buff_all') defenseMod += effect.value
    }

    return {
      attack: Math.max(1, Math.floor(stats.attack * (1 + attackMod / 100))),
      defense: Math.max(0, Math.floor(stats.defense * (1 + defenseMod / 100))),
    }
  }

  private static hasEffect(effects: PvpActiveEffect[], targetCharId: number, type: string) {
    return effects.some((effect) => effect.targetCharId === targetCharId && effect.type === type && effect.turnsLeft > 0)
  }

  private static consumeEffect(effects: PvpActiveEffect[], targetCharId: number, type: string) {
    let consumed = false

    return effects.filter((effect) => {
      if (!consumed && effect.targetCharId === targetCharId && effect.type === type && effect.turnsLeft > 0) {
        consumed = true
        return false
      }

      return true
    })
  }

  private static removePurgeableEffects(effects: PvpActiveEffect[], targetCharId: number) {
    return effects.filter((effect) => {
      if (effect.targetCharId !== targetCharId) return true
      return !['buff_atk', 'buff_def', 'buff_all', 'shield', 'guaranteed_crit'].includes(effect.type)
    })
  }

  private static applyDamage(
    match: PvpMatch,
    effects: PvpActiveEffect[],
    defender: Character,
    damage: number
  ) {
    if (this.hasEffect(effects, defender.id, 'shield')) {
      return {
        damage: 0,
        blocked: true,
        effects: this.consumeEffect(effects, defender.id, 'shield'),
      }
    }

    this.setHp(match, defender.id, this.getHp(match, defender.id) - damage)

    return {
      damage,
      blocked: false,
      effects,
    }
  }

  private static async prepareTurn(match: PvpMatch): Promise<PvpMatch> {
    if (match.status !== 'in_progress' || !match.currentTurnId || !match.defenderId) {
      return match
    }

    const actor = await Character.findOrFail(match.currentTurnId)
    const opponentId = this.getOpponentId(match, actor.id)
    if (!opponentId) return match

    const opponent = await Character.findOrFail(opponentId)
    let effects = this.getEffects(match)
    const log = this.getLog(match)

    this.tickCooldowns(match, actor.id)

    for (const effect of effects) {
      if (effect.sourceCharId !== actor.id || effect.turnsLeft <= 0) continue
      if (effect.type !== 'dot' && effect.type !== 'turret') continue

      const applied = this.applyDamage(match, effects, opponent, effect.value)
      effects = applied.effects

      log.push({
        action: 'skill_effect',
        attackerId: actor.id,
        attackerName: actor.name,
        defenderId: opponent.id,
        defenderName: opponent.name,
        effectType: effect.type,
        damage: applied.damage,
        blocked: applied.blocked,
        message: effect.type === 'dot' ? `Saignement: -${applied.damage} HP` : `Tourelle: -${applied.damage} HP`,
        challengerHp: match.challengerHp,
        defenderHp: match.defenderHp,
      })

      if (this.getHp(match, opponent.id) <= 0) {
        this.setLog(match, log)
        this.setEffects(match, effects)
        await this.endMatch(match, actor, opponent, log)
        return match
      }
    }

    effects = effects
      .map((effect) => (
        effect.sourceCharId === actor.id
          ? { ...effect, turnsLeft: effect.turnsLeft - 1 }
          : effect
      ))
      .filter((effect) => effect.turnsLeft > 0)

    if (this.hasEffect(effects, actor.id, 'stun')) {
      effects = this.consumeEffect(effects, actor.id, 'stun')
      log.push({
        action: 'stunned',
        attackerId: opponent.id,
        attackerName: opponent.name,
        defenderId: actor.id,
        defenderName: actor.name,
        message: `${actor.name} est neutralise et perd son tour`,
        challengerHp: match.challengerHp,
        defenderHp: match.defenderHp,
      })
      this.setLog(match, log)
      this.setEffects(match, effects)
      match.currentTurnId = opponent.id
      await match.save()
      return this.prepareTurn(match)
    }

    this.setLog(match, log)
    this.setEffects(match, effects)
    await match.save()
    return match
  }

  private static async advanceTurn(match: PvpMatch, nextCharacterId: number) {
    match.currentTurnId = nextCharacterId
    await match.save()
    return this.prepareTurn(match)
  }

  private static async validateSkill(character: Character, match: PvpMatch, skillId: number) {
    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    if (match.currentTurnId !== character.id) {
      throw new Error('Ce n\'est pas ton tour')
    }

    const skill = await CombatSkill.findOrFail(skillId)

    if (!character.chosenSpec || character.chosenSpec !== skill.spec) {
      throw new Error('Skill non disponible pour ta spec')
    }

    const unlocked = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent')

    const maxTier = unlocked.reduce((max, entry) => Math.max(max, entry.talent.tier), 0)
    if (maxTier < skill.tierRequired) {
      throw new Error('Talent requis non debloque')
    }

    const cooldowns = this.getCooldowns(match, character.id)
    if (cooldowns[skillId] && cooldowns[skillId] > 0) {
      throw new Error(`Skill en cooldown (${cooldowns[skillId]} tours)`)
    }

    return skill
  }

  /** Find or create a match (matchmaking queue) */
  static async joinQueue(character: Character): Promise<PvpMatch> {
    const active = await PvpMatch.query()
      .where((q) => {
        q.where('challengerId', character.id).orWhere('defenderId', character.id)
      })
      .whereIn('status', ['waiting', 'in_progress'])
      .first()

    if (active) return active

    const waiting = await PvpMatch.query()
      .where('status', 'waiting')
      .where('challengerId', '!=', character.id)
      .orderBy('createdAt', 'asc')
      .first()

    if (waiting) {
      const challenger = await Character.findOrFail(waiting.challengerId)

      waiting.defenderId = character.id
      waiting.status = 'in_progress'
      waiting.challengerHp = challenger.hpMax
      waiting.challengerHpMax = challenger.hpMax
      waiting.defenderHp = character.hpMax
      waiting.defenderHpMax = character.hpMax
      waiting.currentTurnId = challenger.id
      waiting.log = '[]'
      waiting.skillCooldowns = '{}'
      waiting.activeEffects = '[]'
      await waiting.save()

      transmit.broadcast(`pvp/match/${waiting.id}`, {
        type: 'match_start',
        matchId: waiting.id,
        challenger: { id: challenger.id, name: challenger.name },
        defender: { id: character.id, name: character.name },
      })

      transmit.broadcast('game/notifications', {
        type: 'pvp',
        message: `${challenger.name} vs ${character.name} — Combat PvP en cours!`,
      })

      return waiting
    }

    return PvpMatch.create({
      challengerId: character.id,
      status: 'waiting',
      challengerHp: character.hpMax,
      challengerHpMax: character.hpMax,
      defenderHp: 0,
      defenderHpMax: 0,
      log: '[]',
      skillCooldowns: '{}',
      activeEffects: '[]',
      ratingChange: 0,
    })
  }

  /** Cancel waiting in queue */
  static async leaveQueue(character: Character) {
    const waiting = await PvpMatch.query()
      .where('challengerId', character.id)
      .where('status', 'waiting')
      .first()

    if (waiting) {
      waiting.status = 'cancelled'
      await waiting.save()
    }
  }

  /** Process an attack turn */
  static async attack(character: Character, matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)

    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    if (match.currentTurnId !== character.id) {
      throw new Error('Ce n\'est pas ton tour')
    }

    const opponentId = this.getOpponentId(match, character.id)
    if (!opponentId) {
      throw new Error('Adversaire introuvable')
    }

    const opponent = await Character.findOrFail(opponentId)
    let effects = this.getEffects(match)
    const log = this.getLog(match)

    const attackerBonuses = await ClickerService.calculateEquipBonuses(character)
    const defenderBonuses = await ClickerService.calculateEquipBonuses(opponent)

    const attackerStats = this.applyModifiers({
      attack: character.attack + attackerBonuses.attackBonus,
      defense: character.defense + attackerBonuses.defenseBonus,
    }, effects, character.id)

    const defenderStats = this.applyModifiers({
      attack: opponent.attack + defenderBonuses.attackBonus,
      defense: opponent.defense + defenderBonuses.defenseBonus,
    }, effects, opponent.id)

    const rawDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
    const variance = Math.floor(Math.random() * Math.max(1, Math.floor(rawDamage * 0.3)))
    const forceCrit = this.hasEffect(effects, character.id, 'guaranteed_crit')
    const hit = forceCrit
      ? { damage: Math.floor((rawDamage + variance) * (character.critDamage / 100)), isCrit: true }
      : this.rollCrit(character.critChance, character.critDamage, rawDamage + variance)

    if (forceCrit) {
      effects = this.consumeEffect(effects, character.id, 'guaranteed_crit')
    }

    const applied = this.applyDamage(match, effects, opponent, hit.damage)
    effects = applied.effects

    log.push({
      action: 'player_attack',
      round: log.length + 1,
      attackerId: character.id,
      attackerName: character.name,
      defenderId: opponent.id,
      defenderName: opponent.name,
      damage: applied.damage,
      blocked: applied.blocked,
      isCrit: !applied.blocked && hit.isCrit,
      challengerHp: match.challengerHp,
      defenderHp: match.defenderHp,
    })

    this.setLog(match, log)
    this.setEffects(match, effects)

    if (this.getHp(match, opponent.id) <= 0) {
      return this.endMatch(match, character, opponent, log)
    }

    await this.advanceTurn(match, opponent.id)
    return { match, log: log[log.length - 1] }
  }

  static async useSkill(character: Character, matchId: number, skillId: number) {
    const match = await PvpMatch.findOrFail(matchId)
    const skill = await this.validateSkill(character, match, skillId)
    const opponentId = this.getOpponentId(match, character.id)

    if (!opponentId) {
      throw new Error('Adversaire introuvable')
    }

    const opponent = await Character.findOrFail(opponentId)
    const attackerBonuses = await ClickerService.calculateEquipBonuses(character)
    const defenderBonuses = await ClickerService.calculateEquipBonuses(opponent)
    let effects = this.getEffects(match)
    const log = this.getLog(match)

    const attackerStats = this.applyModifiers({
      attack: character.attack + attackerBonuses.attackBonus,
      defense: character.defense + attackerBonuses.defenseBonus,
    }, effects, character.id)

    const defenderStats = this.applyModifiers({
      attack: opponent.attack + defenderBonuses.attackBonus,
      defense: opponent.defense + defenderBonuses.defenseBonus,
    }, effects, opponent.id)

    switch (skill.effectType) {
      case 'pure_damage': {
        const applied = this.applyDamage(match, effects, opponent, skill.effectValue + Math.floor(attackerStats.attack * 0.5))
        effects = applied.effects
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'debuff_def': {
        effects.push({ type: 'debuff_def', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: opponent.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: `DEF adverse -${skill.effectValue}% pendant ${skill.duration} tours`,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'debuff_atk': {
        effects.push({ type: 'debuff_atk', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: opponent.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: `ATK adverse -${skill.effectValue}% pendant ${skill.duration} tours`,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'steal_damage': {
        const baseDamage = Math.max(1, skill.effectValue + attackerStats.attack - defenderStats.defense)
        const applied = this.applyDamage(match, effects, opponent, baseDamage)
        effects = applied.effects
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          message: applied.blocked ? 'Bouclier adverse absorbe le siphon' : 'Le systeme adverse est siphonne',
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'damage_stun': {
        const applied = this.applyDamage(match, effects, opponent, skill.effectValue + Math.floor(attackerStats.attack * 0.3))
        effects = applied.effects
        if (!applied.blocked) {
          effects.push({ type: 'stun', value: 0, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: opponent.id })
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          stun: !applied.blocked,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'guaranteed_crit': {
        effects.push({ type: 'guaranteed_crit', value: 0, turnsLeft: 2, sourceCharId: character.id, targetCharId: character.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: 'Prochaine attaque = critique garanti',
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'purge_damage': {
        effects = this.removePurgeableEffects(effects, opponent.id)
        const applied = this.applyDamage(match, effects, opponent, skill.effectValue + Math.floor(attackerStats.attack * 0.3))
        effects = applied.effects
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          message: 'Buffs adverses purges',
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'heal_percent': {
        const healed = Math.floor(this.getHpMax(match, character.id) * skill.effectValue / 100)
        const hpBefore = this.getHp(match, character.id)
        const hpAfter = Math.min(this.getHpMax(match, character.id), hpBefore + healed)
        this.setHp(match, character.id, hpAfter)
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          healed: hpAfter - hpBefore,
          message: `+${hpAfter - hpBefore} HP`,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'double_hit': {
        for (let index = 0; index < 2; index++) {
          const baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
          const variance = Math.floor(Math.random() * Math.max(1, Math.floor(baseDamage * 0.3)))
          const hit = this.rollCrit(character.critChance, character.critDamage, baseDamage + variance)
          const applied = this.applyDamage(match, effects, opponent, hit.damage)
          effects = applied.effects
          log.push({
            action: 'skill_use',
            attackerId: character.id,
            attackerName: character.name,
            defenderId: opponent.id,
            defenderName: opponent.name,
            skillName: `${skill.name} #${index + 1}`,
            damage: applied.damage,
            blocked: applied.blocked,
            isCrit: !applied.blocked && hit.isCrit,
            challengerHp: match.challengerHp,
            defenderHp: match.defenderHp,
          })
        }
        break
      }

      case 'damage_dot': {
        const baseDamage = Math.max(1, skill.effectValue + attackerStats.attack - defenderStats.defense)
        const applied = this.applyDamage(match, effects, opponent, baseDamage)
        effects = applied.effects
        if (!applied.blocked) {
          effects.push({
            type: 'dot',
            value: Math.max(1, Math.floor(applied.damage * 0.3)),
            turnsLeft: skill.duration,
            sourceCharId: character.id,
            targetCharId: opponent.id,
          })
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          dot: !applied.blocked ? Math.max(1, Math.floor(applied.damage * 0.3)) : 0,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'shield': {
        effects = this.consumeEffect(effects, character.id, 'shield')
        effects.push({ type: 'shield', value: 0, turnsLeft: 2, sourceCharId: character.id, targetCharId: character.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: 'Bouclier actif — prochain coup absorbe',
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'mega_strike': {
        const baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
        const applied = this.applyDamage(match, effects, opponent, Math.floor(baseDamage * 3 * (character.critDamage / 100)))
        effects = applied.effects
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          damage: applied.damage,
          blocked: applied.blocked,
          isCrit: !applied.blocked,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'turret': {
        effects.push({ type: 'turret', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: opponent.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: `Tourelle deployee — ${skill.effectValue} degats/tour pendant ${skill.duration} tours`,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      case 'buff_all': {
        effects.push({ type: 'buff_all', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: character.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: opponent.id,
          defenderName: opponent.name,
          skillName: skill.name,
          message: `ATK et DEF +${skill.effectValue}% pendant ${skill.duration} tours`,
          challengerHp: match.challengerHp,
          defenderHp: match.defenderHp,
        })
        break
      }

      default:
        throw new Error('Skill non geree en PvP')
    }

    this.setCooldown(match, character.id, skill.id, skill.cooldown)
    this.setLog(match, log)
    this.setEffects(match, effects)

    if (this.getHp(match, opponent.id) <= 0) {
      return this.endMatch(match, character, opponent, log)
    }

    await this.advanceTurn(match, opponent.id)
    return { match, log: log[log.length - 1] }
  }

  /** Forfeit */
  static async forfeit(character: Character, matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)

    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    const opponentId = this.getOpponentId(match, character.id)
    if (!opponentId) {
      throw new Error('Adversaire introuvable')
    }

    const opponent = await Character.findOrFail(opponentId)
    const log = this.getLog(match)

    log.push({
      action: 'forfeit',
      round: log.length + 1,
      attackerId: character.id,
      attackerName: character.name,
      defenderId: opponent.id,
      defenderName: opponent.name,
      damage: 0,
      isCrit: false,
      forfeit: true,
      challengerHp: match.challengerHp,
      defenderHp: match.defenderHp,
    })

    return this.endMatch(match, opponent, character, log)
  }

  private static async endMatch(
    match: PvpMatch,
    winner: Character,
    loser: Character,
    log: any[]
  ) {
    match.status = 'completed'
    match.currentTurnId = null
    match.winnerId = winner.id
    this.setLog(match, log)

    const kFactor = 32
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.pvpRating - winner.pvpRating) / 400))
    const ratingChange = Math.round(kFactor * (1 - expectedWinner))

    winner.pvpRating += ratingChange
    loser.pvpRating = Math.max(0, loser.pvpRating - ratingChange)
    winner.pvpWins += 1
    loser.pvpLosses += 1

    const creditReward = Math.floor(100 + ratingChange * 10)
    winner.credits += creditReward

    match.ratingChange = ratingChange
    await match.save()
    await winner.save()
    await loser.save()

    transmit.broadcast(`pvp/match/${match.id}`, {
      type: 'match_end',
      winnerId: winner.id,
      winnerName: winner.name,
      loserId: loser.id,
      loserName: loser.name,
      ratingChange,
      creditReward,
      challengerHp: match.challengerHp,
      defenderHp: match.defenderHp,
    })

    transmit.broadcast('game/notifications', {
      type: 'pvp_result',
      message: `${winner.name} a vaincu ${loser.name} en PvP! (+${ratingChange} ELO)`,
    })

    return { match, ratingChange, creditReward }
  }

  /** Get match state for rendering */
  static async getMatchState(matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)
    const challenger = await Character.findOrFail(match.challengerId)
    const defender = match.defenderId ? await Character.find(match.defenderId) : null

    return {
      match: {
        id: match.id,
        status: match.status,
        challengerHp: match.challengerHp,
        challengerHpMax: match.challengerHpMax,
        defenderHp: match.defenderHp,
        defenderHpMax: match.defenderHpMax,
        currentTurnId: match.currentTurnId,
        winnerId: match.winnerId,
        ratingChange: match.ratingChange,
        log: this.getLog(match),
        skillCooldowns: JSON.parse(match.skillCooldowns || '{}'),
      },
      activeEffects: this.getEffects(match),
      challenger: {
        id: challenger.id,
        name: challenger.name,
        level: challenger.level,
        attack: challenger.attack,
        defense: challenger.defense,
        critChance: challenger.critChance,
        critDamage: challenger.critDamage,
        pvpRating: challenger.pvpRating,
      },
      defender: defender
        ? {
            id: defender.id,
            name: defender.name,
            level: defender.level,
            attack: defender.attack,
            defense: defender.defense,
            critChance: defender.critChance,
            critDamage: defender.critDamage,
            pvpRating: defender.pvpRating,
          }
        : null,
    }
  }
}
