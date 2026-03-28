import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Character from '#models/character'
import Friendship from '#models/friendship'
import ChatPresenceService from '#services/chat_presence_service'

export default class FriendsController {
  private guestFriendsMessage(locale: string) {
    return locale === 'en'
      ? 'Guest accounts cannot use the friends system. Create an account first.'
      : 'Les comptes invites ne peuvent pas utiliser le systeme d amis. Cree un compte d abord.'
  }

  private guestTargetFriendsMessage(locale: string) {
    return locale === 'en'
      ? 'Guest accounts cannot receive friend requests. They must create an account first.'
      : 'Les comptes invites ne peuvent pas recevoir de demandes d ami. Ils doivent creer un compte.'
  }

  private async getCurrentCharacter(userId: number) {
    return Character.query().where('userId', userId).firstOrFail()
  }

  async index({ inertia, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const [accepted, incoming, outgoing] = await Promise.all([
      Friendship.query()
        .where('status', 'accepted')
        .where((query) => {
          query.where('requesterCharacterId', character.id).orWhere('addresseeCharacterId', character.id)
        })
        .preload('requester')
        .preload('addressee')
        .orderBy('updatedAt', 'desc'),
      Friendship.query()
        .where('status', 'pending')
        .where('addresseeCharacterId', character.id)
        .preload('requester')
        .orderBy('createdAt', 'desc'),
      Friendship.query()
        .where('status', 'pending')
        .where('requesterCharacterId', character.id)
        .preload('addressee')
        .orderBy('createdAt', 'desc'),
    ])

    return inertia.render('friends/index', {
      character: character.serialize(),
      friends: accepted.map((entry) => {
        const friend = entry.requesterCharacterId === character.id ? entry.addressee : entry.requester
        return {
          id: entry.id,
          characterId: friend.id,
          name: friend.name,
          level: friend.level,
          pvpRating: friend.pvpRating,
          chosenSpec: friend.chosenSpec,
          isOnline: ChatPresenceService.isCharacterOnline(friend.name),
          lastSeenAt: friend.lastSeenAt?.toISO() || null,
          acceptedAt: entry.acceptedAt?.toISO() || null,
        }
      }),
      incomingRequests: incoming.map((entry) => ({
        id: entry.id,
        characterId: entry.requester.id,
        name: entry.requester.name,
        level: entry.requester.level,
        pvpRating: entry.requester.pvpRating,
        chosenSpec: entry.requester.chosenSpec,
        isOnline: ChatPresenceService.isCharacterOnline(entry.requester.name),
        lastSeenAt: entry.requester.lastSeenAt?.toISO() || null,
        createdAt: entry.createdAt.toISO(),
      })),
      outgoingRequests: outgoing.map((entry) => ({
        id: entry.id,
        characterId: entry.addressee.id,
        name: entry.addressee.name,
        level: entry.addressee.level,
        pvpRating: entry.addressee.pvpRating,
        chosenSpec: entry.addressee.chosenSpec,
        isOnline: ChatPresenceService.isCharacterOnline(entry.addressee.name),
        lastSeenAt: entry.addressee.lastSeenAt?.toISO() || null,
        createdAt: entry.createdAt.toISO(),
      })),
    })
  }

  async requests({ auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestFriendsMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const incoming = await Friendship.query()
      .where('status', 'pending')
      .where('addresseeCharacterId', character.id)
      .preload('requester')
      .orderBy('createdAt', 'desc')

    return response.json(
      incoming.map((entry) => ({
        id: entry.id,
        characterId: entry.requester.id,
        name: entry.requester.name,
        level: entry.requester.level,
        pvpRating: entry.requester.pvpRating,
        chosenSpec: entry.requester.chosenSpec,
        isOnline: ChatPresenceService.isCharacterOnline(entry.requester.name),
        lastSeenAt: entry.requester.lastSeenAt?.toISO() || null,
        createdAt: entry.createdAt.toISO(),
      }))
    )
  }

  async send({ request, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect().back()
    }

    const character = await this.getCurrentCharacter(auth.user!.id)
    const targetName = request.input('characterName', '').trim()

    if (!targetName) {
      session.flash('errors', { message: 'Nom du personnage requis' })
      return response.redirect().back()
    }

    const target = await Character.query()
      .whereRaw('LOWER(name) = ?', [targetName.toLowerCase()])
      .first()

    if (!target) {
      session.flash('errors', { message: 'Personnage introuvable' })
      return response.redirect().back()
    }

    await target.load('user')
    if (target.user.isGuest) {
      session.flash('errors', { message: this.guestTargetFriendsMessage(locale) })
      return response.redirect().back()
    }

    if (target.id === character.id) {
      session.flash('errors', { message: 'Tu ne peux pas t ajouter toi-meme' })
      return response.redirect().back()
    }

    const existing = await Friendship.query()
      .where((query) => {
        query
          .where((inner) => {
            inner.where('requesterCharacterId', character.id).where('addresseeCharacterId', target.id)
          })
          .orWhere((inner) => {
            inner.where('requesterCharacterId', target.id).where('addresseeCharacterId', character.id)
          })
      })
      .orderBy('id', 'desc')
      .first()

    if (existing) {
      if (existing.status === 'accepted') {
        session.flash('errors', { message: `${target.name} est deja dans tes amis` })
        return response.redirect().back()
      }

      if (existing.status === 'pending') {
        if (existing.requesterCharacterId === target.id && existing.addresseeCharacterId === character.id) {
          existing.status = 'accepted'
          existing.acceptedAt = DateTime.now()
          await existing.save()
          session.flash('success', `${target.name} a ete ajoute automatiquement a tes amis`)
          return response.redirect().back()
        }

        session.flash('errors', { message: 'Une demande est deja en attente' })
        return response.redirect().back()
      }
    }

    await Friendship.create({
      requesterCharacterId: character.id,
      addresseeCharacterId: target.id,
      status: 'pending',
    })

    session.flash('success', `Demande d ami envoyee a ${target.name}`)
    return response.redirect().back()
  }

  async accept({ params, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addresseeCharacterId', character.id)
      .where('status', 'pending')
      .preload('requester')
      .first()

    if (!friendship) {
      session.flash('errors', { message: 'Demande d ami introuvable' })
      return response.redirect('/friends')
    }

    friendship.status = 'accepted'
    friendship.acceptedAt = DateTime.now()
    await friendship.save()

    session.flash('success', `${friendship.requester.name} a ete ajoute a tes amis`)
    return response.redirect('/friends')
  }

  async decline({ params, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addresseeCharacterId', character.id)
      .where('status', 'pending')
      .preload('requester')
      .first()

    if (!friendship) {
      session.flash('errors', { message: 'Demande d ami introuvable' })
      return response.redirect('/friends')
    }

    friendship.status = 'declined'
    friendship.acceptedAt = null
    await friendship.save()

    session.flash('success', `Demande de ${friendship.requester.name} refusee`)
    return response.redirect('/friends')
  }

  async cancel({ params, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('requesterCharacterId', character.id)
      .where('status', 'pending')
      .preload('addressee')
      .first()

    if (!friendship) {
      session.flash('errors', { message: 'Demande introuvable' })
      return response.redirect('/friends')
    }

    await friendship.delete()

    session.flash('success', `Demande annulee pour ${friendship.addressee.name}`)
    return response.redirect('/friends')
  }

  async remove({ params, auth, response, session, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      session.flash('errors', { message: this.guestFriendsMessage(locale) })
      return response.redirect('/play')
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('status', 'accepted')
      .where((query) => {
        query.where('requesterCharacterId', character.id).orWhere('addresseeCharacterId', character.id)
      })
      .preload('requester')
      .preload('addressee')
      .first()

    if (!friendship) {
      session.flash('errors', { message: 'Ami introuvable' })
      return response.redirect('/friends')
    }

    const friend = friendship.requesterCharacterId === character.id ? friendship.addressee : friendship.requester
    await friendship.delete()

    session.flash('success', `${friend.name} a ete retire de tes amis`)
    return response.redirect('/friends')
  }

  async acceptRequest({ params, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestFriendsMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addresseeCharacterId', character.id)
      .where('status', 'pending')
      .preload('requester')
      .first()

    if (!friendship) {
      return response.notFound({ error: 'Demande d ami introuvable' })
    }

    friendship.status = 'accepted'
    friendship.acceptedAt = DateTime.now()
    await friendship.save()

    return response.ok({
      message: `${friendship.requester.name} a ete ajoute a tes amis`,
    })
  }

  async declineRequest({ params, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden({
        error: this.guestFriendsMessage(locale),
        upgradeRequired: true,
        upgradePath: '/account/upgrade',
      })
    }

    const character = await this.getCurrentCharacter(auth.user!.id)

    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addresseeCharacterId', character.id)
      .where('status', 'pending')
      .preload('requester')
      .first()

    if (!friendship) {
      return response.notFound({ error: 'Demande d ami introuvable' })
    }

    const requesterName = friendship.requester.name
    friendship.status = 'declined'
    friendship.acceptedAt = null
    await friendship.save()

    return response.ok({
      message: `Demande de ${requesterName} refusee`,
    })
  }
}
