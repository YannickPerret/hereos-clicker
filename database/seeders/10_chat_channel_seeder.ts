import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ChatChannel from '#models/chat_channel'

export default class extends BaseSeeder {
  async run() {
    await ChatChannel.updateOrCreateMany('name', [
      { name: 'global', label: 'GLOBAL', isPublic: true },
      { name: 'trade', label: 'TRADE', isPublic: true },
      { name: 'pvp', label: 'PVP', isPublic: true },
      { name: 'lfg', label: 'LFG', isPublic: true },
    ])
  }
}
