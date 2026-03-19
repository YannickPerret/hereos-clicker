import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class PromoteAdmin extends BaseCommand {
  static commandName = 'user:promote'
  static description = 'Promote a user to admin by username'
  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Username to promote' })
  declare username: string

  async run() {
    const { default: User } = await import('#models/user')
    const { default: Role } = await import('#models/role')

    const user = await User.findBy('username', this.username)
    if (!user) {
      this.logger.error(`User "${this.username}" not found`)
      return
    }

    const adminRole = await Role.findByOrFail('name', 'admin')
    user.roleId = adminRole.id
    await user.save()

    this.logger.success(`${user.username} is now SYSOP (admin)`)
  }
}
