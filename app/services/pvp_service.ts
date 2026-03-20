import Character from '#models/character'
import CharacterTalent from '#models/character_talent'
import CombatSkill from '#models/combat_skill'
import PartyMember from '#models/party_member'
import PvpMatch from '#models/pvp_match'
import PvpMatchParticipant from '#models/pvp_match_participant'
import ClickerService from '#services/clicker_service'
import SeasonService from '#services/season_service'
import transmit from '@adonisjs/transmit/services/main'

type QueueMode = 'solo' | 'duo' | 'trio'

interface PvpActiveEffect {
  type: string
  value: number
  turnsLeft: number
  sourceCharId: number
  targetCharId: number
}

interface QueueTeam {
  leader: Character
  members: Character[]
  partyId: number | null
  mode: QueueMode
  teamSize: number
}

export default class PvpService {
  private static modeSize(mode: QueueMode) {
    return mode === 'duo' ? 2 : mode === 'trio' ? 3 : 1
  }

  private static modeLabel(mode: QueueMode) {
    if (mode === 'duo') return 'DuoQ'
    if (mode === 'trio') return 'TrioQ'
    return 'SoloQ'
  }

  private static estimateQueueSeconds(mode: QueueMode, compatibleTeams: number) {
    if (compatibleTeams > 0) return 10
    if (mode === 'solo') return 35
    if (mode === 'duo') return 75
    return 120
  }

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

  private static getTurnOrder(participants: PvpMatchParticipant[]) {
    return [...participants]
      .filter((participant) => !participant.isEliminated)
      .sort((a, b) => a.slot - b.slot || a.team - b.team || a.characterId - b.characterId)
  }

  private static getNextTurnParticipant(participants: PvpMatchParticipant[], currentCharacterId: number | null) {
    const order = this.getTurnOrder(participants)
    if (order.length === 0) return null
    if (!currentCharacterId) return order[0]

    const index = order.findIndex((participant) => participant.characterId === currentCharacterId)
    if (index === -1) return order[0]
    return order[(index + 1) % order.length]
  }

  private static isTeamDefeated(participants: PvpMatchParticipant[], team: number) {
    const teamMembers = participants.filter((participant) => participant.team === team)
    return teamMembers.length > 0 && teamMembers.every((participant) => participant.isEliminated)
  }

  private static getOpposingTeam(team: number) {
    return team === 1 ? 2 : 1
  }

  private static syncLegacyHpFields(match: PvpMatch, participants: PvpMatchParticipant[]) {
    const totalHp = (team: number) => participants
      .filter((participant) => participant.team === team)
      .reduce((sum, participant) => sum + participant.currentHp, 0)

    const totalHpMax = (team: number) => participants
      .filter((participant) => participant.team === team)
      .reduce((sum, participant) => sum + participant.hpMax, 0)

    match.challengerHp = totalHp(1)
    match.challengerHpMax = totalHpMax(1)
    match.defenderHp = totalHp(2)
    match.defenderHpMax = totalHpMax(2)
  }

  private static async loadParticipants(matchId: number) {
    return PvpMatchParticipant.query()
      .where('matchId', matchId)
      .preload('character')
      .orderBy('team', 'asc')
      .orderBy('slot', 'asc')
      .orderBy('id', 'asc')
  }

  private static getParticipant(participants: PvpMatchParticipant[], characterId: number) {
    return participants.find((participant) => participant.characterId === characterId) || null
  }

  private static getTargetParticipant(
    participants: PvpMatchParticipant[],
    attackerTeam: number,
    targetId?: number | null
  ) {
    const aliveOpponents = participants.filter((participant) => participant.team !== attackerTeam && !participant.isEliminated)

    if (aliveOpponents.length === 0) return null
    if (!targetId) return aliveOpponents[0]

    return aliveOpponents.find((participant) => participant.characterId === targetId) || null
  }

  private static applyDamage(participant: PvpMatchParticipant, damage: number) {
    participant.currentHp = Math.max(0, participant.currentHp - damage)
    participant.isEliminated = participant.currentHp <= 0
    return damage
  }

