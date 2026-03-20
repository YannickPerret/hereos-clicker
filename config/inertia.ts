import { defineConfig } from '@adonisjs/inertia'
import Character from '#models/character'
import BlackMarketService from '#services/black_market_service'
import PartyMember from '#models/party_member'

export default defineConfig({
  rootView: 'inertia_layout',

  sharedData: {
    errors: (ctx) => ctx.session?.flashMessages.get('errors'),
    combatLog: (ctx) => ctx.session?.flashMessages.get('combatLog'),
    pvpResult: (ctx) => ctx.session?.flashMessages.get('pvpResult'),
    success: (ctx) => ctx.session?.flashMessages.get('success'),
    auth: async (ctx) => {
      const user = ctx.auth?.user
      if (user) {
        await user.load('role')
        const activeCharacter = await Character.query().where('userId', user.id).first()
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            roleLabel: user.role.label,
          },
          activeCharacterName: activeCharacter?.name || null,
          activeCharacterLevel: activeCharacter?.level || null,
        }
      }
      return { user: null }
    },
    partyChannel: async (ctx) => {
      const user = ctx.auth?.user
      if (!user) return null
      try {
        const character = await Character.query().where('userId', user.id).first()
        if (!character) return null
        const membership = await PartyMember.query()
          .where('characterId', character.id)
          .whereHas('party', (q) => q.whereIn('status', ['waiting', 'countdown', 'in_dungeon']))
          .preload('party')
          .first()
        if (!membership) return null
        return `party-${membership.party.id}`
      } catch {
        return null
      }
    },
    blackMarket: async () => {
      try {
        return {
          minLevel: await BlackMarketService.getMinLevel(),
        }
      } catch {
        return {
          minLevel: 12,
        }
      }
    },
  },

  ssr: {
    enabled: false,
  },
})
