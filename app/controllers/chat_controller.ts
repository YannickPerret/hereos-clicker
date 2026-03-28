import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Character from '#models/character'
import ChatMessage from '#models/chat_message'
import ChatChannel from '#models/chat_channel'
import PartyMember from '#models/party_member'
import transmit from '@adonisjs/transmit/services/main'
import ChatPresenceService from '#services/chat_presence_service'

export default class ChatController {
  private guestChatError(locale: string) {
    return {
      error:
        locale === 'en'
          ? 'Guests cannot send chat messages. Create an account first.'
          : 'Les invites ne peuvent pas parler dans le chat. Cree un compte d abord.',
      upgradeRequired: true,
      upgradePath: '/account/upgrade',
    }
  }

  /** API: get channels list */
  async channels({ response }: HttpContext) {
    const channels = await ChatChannel.query().where('isPublic', true).orderBy('createdAt', 'asc')

    return response.json(
      channels.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.label,
        isPublic: c.isPublic,
      }))
    )
  }

  /** API: get messages for a channel */
  async messages({ request, response }: HttpContext) {
    const channel = request.input('channel', 'global')
    const messages = await ChatMessage.query()
      .where('channel', channel)
      .orderBy('createdAt', 'desc')
      .limit(50)

    return response.json(messages.reverse().map((m) => m.serialize()))
  }

  /** API: lightweight presence heartbeat */
  async presence({ request, auth, response }: HttpContext) {
    const requestedName = request.input('characterName', '').trim()
    const fallbackName = auth.user!.username
    const character = await Character.query().where('userId', auth.user!.id).first()
    const currentName = requestedName || character?.name || fallbackName

    ChatPresenceService.touch(auth.user!.id, currentName)

    if (character) {
      character.lastSeenAt = DateTime.now()
      await character.save()
    }

    return response.json({ ok: true })
  }

  /** API: get online players for mention completion */
  async online({ auth, response }: HttpContext) {
    return response.json(ChatPresenceService.getOnlineCharacterNames(auth.user!.id))
  }

  /** API: send a message */
  async send({ request, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden(this.guestChatError(locale))
    }

    const character = await Character.query().where('userId', auth.user!.id).first()

    const message = request.input('message', '').trim()
    const channel = request.input('channel', 'global')

    if (!message || message.length > 500) {
      return response.badRequest({ error: 'Message invalide' })
    }

    // Verify channel exists
    const ch = await ChatChannel.findBy('name', channel)
    if (!ch) {
      return response.badRequest({ error: 'Salon inconnu' })
    }

    // Check access for private channels
    if (!ch.isPublic) {
      // Party channels: check membership
      if (ch.name.startsWith('party-')) {
        const partyId = Number.parseInt(ch.name.replace('party-', ''), 10)
        const currentCharacter = await Character.query().where('userId', auth.user!.id).first()
        const isMember = currentCharacter
          ? await PartyMember.query()
              .where('characterId', currentCharacter.id)
              .where('partyId', partyId)
              .first()
          : null
        if (!isMember) {
          return response.forbidden({ error: 'Tu ne fais pas partie de ce groupe' })
        }
      } else {
        const password = request.input('password', '')
        if (ch.password && ch.password !== password) {
          return response.forbidden({ error: 'Mot de passe incorrect' })
        }
      }
    }

    const senderName = character?.name || auth.user!.username
    ChatPresenceService.touch(auth.user!.id, senderName)

    const chatMsg = await ChatMessage.create({
      userId: auth.user!.id,
      characterName: senderName,
      channel,
      message,
    })

    const payload = {
      id: chatMsg.id,
      characterName: senderName,
      message: chatMsg.message,
      channel,
      createdAt: chatMsg.createdAt.toISO(),
    }

    // Broadcast via SSE
    transmit.broadcast(`chat/${channel}`, payload)

    return response.json(payload)
  }

  /** API: create a channel */
  async createChannel({ request, auth, response, locale }: HttpContext) {
    if (auth.user!.isGuest) {
      return response.forbidden(this.guestChatError(locale))
    }

    const name = request
      .input('name', '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
    const label = request.input('label', '').trim()
    const isPublic = request.input('isPublic', true)
    const password = request.input('password', '')

    if (!name || name.length < 2 || name.length > 30) {
      return response.badRequest({
        error: 'Nom de salon invalide (2-30 caracteres, lettres/chiffres)',
      })
    }

    const existing = await ChatChannel.findBy('name', name)
    if (existing) {
      return response.badRequest({ error: 'Ce salon existe deja' })
    }

    const channel = await ChatChannel.create({
      name,
      label: label || name.toUpperCase(),
      isPublic,
      password: !isPublic && password ? password : null,
      createdBy: auth.user!.id,
    })

    const payload = {
      id: channel.id,
      name: channel.name,
      label: channel.label,
      isPublic: channel.isPublic,
    }

    // Broadcast new channel to all clients
    if (channel.isPublic) {
      transmit.broadcast('chat/channels', { type: 'new_channel', channel: payload })
    }

    return response.json(payload)
  }

  /** API: join private channel */
  async joinChannel({ request, response }: HttpContext) {
    const name = request.input('name', '')
    const password = request.input('password', '')

    const channel = await ChatChannel.findBy('name', name)
    if (!channel) {
      return response.notFound({ error: 'Salon introuvable' })
    }

    if (!channel.isPublic && channel.password && channel.password !== password) {
      return response.forbidden({ error: 'Mot de passe incorrect' })
    }

    return response.json({
      id: channel.id,
      name: channel.name,
      label: channel.label,
      isPublic: channel.isPublic,
    })
  }
}