  private static averageRating(participants: PvpMatchParticipant[]) {
    if (participants.length === 0) return 1000
    const total = participants.reduce((sum, participant) => sum + participant.character.pvpRating, 0)
    return total / participants.length
  }

  private static async syncQueueMembersWithSeason(members: Character[]) {
    const activeSeason = await SeasonService.getCurrentRankedSeason()
    if (!activeSeason) {
      return null
    }

    for (const member of members) {
      await SeasonService.syncCharacterWithActiveSeason(member)
    }

    return activeSeason
  }

  private static async getQueueTeam(character: Character, mode: QueueMode): Promise<QueueTeam> {
    const teamSize = this.modeSize(mode)
    if (teamSize === 1) {
      return { leader: character, members: [character], partyId: null, mode, teamSize }
    }

    const membership = await PartyMember.query()
      .where('characterId', character.id)
      .whereHas('party', (query) => query.where('status', 'waiting'))
      .preload('party', (query) => query.preload('members', (memberQuery) => memberQuery.preload('character')))
      .first()

    if (!membership) {
      throw new Error(`${this.modeLabel(mode)} requiert un groupe actif de ${teamSize} joueurs`)
    }

    if (membership.party.leaderId !== character.id) {
      throw new Error(`Seul le leader peut lancer la ${this.modeLabel(mode)}`)
    }

    const members = [...membership.party.members]
      .sort((a, b) => {
        if (a.characterId === membership.party.leaderId) return -1
        if (b.characterId === membership.party.leaderId) return 1
        return a.id - b.id
      })
      .map((member) => member.character)

    if (members.length !== teamSize) {
      throw new Error(`Ton groupe doit contenir exactement ${teamSize} joueurs pour ${this.modeLabel(mode)}`)
    }

    return {
      leader: members[0],
      members,
      partyId: membership.party.id,
      mode,
      teamSize,
    }
  }

  private static async findActiveMatchForCharacters(characterIds: number[]) {
    const participant = await PvpMatchParticipant.query()
      .whereIn('characterId', characterIds)
      .whereHas('match', (query) => query.whereIn('status', ['waiting', 'in_progress']))
      .preload('match')
      .orderBy('id', 'desc')
      .first()

    return participant?.match || null
  }

  private static async createParticipants(matchId: number, team: number, members: Character[]) {
    const created: PvpMatchParticipant[] = []
    const createdAt = Date.now()

    for (const [index, member] of members.entries()) {
      created.push(await PvpMatchParticipant.create({
        matchId,
        characterId: member.id,
        team,
        slot: index + 1,
        currentHp: member.hpMax,
        hpMax: member.hpMax,
        isEliminated: false,
        createdAt,
      }))
    }

    return created
  }

  private static async findCompatibleWaitingMatch(queueTeam: QueueTeam) {
    const waitingMatches = await PvpMatch.query()
      .where('status', 'waiting')
      .where('queueMode', queueTeam.mode)
      .where('teamSize', queueTeam.teamSize)
      .whereNull('defenderId')
      .preload('participants', (query) => query.preload('character'))
      .orderBy('createdAt', 'asc')

    const myAverage = queueTeam.members.reduce((sum, member) => sum + member.pvpRating, 0) / queueTeam.members.length

    for (const waiting of waitingMatches) {
      if (queueTeam.partyId && waiting.challengerPartyId === queueTeam.partyId) continue
      if (!queueTeam.partyId && waiting.challengerId === queueTeam.leader.id) continue

      const queuedParticipants = waiting.participants.filter((participant) => participant.team === 1)
      const queuedAverage = this.averageRating(queuedParticipants)
      const waitedAt = Number(waiting.createdAt) || 0
      const waitedSeconds = waitedAt > 0 ? Math.max(0, Math.floor((Date.now() - waitedAt) / 1000)) : 0
      const maxGap = 150 + Math.floor(waitedSeconds / 15) * 50

      if (Math.abs(queuedAverage - myAverage) <= maxGap) {
        return waiting
      }
    }

    return null
  }

