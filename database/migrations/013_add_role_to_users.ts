import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('roles', (table) => {
      table.increments('id')
      table.string('name').notNullable().unique() // user, moderator, admin
      table.string('label').notNullable() // RUNNER, ENFORCER, SYSOP
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.alterTable('users', (table) => {
      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .defaultTo(1) // 'user' role
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('role_id')
    })
    this.schema.dropTable('roles')
  }
}
