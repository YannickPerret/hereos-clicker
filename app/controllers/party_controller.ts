import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import Character from '#models/character'
import Party from '#models/party'
import PartyMember from '#models/party_member'
import PartyInvite from '#models/party_invite'
import DungeonFloor from '#models/dungeon_floor'
import DungeonRun from '#models/dungeon_run'
import Enemy from '#models/enemy'
import ChatChannel from '#models/chat_channel'
import transmit from '@adonisjs/transmit/services/main'

export default class PartyController {
  private guestPartyMessage(locale: string) {
    return locale === 'en'
      ? 'Guest accounts cannot use party features. Create an account first.'
      : 'Les comptes invites ne peuvent pas utiliser les groupes. Cree un compte d abord.'
  }

  private guestTargetPartyMessage(locale: string) {
    return locale === 'en'
      ? 'Guest accounts cannot join parties. They must create an account first.'
      : 'Les comptes invites ne peuvent pas rejoindre un groupe. Ils doivent creer un compte.'
  }

  private isMissingInviteTable(error: unknown) {
    return error instanceof Error && error.message.toLowerCase().includes('party_invites')
  }

  private async getCurrentCharacter(userId: number) {
    return Character.query().where('userId', userId).firstOrFail()
  }

  private async getActiveMembership(characterId: number) {
    return PartyMember.query()
      .where('characterId', characterId)
      .whereHas('party', (q) => q.whereIn('status', ['waiting', 'countdown', 'in_dungeon']))
      .preload('party', (q) => q.preload('members', (mq) => mq.preload('character')))
      .first()
  }

  async index({ inertia, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    // Check if already in an active party
    const membership = await this.getActiveMembership(character.id)

    const floors = await DungeonFloor.query().orderBy('floorNumber', 'asc')

    return inertia.render('party/index', {
      character: character.serialize(),
      currentParty: membership
        ? {
            ...membership.party.serialize(),
            members: membership.party.members.map((m) => ({
              ...m.serialize(),
              character: m.character.serialize(),
            })),
            isLeader: membership.party.leaderId === character.id,
          }
        : null,
      floors: floors.map((f) => f.serialize()),
    })
  }

  /** JSON API: poll party state */
  async state({ params, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestPartyMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const party = await Party.query()
      .where('id', params.partyId)
      .whereIn('status', ['waiting', 'countdown', 'in_dungeon'])
      .preload('members', (mq) => mq.preload('character'))
      .first()

    if (!party) {
      return response.json({ party: null, dungeonRunId: null, countdown: null })
    }

    // Check if user is a member
    const isMember = party.members.find((m) => m.characterId === character.id)
    if (!isMember) {
      return response.json({ party: null, dungeonRunId: null, countdown: null })
    }

    // Handle countdown → create dungeon run when timer expires
    if (party.status === 'countdown' && party.countdownStart) {
      const elapsed = Date.now() - party.countdownStart
      const remaining = Math.max(0, 5000 - elapsed)

      if (remaining <= 0 && !party.dungeonRunId) {
        // Countdown finished — create the dungeon run
        const floor = await DungeonFloor.findOrFail(party.dungeonFloorId!)
        const enemyIds: number[] = JSON.parse(floor.enemyIds)
        const randomEnemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)]
        const enemy = await Enemy.findOrFail(randomEnemyId)
        const scaledHp = Math.floor(enemy.hp * (1 + (party.members.length - 1) * 0.5))

        // First turn goes to the leader
        const run = await DungeonRun.create({
          characterId: party.leaderId,
          dungeonFloorId: party.dungeonFloorId!,
          status: 'in_progress',
          currentEnemyId: enemy.id,
          currentEnemyHp: scaledHp,
          enemiesDefeated: 0,
          partyId: party.id,
          currentTurnId: party.leaderId,
          turnDeadline: Date.now() + 30000,
          combatLog: '[]',
          afkPenalties: '{}',
        })

        party.status = 'in_dungeon'
        party.dungeonRunId = run.id
        await party.save()
      }

      if (remaining > 0) {
        return response.json({
          party: {
            ...party.serialize(),
            members: party.members.map((m) => ({
              ...m.serialize(),
              character: m.character.serialize(),
            })),
            isLeader: party.leaderId === character.id,
          },
          dungeonRunId: null,
          countdown: Math.ceil(remaining / 1000),
        })
      }
    }

    // Check for active dungeon run
    let dungeonRunId: number | null = party.dungeonRunId ?? null
    if (!dungeonRunId && party.status === 'in_dungeon') {
      const run = await DungeonRun.query()
        .where('partyId', party.id)
        .where('status', 'in_progress')
        .first()
      dungeonRunId = run?.id ?? null
    }

    return response.json({
      party: {
        ...party.serialize(),
        members: party.members.map((m) => ({
          ...m.serialize(),
          character: m.character.serialize(),
        })),
        isLeader: party.leaderId === character.id,
      },
      dungeonRunId,
      countdown: null,
    })
  }