  static async getQueueOverview(character: Character) {
    const activeSeason = await SeasonService.getCurrentRankedSeason()
    const waitingMatches = await PvpMatch.query()
      .where('status', 'waiting')
      .select('queueMode')

    const waitingByMode: Record<QueueMode, number> = {
      solo: 0,
      duo: 0,
      trio: 0,
    }

    for (const match of waitingMatches) {
      const mode = (match.queueMode || 'solo') as QueueMode
      waitingByMode[mode] += 1
    }

    const modes: QueueMode[] = ['solo', 'duo', 'trio']

    const cards = []
    for (const mode of modes) {
      let canQueue = true
      let reason: string | null = null

      try {
        await this.getQueueTeam(character, mode)
        if (activeSeason && !activeSeason.isRankedPvpEnabled) {
          canQueue = false
          reason = 'Le PvP classe est desactive pour la saison active'
        }
      } catch (error) {
        canQueue = false
        reason = error instanceof Error ? error.message : 'Mode indisponible'
      }

      const compatibleTeams = Math.max(0, waitingByMode[mode] - 0)
      cards.push({
        mode,
        label: this.modeLabel(mode),
        teamSize: this.modeSize(mode),
        waitingTeams: waitingByMode[mode],
        etaSeconds: this.estimateQueueSeconds(mode, compatibleTeams),
        canQueue,
        reason,
      })
    }

    return cards
  }

  /** Find or create a match (matchmaking queue) */
  static async joinQueue(character: Character, requestedMode: string): Promise<PvpMatch> {
    const mode = requestedMode === 'duo' || requestedMode === 'trio' ? requestedMode : 'solo'
    const queueTeam = await this.getQueueTeam(character, mode)
    const activeSeason = await this.syncQueueMembersWithSeason(queueTeam.members)
    if (activeSeason && !activeSeason.isRankedPvpEnabled) {
      throw new Error('Le PvP classe est desactive pour la saison active')
    }
    const active = await this.findActiveMatchForCharacters(queueTeam.members.map((member) => member.id))

    if (active) return active

    const waiting = await this.findCompatibleWaitingMatch(queueTeam)

    if (waiting) {
      await this.createParticipants(waiting.id, 2, queueTeam.members)

      waiting.defenderId = queueTeam.leader.id
      waiting.defenderPartyId = queueTeam.partyId
      waiting.status = 'in_progress'
      waiting.currentTurnId = waiting.participants
        .filter((participant) => participant.team === 1)
        .sort((a, b) => a.slot - b.slot)[0]?.characterId || waiting.challengerId
      waiting.log = '[]'
      waiting.skillCooldowns = '{}'
      waiting.activeEffects = '[]'

      const participants = await this.loadParticipants(waiting.id)
      this.syncLegacyHpFields(waiting, participants)
      await waiting.save()

      const teamOneNames = participants.filter((participant) => participant.team === 1).map((participant) => participant.character.name).join(', ')
      const teamTwoNames = participants.filter((participant) => participant.team === 2).map((participant) => participant.character.name).join(', ')

      transmit.broadcast(`pvp/match/${waiting.id}`, {
        type: 'match_start',
        matchId: waiting.id,
        queueMode: waiting.queueMode,
        teamSize: waiting.teamSize,
      })

      transmit.broadcast('game/notifications', {
        type: 'pvp',
        message: `${teamOneNames} vs ${teamTwoNames} — Combat PvP ${this.modeLabel(waiting.queueMode)} en cours!`,
      })

      return waiting
    }

    const match = await PvpMatch.create({
      challengerId: queueTeam.leader.id,
      defenderId: null,
      challengerPartyId: queueTeam.partyId,
      defenderPartyId: null,
      winnerId: null,
      winnerTeam: null,
      status: 'waiting',
      queueMode: queueTeam.mode,
      teamSize: queueTeam.teamSize,
      currentTurnId: null,
      challengerHp: 0,
      challengerHpMax: 0,
      defenderHp: 0,
      defenderHpMax: 0,
      log: '[]',
      skillCooldowns: '{}',
      activeEffects: '[]',
      ratingChange: 0,
      createdAt: Date.now(),
      updatedAt: null,
    })

    await this.createParticipants(match.id, 1, queueTeam.members)
    const participants = await this.loadParticipants(match.id)
    this.syncLegacyHpFields(match, participants)
    await match.save()

    return match
  }

