import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('characters', (table) => {
      table.string('chosen_spec').nullable() // hacker, netrunner, samurai, chrome_dealer
    })
  }

  async down() {
    this.schema.alterTable('characters', (table) => {
      table.dropColumn('chosen_spec')
    })
  }
}
