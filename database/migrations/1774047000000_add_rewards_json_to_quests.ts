import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasRewardsJson = await db.schema.hasColumn('quests', 'rewards_json')

      if (!hasRewardsJson) {
        await db.schema.alterTable('quests', (table) => {
          table.text('rewards_json').nullable()
        })
      }

      const quests = await db.from('quests').select('id', 'reward_type', 'reward_value', 'rewards_json')

      for (const quest of quests) {
        if (quest.rewards_json) {
          continue
        }

        const rewardValue = Number(quest.reward_value || 0)
        const rewards = rewardValue > 0
          ? [{ type: String(quest.reward_type || 'credits'), value: rewardValue, itemId: null, itemName: null }]
          : []

        await db.from('quests').where('id', quest.id).update({
          rewards_json: JSON.stringify(rewards),
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasRewardsJson = await db.schema.hasColumn('quests', 'rewards_json')
      if (hasRewardsJson) {
        await db.schema.alterTable('quests', (table) => {
          table.dropColumn('rewards_json')
        })
      }
    })
  }
}