  /** Cancel waiting in queue */
  static async leaveQueue(character: Character) {
    const participant = await PvpMatchParticipant.query()
      .where('characterId', character.id)
      .whereHas('match', (query) => query.where('status', 'waiting'))
      .preload('match')
      .first()

    if (!participant) return

    participant.match.status = 'cancelled'
    participant.match.currentTurnId = null
    await participant.match.save()
  }

  private static async validateSkill(character: Character, match: PvpMatch, skillId: number, participants: PvpMatchParticipant[]) {
    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    const actorParticipant = this.getParticipant(participants, character.id)
    if (!actorParticipant || actorParticipant.isEliminated) {
      throw new Error('Ton personnage ne peut plus agir')
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

  private static async prepareTurn(match: PvpMatch): Promise<PvpMatch> {
    if (match.status !== 'in_progress' || !match.currentTurnId) {
      return match
    }

    const participants = await this.loadParticipants(match.id)
    let actor = this.getParticipant(participants, match.currentTurnId)

    if (!actor || actor.isEliminated) {
      const nextActor = this.getNextTurnParticipant(participants, match.currentTurnId)
      if (!nextActor) return match
      match.currentTurnId = nextActor.characterId
      await match.save()
      actor = nextActor
    }

    let effects = this.getEffects(match)
    const log = this.getLog(match)

    this.tickCooldowns(match, actor.characterId)

    for (const effect of effects) {
      if (effect.sourceCharId !== actor.characterId || effect.turnsLeft <= 0) continue
      if (effect.type !== 'dot' && effect.type !== 'turret') continue

      const target = this.getParticipant(participants, effect.targetCharId)
      if (!target || target.isEliminated) continue

      const damage = this.applyDamage(target, effect.value)
      log.push({
        action: 'skill_effect',
        attackerId: actor.character.id,
        attackerName: actor.character.name,
        defenderId: target.character.id,
        defenderName: target.character.name,
        effectType: effect.type,
        damage,
        blocked: false,
        message: effect.type === 'dot' ? `Saignement: -${damage} HP` : `Tourelle: -${damage} HP`,
      })

      if (this.isTeamDefeated(participants, target.team)) {
        this.setLog(match, log)
        effects = effects.map((entry) => (
          entry.sourceCharId === actor.characterId
            ? { ...entry, turnsLeft: entry.turnsLeft - 1 }
            : entry
        )).filter((entry) => entry.turnsLeft > 0)
        this.setEffects(match, effects)
        this.syncLegacyHpFields(match, participants)
        for (const participant of participants) await participant.save()
        await this.endMatch(match, actor.team, log, participants)
        return match
      }
    }

    effects = effects
      .map((effect) => (
        effect.sourceCharId === actor.characterId
          ? { ...effect, turnsLeft: effect.turnsLeft - 1 }
          : effect
      ))
      .filter((effect) => effect.turnsLeft > 0)

    if (this.hasEffect(effects, actor.characterId, 'stun')) {
      effects = this.consumeEffect(effects, actor.characterId, 'stun')
      log.push({
        action: 'stunned',
        attackerId: actor.characterId,
        attackerName: actor.character.name,
        defenderId: actor.characterId,
        defenderName: actor.character.name,
        message: `${actor.character.name} est neutralise et perd son tour`,
      })
      this.setLog(match, log)
      this.setEffects(match, effects)
      this.syncLegacyHpFields(match, participants)
      for (const participant of participants) await participant.save()

      const nextActor = this.getNextTurnParticipant(participants, actor.characterId)
      match.currentTurnId = nextActor?.characterId || null
      await match.save()
      return nextActor ? this.prepareTurn(match) : match
    }

    this.setLog(match, log)
    this.setEffects(match, effects)
    this.syncLegacyHpFields(match, participants)
    for (const participant of participants) await participant.save()
    await match.save()
    return match
  }

  private static async advanceTurn(match: PvpMatch, participants: PvpMatchParticipant[], currentCharacterId: number) {
    const nextParticipant = this.getNextTurnParticipant(participants, currentCharacterId)
    match.currentTurnId = nextParticipant?.characterId || null
    this.syncLegacyHpFields(match, participants)
    for (const participant of participants) await participant.save()
    await match.save()
    return nextParticipant ? this.prepareTurn(match) : match
  }

  /** Process an attack turn */
  static async attack(character: Character, matchId: number, targetId?: number | null) {
    const match = await PvpMatch.findOrFail(matchId)
    const participants = await this.loadParticipants(match.id)
    const actorParticipant = this.getParticipant(participants, character.id)

    if (!actorParticipant || actorParticipant.isEliminated) {
      throw new Error('Ton personnage ne peut plus agir')
    }

    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    if (match.currentTurnId !== character.id) {
      throw new Error('Ce n\'est pas ton tour')
    }

    const targetParticipant = this.getTargetParticipant(participants, actorParticipant.team, targetId)
    if (!targetParticipant) {
      throw new Error('Aucune cible valide')
    }

    let effects = this.getEffects(match)
    const log = this.getLog(match)

    const attackerBonuses = await ClickerService.calculateEquipBonuses(character)
    const defenderBonuses = await ClickerService.calculateEquipBonuses(targetParticipant.character)

    const attackerStats = this.applyModifiers({
      attack: character.attack + attackerBonuses.attackBonus,
      defense: character.defense + attackerBonuses.defenseBonus,
    }, effects, character.id)

    const defenderStats = this.applyModifiers({
      attack: targetParticipant.character.attack + defenderBonuses.attackBonus,
      defense: targetParticipant.character.defense + defenderBonuses.defenseBonus,
    }, effects, targetParticipant.characterId)

    const rawDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
    const variance = Math.floor(Math.random() * Math.max(1, Math.floor(rawDamage * 0.3)))
    const forceCrit = this.hasEffect(effects, character.id, 'guaranteed_crit')
    const hit = forceCrit
      ? { damage: Math.floor((rawDamage + variance) * (character.critDamage / 100)), isCrit: true }
      : this.rollCrit(character.critChance, character.critDamage, rawDamage + variance)

    if (forceCrit) {
      effects = this.consumeEffect(effects, character.id, 'guaranteed_crit')
    }

    let blocked = false
    if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
      blocked = true
      effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
    } else {
      this.applyDamage(targetParticipant, hit.damage)
    }

    log.push({
      action: 'player_attack',
      round: log.length + 1,
      attackerId: character.id,
      attackerName: character.name,
      defenderId: targetParticipant.character.id,
      defenderName: targetParticipant.character.name,
      damage: blocked ? 0 : hit.damage,
      blocked,
      isCrit: !blocked && hit.isCrit,
    })

    this.setLog(match, log)
    this.setEffects(match, effects)

    if (this.isTeamDefeated(participants, targetParticipant.team)) {
      return this.endMatch(match, actorParticipant.team, log, participants)
    }

    await this.advanceTurn(match, participants, character.id)
    return { match, log: log[log.length - 1] }
  }

  static async useSkill(character: Character, matchId: number, skillId: number, targetId?: number | null) {
    const match = await PvpMatch.findOrFail(matchId)
    const participants = await this.loadParticipants(match.id)
    const actorParticipant = this.getParticipant(participants, character.id)
    if (!actorParticipant || actorParticipant.isEliminated) {
      throw new Error('Ton personnage ne peut plus agir')
    }

    const skill = await this.validateSkill(character, match, skillId, participants)
    let effects = this.getEffects(match)
    const log = this.getLog(match)

    const targetParticipant = ['heal_percent', 'guaranteed_crit', 'shield', 'buff_all'].includes(skill.effectType)
      ? null
      : this.getTargetParticipant(participants, actorParticipant.team, targetId)

    if (!['heal_percent', 'guaranteed_crit', 'shield', 'buff_all'].includes(skill.effectType) && !targetParticipant) {
      throw new Error('Aucune cible valide')
    }

    const attackerBonuses = await ClickerService.calculateEquipBonuses(character)
    const attackerStats = this.applyModifiers({
      attack: character.attack + attackerBonuses.attackBonus,
      defense: character.defense + attackerBonuses.defenseBonus,
    }, effects, character.id)

    const defenderBonuses = targetParticipant
      ? await ClickerService.calculateEquipBonuses(targetParticipant.character)
      : null

    const defenderStats = targetParticipant
      ? this.applyModifiers({
          attack: targetParticipant.character.attack + (defenderBonuses?.attackBonus || 0),
          defense: targetParticipant.character.defense + (defenderBonuses?.defenseBonus || 0),
        }, effects, targetParticipant.characterId)
      : null

    switch (skill.effectType) {
      case 'pure_damage': {
        if (!targetParticipant) break
        let blocked = false
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, skill.effectValue + Math.floor(attackerStats.attack * 0.5))
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : skill.effectValue + Math.floor(attackerStats.attack * 0.5),
          blocked,
        })
        break
      }