  async create({ request, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    // Check not already in party
    const existing = await this.getActiveMembership(character.id)

    if (existing) {
      session.flash('errors', { message: 'Deja dans un groupe' })
      return response.redirect('/party')
    }

    const name = request.input('name', `${character.name}'s Party`)
    const code = randomBytes(4).toString('hex').toUpperCase()

    const party = await Party.create({
      name: name.substring(0, 50),
      code,
      leaderId: character.id,
      maxSize: 4,
      status: 'waiting',
    })

    await PartyMember.create({
      partyId: party.id,
      characterId: character.id,
      isReady: true,
    })

    await PartyInvite.query()
      .where('invitedCharacterId', character.id)
      .where('status', 'pending')
      .update({ status: 'expired' })

    // Auto-create party chat channel
    const channelName = `party-${party.id}`
    const existingChannel = await ChatChannel.findBy('name', channelName)
    if (!existingChannel) {
      await ChatChannel.create({
        name: channelName,
        label: `GROUPE ${party.name}`,
        isPublic: false,
        password: null,
        createdBy: auth.user!.id,
      })
    }

    return response.redirect('/party')
  }

  async join({ request, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const code = request.input('code', '').toUpperCase()
    const party = await Party.query()
      .where('code', code)
      .where('status', 'waiting')
      .preload('members')
      .first()

    if (!party) {
      session.flash('errors', { message: 'Groupe introuvable ou deja en donjon' })
      return response.redirect('/party')
    }

    if (party.members.length >= party.maxSize) {
      session.flash('errors', { message: 'Groupe plein' })
      return response.redirect('/party')
    }

    const alreadyIn = party.members.find((m) => m.characterId === character.id)
    if (alreadyIn) {
      session.flash('errors', { message: 'Deja dans ce groupe' })
      return response.redirect('/party')
    }

    await PartyMember.create({
      partyId: party.id,
      characterId: character.id,
      isReady: false,
    })

    await PartyInvite.query()
      .where('invitedCharacterId', character.id)
      .where('status', 'pending')
      .update({ status: 'expired' })

    // Notify party
    transmit.broadcast(`party/${party.id}`, {
      event: 'member_joined',
      characterName: character.name,
    })

    return response.redirect('/party')
  }

  async invitations({ auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestPartyMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    try {
      const invites = await PartyInvite.query()
        .where('invitedCharacterId', character.id)
        .where('status', 'pending')
        .whereHas('party', (q) => q.where('status', 'waiting'))
        .preload('party', (q) => q.preload('members'))
        .preload('invitedBy')
        .orderBy('createdAt', 'desc')

      return response.json(
        invites.map((invite) => ({
          id: invite.id,
          partyId: invite.partyId,
          partyName: invite.party.name,
          partyCode: invite.party.code,
          invitedByName: invite.invitedBy.name,
          memberCount: invite.party.members.length,
          maxSize: invite.party.maxSize,
          createdAt: invite.createdAt.toISO(),
        }))
      )
    } catch (error) {
      if (this.isMissingInviteTable(error)) {
        return response.json([])
      }

      throw error
    }
  }

  async invite({ request, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestPartyMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)
    const membership = await this.getActiveMembership(character.id)

    if (!membership || membership.party.leaderId !== character.id) {
      return response.forbidden({ error: 'Seul le leader peut inviter.' })
    }

    if (membership.party.status !== 'waiting') {
      return response.badRequest({
        error: "Impossible d'inviter pendant un donjon ou un countdown.",
      })
    }

    if (membership.party.members.length >= membership.party.maxSize) {
      return response.badRequest({ error: 'Le groupe est deja plein.' })
    }

    const targetName = request.input('characterName', '').trim()
    if (!targetName) {
      return response.badRequest({ error: 'Nom du personnage requis.' })
    }

    const invitedCharacter = await Character.query()
      .whereRaw('LOWER(name) = ?', [targetName.toLowerCase()])
      .first()

    if (!invitedCharacter) {
      return response.notFound({ error: 'Personnage introuvable.' })
    }

    await invitedCharacter.load('user')
    if (invitedCharacter.user.isGuest) {
      return response.badRequest({ error: this.guestTargetPartyMessage(locale) })
    }

    if (invitedCharacter.id === character.id) {
      return response.badRequest({ error: "Tu ne peux pas t'inviter toi-meme." })
    }

    const invitedMembership = await this.getActiveMembership(invitedCharacter.id)
    if (invitedMembership) {
      return response.badRequest({ error: 'Ce joueur est deja dans un groupe.' })
    }

    try {
      const existingInvite = await PartyInvite.query()
        .where('partyId', membership.party.id)
        .where('invitedCharacterId', invitedCharacter.id)
        .where('status', 'pending')
        .first()

      if (existingInvite) {
        return response.badRequest({ error: 'Invitation deja envoyee.' })
      }

      await PartyInvite.create({
        partyId: membership.party.id,
        invitedByCharacterId: character.id,
        invitedCharacterId: invitedCharacter.id,
        status: 'pending',
      })
    } catch (error) {
      if (this.isMissingInviteTable(error)) {
        return response
          .status(503)
          .json({ error: 'Les invitations ne sont pas encore activees. Lance la migration.' })
      }

      throw error
    }

    return response.json({
      ok: true,
      message:
        locale === 'en'
          ? `Invitation sent to ${invitedCharacter.name}.`
          : `Invitation envoyee a ${invitedCharacter.name}.`,
    })
  }

  async acceptInvite({ params, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestPartyMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)
    const existingMembership = await this.getActiveMembership(character.id)
    if (existingMembership) {
      return response.badRequest({ error: 'Tu es deja dans un groupe.' })
    }

    let invite: PartyInvite | null
    try {
      invite = await PartyInvite.query()
        .where('id', params.inviteId)
        .where('invitedCharacterId', character.id)
        .where('status', 'pending')
        .preload('party', (q) => q.preload('members'))
        .first()
    } catch (error) {
      if (this.isMissingInviteTable(error)) {
        return response
          .status(503)
          .json({ error: 'Les invitations ne sont pas encore activees. Lance la migration.' })
      }

      throw error
    }

    if (!invite) {
      return response.notFound({ error: 'Invitation introuvable.' })
    }

    if (invite.party.status !== 'waiting') {
      invite.status = 'expired'
      await invite.save()
      return response.badRequest({ error: "Cette invitation n'est plus valide." })
    }

    if (invite.party.members.length >= invite.party.maxSize) {
      invite.status = 'expired'
      await invite.save()
      return response.badRequest({ error: 'Le groupe est deja plein.' })
    }

    await PartyMember.create({
      partyId: invite.partyId,
      characterId: character.id,
      isReady: false,
    })

    invite.status = 'accepted'
    await invite.save()

    await PartyInvite.query()
      .where('invitedCharacterId', character.id)
      .where('status', 'pending')
      .update({ status: 'expired' })

    transmit.broadcast(`party/${invite.partyId}`, {
      event: 'member_joined',
      characterName: character.name,
    })

    return response.json({ ok: true, redirectTo: '/party' })
  }

  async declineInvite({ params, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestPartyMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    let invite: PartyInvite | null
    try {
      invite = await PartyInvite.query()
        .where('id', params.inviteId)
        .where('invitedCharacterId', character.id)
        .where('status', 'pending')
        .first()
    } catch (error) {
      if (this.isMissingInviteTable(error)) {
        return response
          .status(503)
          .json({ error: 'Les invitations ne sont pas encore activees. Lance la migration.' })
      }

      throw error
    }

    if (!invite) {
      return response.notFound({ error: 'Invitation introuvable.' })
    }

    invite.status = 'declined'
    await invite.save()

    return response.json({ ok: true })
  }

  async ready({ auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const membership = await PartyMember.query()
      .where('characterId', character.id)
      .preload('party')
      .firstOrFail()

    membership.isReady = !membership.isReady
    await membership.save()

    transmit.broadcast(`party/${membership.partyId}`, {
      event: 'ready_changed',
      characterId: character.id,
      isReady: membership.isReady,
    })

    return response.redirect('/party')
  }

  async leave({ auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const membership = await PartyMember.query()
      .where('characterId', character.id)
      .preload('party')
      .first()

    if (!membership) return response.redirect('/party')

    const party = membership.party

    await membership.delete()

    // If leader leaves, disband or transfer
    if (party.leaderId === character.id) {
      const remaining = await PartyMember.query().where('partyId', party.id).first()
      if (remaining) {
        party.leaderId = remaining.characterId
        await party.save()
      } else {
        party.status = 'disbanded'
        await party.save()
        // Clean up party chat channel
        const channel = await ChatChannel.findBy('name', `party-${party.id}`)
        if (channel) await channel.delete()
      }
    }

    transmit.broadcast(`party/${party.id}`, {
      event: 'member_left',
      characterName: character.name,
    })

    return response.redirect('/party')
  }

  async kick({ params, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const leaderMembership = await PartyMember.query()
      .where('characterId', character.id)
      .preload('party')
      .first()

    if (!leaderMembership) {
      session.flash('errors', { message: 'Groupe introuvable' })
      return response.redirect('/party')
    }

    const party = leaderMembership.party

    if (party.leaderId !== character.id) {
      session.flash('errors', { message: 'Seul le leader peut expulser un membre' })
      return response.redirect('/party')
    }

    if (party.status === 'in_dungeon') {
      session.flash('errors', { message: "Impossible d'expulser un membre pendant un donjon" })
      return response.redirect('/party')
    }

    const targetCharacterId = Number(params.characterId)
    if (!Number.isFinite(targetCharacterId)) {
      session.flash('errors', { message: 'Membre introuvable' })
      return response.redirect('/party')
    }

    if (targetCharacterId === character.id) {
      session.flash('errors', { message: "Le leader ne peut pas s'expulser lui-meme" })
      return response.redirect('/party')
    }

    const targetMembership = await PartyMember.query()
      .where('partyId', party.id)
      .where('characterId', targetCharacterId)
      .preload('character')
      .first()

    if (!targetMembership) {
      session.flash('errors', { message: 'Membre introuvable dans ce groupe' })
      return response.redirect('/party')
    }

    await targetMembership.delete()

    if (party.status === 'countdown') {
      party.status = 'waiting'
      party.countdownStart = null
      party.dungeonFloorId = null
      await party.save()
    }

    transmit.broadcast(`party/${party.id}`, {
      event: 'member_kicked',
      characterName: targetMembership.character.name,
      characterId: targetMembership.characterId,
    })

    session.flash('success', `${targetMembership.character.name} a ete expulse du groupe`)
    return response.redirect('/party')
  }

  async startDungeon({ request, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestPartyMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const membership = await PartyMember.query()
      .where('characterId', character.id)
      .preload('party', (q) => q.preload('members'))
      .firstOrFail()

    const party = membership.party

    // Only leader can start
    if (party.leaderId !== character.id) {
      console.log('[startDungeon] Not leader:', character.id, '!=', party.leaderId)
      session.flash('errors', { message: 'Seul le leader peut lancer' })
      return response.redirect('/party')
    }

    // Check all ready
    const notReady = party.members.filter((m) => !m.isReady)
    if (notReady.length > 0) {
      console.log(
        '[startDungeon] Not all ready:',
        party.members.map((m) => ({ id: m.characterId, ready: m.isReady }))
      )
      session.flash('errors', { message: 'Tous les membres doivent etre prets' })
      return response.redirect('/party')
    }

    const floorId = request.input('floorId')
    const floor = await DungeonFloor.findOrFail(floorId)

    // Check min players
    if (party.members.length < (floor.minPlayers || 1)) {
      session.flash('errors', { message: `Minimum ${floor.minPlayers} joueurs requis` })
      return response.redirect('/party')
    }

    // Check levels
    for (const member of party.members) {
      const memberChar = await Character.findOrFail(member.characterId)
      if (memberChar.level < floor.minLevel) {
        session.flash('errors', {
          message: `${memberChar.name} n'a pas le niveau requis (${floor.minLevel})`,
        })
        return response.redirect('/party')
      }
    }

    // Start 5s countdown — don't create dungeon run yet
    party.status = 'countdown'
    party.countdownStart = Date.now()
    party.dungeonFloorId = floorId
    await party.save()

    return response.redirect('/party')
  }
}
