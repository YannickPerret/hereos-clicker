import Character from '#models/character'
import PvpMatch from '#models/pvp_match'
import ClickerService from '#services/clicker_service'
import transmit from '@adonisjs/transmit/services/main'

export default class PvpService {
  private static rollCrit(critChance: number, critDamage: number, baseDamage: number) {
    const isCrit = Math.random() * 100 < critChance
    return isCrit
      ? { damage: Math.floor(baseDamage * (critDamage / 100)), isCrit: true }
      : { damage: baseDamage, isCrit: false }
  }

  /** Find or create a match (matchmaking queue) */
  static async joinQueue(character: Character): Promise<PvpMatch> {
    // Check if already in an active match
    const active = await PvpMatch.query()
      .where((q) => {
        q.where('challengerId', character.id).orWhere('defenderId', character.id)
      })
      .whereIn('status', ['waiting', 'in_progress'])
      .first()

    if (active) return active

    // Look for a waiting match (not our own)
    const waiting = await PvpMatch.query()
      .where('status', 'waiting')
      .where('challengerId', '!=', character.id)
      .orderBy('createdAt', 'asc')
      .first()

    if (waiting) {
      // Join as defender
      const challenger = await Character.findOrFail(waiting.challengerId)

      waiting.defenderId = character.id
      waiting.status = 'in_progress'
      waiting.challengerHp = challenger.hpMax
      waiting.challengerHpMax = challenger.hpMax
      waiting.defenderHp = character.hpMax
      waiting.defenderHpMax = character.hpMax
      waiting.currentTurnId = challenger.id // Challenger starts
      waiting.log = '[]'
      await waiting.save()

      // Broadcast match start
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

    // No waiting match, create one
    return await PvpMatch.create({
      challengerId: character.id,
      status: 'waiting',
      challengerHp: character.hpMax,
      challengerHpMax: character.hpMax,
      defenderHp: 0,
      defenderHpMax: 0,
      log: '[]',
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

    const isChallenger = match.challengerId === character.id
    const opponentId = isChallenger ? match.defenderId! : match.challengerId
    const opponent = await Character.findOrFail(opponentId)

    const attackerBonuses = await ClickerService.calculateEquipBonuses(character)
    const defenderBonuses = await ClickerService.calculateEquipBonuses(opponent)

    // Calculate damage
    const rawDmg = Math.max(1, (character.attack + attackerBonuses.attackBonus) - (opponent.defense + defenderBonuses.defenseBonus))
    const variance = Math.floor(Math.random() * Math.floor(rawDmg * 0.3))
    const hit = this.rollCrit(character.critChance, character.critDamage, rawDmg + variance)

    // Apply damage
    if (isChallenger) {
      match.defenderHp = Math.max(0, match.defenderHp - hit.damage)
    } else {
      match.challengerHp = Math.max(0, match.challengerHp - hit.damage)
    }

    // Add to log
    const log = JSON.parse(match.log)
    log.push({
      round: log.length + 1,
      attackerId: character.id,
      attackerName: character.name,
      defenderId: opponent.id,
      defenderName: opponent.name,
      damage: hit.damage,
      isCrit: hit.isCrit,
      challengerHp: match.challengerHp,
      defenderHp: match.defenderHp,
    })
    match.log = JSON.stringify(log)

    // Check for KO
    const defenderHp = isChallenger ? match.defenderHp : match.challengerHp
    if (defenderHp <= 0) {
      return this.endMatch(match, character, opponent, log)
    }

    // Switch turn
    match.currentTurnId = opponentId
    await match.save()

    // Broadcast turn
    transmit.broadcast(`pvp/match/${match.id}`, {
      type: 'turn',
      log: log[log.length - 1],
      challengerHp: match.challengerHp,
      defenderHp: match.defenderHp,
      currentTurnId: match.currentTurnId,
      status: 'in_progress',
    })

    return { match, log: log[log.length - 1] }
  }

  /** Forfeit */
  static async forfeit(character: Character, matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)

    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    const isChallenger = match.challengerId === character.id
    const opponentId = isChallenger ? match.defenderId! : match.challengerId
    const opponent = await Character.findOrFail(opponentId)

    const log = JSON.parse(match.log)
    log.push({
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

    return this.endMatch(match, opponent, character, log) // opponent wins
  }

  private static async endMatch(
    match: PvpMatch,
    winner: Character,
    loser: Character,
    log: any[]
  ) {
    match.status = 'completed'
    match.winnerId = winner.id
    match.log = JSON.stringify(log)

    // ELO
    const K = 32
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.pvpRating - winner.pvpRating) / 400))
    const ratingChange = Math.round(K * (1 - expectedWinner))

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

    // Broadcast match end
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
        log: JSON.parse(match.log),
      },
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
