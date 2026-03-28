import { DateTime } from 'luxon'
import User from '#models/user'
import ChatChannel from '#models/chat_channel'

export default class GuestAccountService {
  static expirationDays = 3

  static getExpirationCutoff() {
    return DateTime.now().minus({ days: this.expirationDays })
  }

  static isExpired(user: Pick<User, 'isGuest' | 'createdAt'>) {
    if (!user.isGuest) return false
    return user.createdAt.toMillis() <= this.getExpirationCutoff().toMillis()
  }

  static async purgeExpiredGuests(limit = 100) {
    const expiredGuests = await User.query()
      .where('isGuest', true)
      .where('createdAt', '<=', this.getExpirationCutoff().toSQL()!)
      .orderBy('createdAt', 'asc')
      .limit(limit)

    for (const user of expiredGuests) {
      await this.deleteGuest(user)
    }

    return expiredGuests.length
  }

  static async deleteGuest(user: User) {
    await ChatChannel.query().where('createdBy', user.id).delete()
    await user.delete()
  }
}
