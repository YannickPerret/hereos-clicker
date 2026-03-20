import { BaseSchema } from '@adonisjs/lucid/schema'

const MAIN_ARC_QUESTS = [
  {
    key: 'boot_sequence',
    arc_key: 'ghost_in_the_grid',
    arc_title: 'Ghost In The Grid',
    giver_name: 'Ghost',
    title: 'Boot Sequence',
    summary: 'Stabilise ton implant et lance ton premier script de siphonnage.',
    narrative:
      'Un contact fantome t envoie un ping sale. Pas de nom, pas de visage, juste une promesse: si tu tiens la ligne assez longtemps, Night City va enfin commencer a te remarquer.',
    objective_type: 'hack_clicks',
    target_value: 25,
    reward_type: 'credits',
    reward_value: 250,
    icon: 'terminal',
    sort_order: 1,
    required_quest_key: null,
  },
  {
    key: 'signal_theft',
    arc_key: 'ghost_in_the_grid',
    arc_title: 'Ghost In The Grid',
    giver_name: 'Ghost',
    title: 'Signal Theft',
    summary: 'Siphonne assez de credits pour prouver que ta ligne tient la charge.',
    narrative:
      'Le contact te donne une cible mineure: une ligne de cache mal protegee. Rien de glorieux, mais assez pour montrer si tu sais voler sans laisser trop de bruit.',
    objective_type: 'hack_credits',
    target_value: 400,
    reward_type: 'xp',
    reward_value: 80,
    icon: 'signal',
    sort_order: 2,
    required_quest_key: 'boot_sequence',
  },
  {
    key: 'cache_warmup',
    arc_key: 'ghost_in_the_grid',
    arc_title: 'Ghost In The Grid',
    giver_name: 'Ghost',
    title: 'Cache Warmup',
    summary: 'Monte la cadence et fais chauffer le cache du district.',
    narrative:
      'La cible suivante n est pas plus riche, juste plus surveillee. Ton job: tenir le rythme, forcer les verrous et montrer que tes mains suivent ton ambition.',
    objective_type: 'hack_clicks',
    target_value: 120,
    reward_type: 'credits',
    reward_value: 900,
    icon: 'cache',
    sort_order: 3,
    required_quest_key: 'signal_theft',
  },
  {
    key: 'pattern_learning',
    arc_key: 'ghost_in_the_grid',
    arc_title: 'Ghost In The Grid',
    giver_name: 'Ghost',
    title: 'Pattern Learning',
    summary: 'Passe niveau 3 pour prouver que ton implant apprend plus vite que la concurrence.',
    narrative:
      'Ghost ne veut plus juste un script kiddie. Il veut quelqu un qui grandit vite, absorbe les motifs et devient dangereux a mesure que le traffic augmente.',
    objective_type: 'reach_level',
    target_value: 3,
    reward_type: 'talent_points',
    reward_value: 1,
    icon: 'pattern',
    sort_order: 4,
    required_quest_key: 'cache_warmup',
  },
  {
    key: 'black_gate',
    arc_key: 'ghost_in_the_grid',
    arc_title: 'Ghost In The Grid',
    giver_name: 'Ghost',
    title: 'Black Gate',
    summary: 'Force un dernier siphon lourd pour ouvrir la suite de l arc.',
    narrative:
      'Une porte plus serieuse t attend au bout de la ligne. Ce n est pas encore la guerre, mais c est assez gros pour attirer de vrais regards si tu rates.',
    objective_type: 'hack_credits',
    target_value: 2500,
    reward_type: 'credits',
    reward_value: 2500,
    icon: 'gate',
    sort_order: 5,
    required_quest_key: 'pattern_learning',
  },
]

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('quests', (table) => {
      table.increments('id').notNullable()
      table.string('key').notNullable().unique()
      table.string('arc_key').notNullable()
      table.string('arc_title').notNullable()
      table.string('giver_name').nullable()
      table.string('title').notNullable()
      table.string('summary').notNullable()
      table.text('narrative').nullable()
      table.string('objective_type').notNullable()
      table.integer('target_value').notNullable()
      table.string('reward_type').notNullable()
      table.integer('reward_value').notNullable().defaultTo(0)
      table.string('icon').notNullable().defaultTo('terminal')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.string('required_quest_key').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    this.schema.createTable('character_quests', (table) => {
      table.increments('id').notNullable()
      table.integer('character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('quest_id').unsigned().notNullable().references('id').inTable('quests').onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('active')
      table.integer('progress').notNullable().defaultTo(0)
      table.timestamp('started_at').notNullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.unique(['character_id', 'quest_id'])
    })

    this.defer(async (db) => {
      for (const quest of MAIN_ARC_QUESTS) {
        const existing = await db.from('quests').where('key', quest.key).first()

        if (existing) {
          await db.from('quests').where('id', existing.id).update({
            ...quest,
            updated_at: new Date(),
          })
          continue
        }

        await db.table('quests').insert({
          ...quest,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasCharacterQuests = await db.schema.hasTable('character_quests')
      if (hasCharacterQuests) {
        await db.schema.dropTable('character_quests')
      }

      const hasQuests = await db.schema.hasTable('quests')
      if (hasQuests) {
        await db.schema.dropTable('quests')
      }
    })
  }
}