      case 'debuff_def': {
        if (!targetParticipant) break
        effects.push({ type: 'debuff_def', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: targetParticipant.characterId })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          message: `DEF adverse -${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }

      case 'debuff_atk': {
        if (!targetParticipant) break
        effects.push({ type: 'debuff_atk', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: targetParticipant.characterId })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          message: `ATK adverse -${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }

      case 'steal_damage': {
        if (!targetParticipant || !defenderStats) break
        const baseDamage = Math.max(1, skill.effectValue + attackerStats.attack - defenderStats.defense)
        let blocked = false
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, baseDamage)
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : baseDamage,
          blocked,
          message: blocked ? 'Bouclier adverse absorbe le siphon' : 'Le systeme adverse est siphonne',
        })
        break
      }

      case 'damage_stun': {
        if (!targetParticipant) break
        let blocked = false
        const damage = skill.effectValue + Math.floor(attackerStats.attack * 0.3)
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, damage)
          effects.push({ type: 'stun', value: 0, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: targetParticipant.characterId })
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : damage,
          blocked,
          stun: !blocked,
        })
        break
      }

      case 'guaranteed_crit': {
        effects.push({ type: 'guaranteed_crit', value: 0, turnsLeft: 2, sourceCharId: character.id, targetCharId: character.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: character.id,
          defenderName: character.name,
          skillName: skill.name,
          message: 'Prochaine attaque = critique garanti',
        })
        break
      }

      case 'purge_damage': {
        if (!targetParticipant) break
        effects = this.removePurgeableEffects(effects, targetParticipant.characterId)
        let blocked = false
        const damage = skill.effectValue + Math.floor(attackerStats.attack * 0.3)
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, damage)
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : damage,
          blocked,
          message: 'Buffs adverses purges',
        })
        break
      }

      case 'heal_percent': {
        const healed = Math.floor(actorParticipant.hpMax * skill.effectValue / 100)
        const hpBefore = actorParticipant.currentHp
        actorParticipant.currentHp = Math.min(actorParticipant.hpMax, actorParticipant.currentHp + healed)
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: character.id,
          defenderName: character.name,
          skillName: skill.name,
          healed: actorParticipant.currentHp - hpBefore,
          message: `+${actorParticipant.currentHp - hpBefore} HP`,
        })
        break
      }

      case 'double_hit': {
        if (!targetParticipant || !defenderStats) break
        for (let index = 0; index < 2; index++) {
          let blocked = false
          const baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
          const variance = Math.floor(Math.random() * Math.max(1, Math.floor(baseDamage * 0.3)))
          const hit = this.rollCrit(character.critChance, character.critDamage, baseDamage + variance)
          if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
            blocked = true
            effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
          } else {
            this.applyDamage(targetParticipant, hit.damage)
          }
          log.push({
            action: 'skill_use',
            attackerId: character.id,
            attackerName: character.name,
            defenderId: targetParticipant.character.id,
            defenderName: targetParticipant.character.name,
            skillName: `${skill.name} #${index + 1}`,
            damage: blocked ? 0 : hit.damage,
            blocked,
            isCrit: !blocked && hit.isCrit,
          })
          if (targetParticipant.isEliminated) break
        }
        break
      }

      case 'damage_dot': {
        if (!targetParticipant || !defenderStats) break
        const baseDamage = Math.max(1, skill.effectValue + attackerStats.attack - defenderStats.defense)
        let blocked = false
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, baseDamage)
          effects.push({
            type: 'dot',
            value: Math.max(1, Math.floor(baseDamage * 0.3)),
            turnsLeft: skill.duration,
            sourceCharId: character.id,
            targetCharId: targetParticipant.characterId,
          })
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : baseDamage,
          blocked,
          dot: !blocked ? Math.max(1, Math.floor(baseDamage * 0.3)) : 0,
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
          defenderId: character.id,
          defenderName: character.name,
          skillName: skill.name,
          message: 'Bouclier actif — prochain coup absorbe',
        })
        break
      }

      case 'mega_strike': {
        if (!targetParticipant || !defenderStats) break
        let blocked = false
        const baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense)
        const damage = Math.floor(baseDamage * 3 * (character.critDamage / 100))
        if (this.hasEffect(effects, targetParticipant.characterId, 'shield')) {
          blocked = true
          effects = this.consumeEffect(effects, targetParticipant.characterId, 'shield')
        } else {
          this.applyDamage(targetParticipant, damage)
        }
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          damage: blocked ? 0 : damage,
          blocked,
          isCrit: !blocked,
        })
        break
      }

      case 'turret': {
        if (!targetParticipant) break
        effects.push({ type: 'turret', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: targetParticipant.characterId })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: targetParticipant.character.id,
          defenderName: targetParticipant.character.name,
          skillName: skill.name,
          message: `Tourelle deployee — ${skill.effectValue} degats/tour pendant ${skill.duration} tours`,
        })
        break
      }

      case 'buff_all': {
        effects.push({ type: 'buff_all', value: skill.effectValue, turnsLeft: skill.duration, sourceCharId: character.id, targetCharId: character.id })
        log.push({
          action: 'skill_use',
          attackerId: character.id,
          attackerName: character.name,
          defenderId: character.id,
          defenderName: character.name,
          skillName: skill.name,
          message: `ATK et DEF +${skill.effectValue}% pendant ${skill.duration} tours`,
        })
        break
      }

      default:
        throw new Error('Skill non geree en PvP')
    }

    this.setCooldown(match, character.id, skill.id, skill.cooldown)
    this.setLog(match, log)
    this.setEffects(match, effects)

    if (targetParticipant && this.isTeamDefeated(participants, targetParticipant.team)) {
      return this.endMatch(match, actorParticipant.team, log, participants)
    }

    await this.advanceTurn(match, participants, character.id)
    return { match, log: log[log.length - 1] }
  }

  /** Forfeit */
  static async forfeit(character: Character, matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)
    const participants = await this.loadParticipants(match.id)
    const actorParticipant = this.getParticipant(participants, character.id)

    if (!actorParticipant) {
      throw new Error('Match introuvable')
    }

    if (match.status !== 'in_progress') {
      throw new Error('Match non actif')
    }

    const winnerTeam = this.getOpposingTeam(actorParticipant.team)
    const log = this.getLog(match)

    log.push({
      action: 'forfeit',
      round: log.length + 1,
      attackerId: character.id,
      attackerName: character.name,
      defenderId: character.id,
      defenderName: character.name,
      damage: 0,
      isCrit: false,
      forfeit: true,
    })

    return this.endMatch(match, winnerTeam, log, participants)
  }

  private static async endMatch(
    match: PvpMatch,
    winnerTeam: number,
    log: any[],
    participants?: PvpMatchParticipant[]
  ) {
    const loadedParticipants = participants || await this.loadParticipants(match.id)
    const winners = loadedParticipants.filter((participant) => participant.team === winnerTeam)
    const losers = loadedParticipants.filter((participant) => participant.team !== winnerTeam)

    const winnerLeader = winners.sort((a, b) => a.slot - b.slot)[0]
    match.status = 'completed'
    match.currentTurnId = null
    match.winnerTeam = winnerTeam
    match.winnerId = winnerLeader?.characterId || null
    this.setLog(match, log)
    this.syncLegacyHpFields(match, loadedParticipants)

    const activeSeason = await SeasonService.getCurrentRankedSeason()
    const kFactor = 32
    const expectedWinner = 1 / (1 + Math.pow(10, (this.averageRating(losers) - this.averageRating(winners)) / 400))
    const ratingChange = Math.round(kFactor * (1 - expectedWinner))
    const creditReward = Math.floor(100 + ratingChange * 10)

    for (const participant of winners) {
      let updatedRating = participant.character.pvpRating + ratingChange
      if (activeSeason) {
        const seasonStat = await SeasonService.getOrCreatePvpSeasonStat(participant.character, activeSeason)
        seasonStat.rating = updatedRating
        seasonStat.peakRating = Math.max(seasonStat.peakRating, seasonStat.rating)
        seasonStat.wins += 1
        seasonStat.gamesPlayed += 1
        await seasonStat.save()
      }

      participant.character.pvpRating = updatedRating
      participant.character.pvpWins += 1
      participant.character.credits += creditReward
      await participant.character.save()
    }

    for (const participant of losers) {
      const updatedRating = Math.max(0, participant.character.pvpRating - ratingChange)
      if (activeSeason) {
        const seasonStat = await SeasonService.getOrCreatePvpSeasonStat(participant.character, activeSeason)
        seasonStat.rating = updatedRating
        seasonStat.peakRating = Math.max(seasonStat.peakRating, updatedRating)
        seasonStat.losses += 1
        seasonStat.gamesPlayed += 1
        await seasonStat.save()
      }

      participant.character.pvpRating = updatedRating
      participant.character.pvpLosses += 1
      await participant.character.save()
    }

    match.ratingChange = ratingChange
    await match.save()

    const winnerNames = winners.map((participant) => participant.character.name).join(', ')
    const loserNames = losers.map((participant) => participant.character.name).join(', ')

    transmit.broadcast(`pvp/match/${match.id}`, {
      type: 'match_end',
      winnerTeam,
      winnerId: match.winnerId,
      winnerNames,
      loserNames,
      ratingChange,
      creditReward,
    })

    transmit.broadcast('game/notifications', {
      type: 'pvp_result',
      message: `${winnerNames} a vaincu ${loserNames} en PvP ${this.modeLabel(match.queueMode)}! (+${ratingChange} ELO)`,
    })

    return { match, ratingChange, creditReward }
  }

  /** Get match state for rendering */
  static async getMatchState(matchId: number) {
    const match = await PvpMatch.findOrFail(matchId)
    const participants = await this.loadParticipants(match.id)
    const teams = [1, 2].map((team) => {
      const members = participants
        .filter((participant) => participant.team === team)
        .sort((a, b) => a.slot - b.slot)

      return {
        team,
        averageRating: members.length > 0
          ? Math.round(members.reduce((sum, participant) => sum + participant.character.pvpRating, 0) / members.length)
          : 0,
        members: members.map((participant) => ({
          id: participant.character.id,
          name: participant.character.name,
          level: participant.character.level,
          attack: participant.character.attack,
          defense: participant.character.defense,
          critChance: participant.character.critChance,
          critDamage: participant.character.critDamage,
          pvpRating: participant.character.pvpRating,
          currentHp: participant.currentHp,
          hpMax: participant.hpMax,
          isEliminated: participant.isEliminated,
          slot: participant.slot,
          isLeader: participant.slot === 1,
        })),
      }
    })

    const waitingMatches = await PvpMatch.query()
      .where('status', 'waiting')
      .where('queueMode', match.queueMode)

    return {
      match: {
        id: match.id,
        status: match.status,
        queueMode: match.queueMode,
        teamSize: match.teamSize,
        currentTurnId: match.currentTurnId,
        winnerId: match.winnerId,
        winnerTeam: match.winnerTeam,
        ratingChange: match.ratingChange,
        log: this.getLog(match),
        skillCooldowns: JSON.parse(match.skillCooldowns || '{}'),
        queueEstimateSeconds: this.estimateQueueSeconds(match.queueMode, Math.max(0, waitingMatches.length - 1)),
      },
      activeEffects: this.getEffects(match),
      teams,
    }
  }
}
