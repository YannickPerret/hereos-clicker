import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasEmailVerifiedAt = await db.schema.hasColumn(this.tableName, 'email_verified_at')
      const hasEmailVerificationToken = await db.schema.hasColumn(
        this.tableName,
        'email_verification_token'
      )
      const hasEmailVerificationSentAt = await db.schema.hasColumn(
        this.tableName,
        'email_verification_sent_at'
      )
      const hasPasswordResetToken = await db.schema.hasColumn(this.tableName, 'password_reset_token')
      const hasPasswordResetSentAt = await db.schema.hasColumn(
        this.tableName,
        'password_reset_sent_at'
      )
      const hasPasswordResetExpiresAt = await db.schema.hasColumn(
        this.tableName,
        'password_reset_expires_at'
      )

      if (
        !hasEmailVerifiedAt ||
        !hasEmailVerificationToken ||
        !hasEmailVerificationSentAt ||
        !hasPasswordResetToken ||
        !hasPasswordResetSentAt ||
        !hasPasswordResetExpiresAt
      ) {
        await db.schema.alterTable(this.tableName, (table) => {
          if (!hasEmailVerifiedAt) {
            table.timestamp('email_verified_at').nullable()
          }
          if (!hasEmailVerificationToken) {
            table.string('email_verification_token', 64).nullable()
          }
          if (!hasEmailVerificationSentAt) {
            table.timestamp('email_verification_sent_at').nullable()
          }
          if (!hasPasswordResetToken) {
            table.string('password_reset_token', 64).nullable()
          }
          if (!hasPasswordResetSentAt) {
            table.timestamp('password_reset_sent_at').nullable()
          }
          if (!hasPasswordResetExpiresAt) {
            table.timestamp('password_reset_expires_at').nullable()
          }
        })
      }

      const hasGuestFlag = await db.schema.hasColumn(this.tableName, 'is_guest')
      const verifyExistingAccounts = db.from(this.tableName).whereNull('email_verified_at')

      if (hasGuestFlag) {
        verifyExistingAccounts.where('is_guest', false)
      }

      await verifyExistingAccounts.update({
        email_verified_at: new Date().toISOString(),
      })
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasEmailVerifiedAt = await db.schema.hasColumn(this.tableName, 'email_verified_at')
      const hasEmailVerificationToken = await db.schema.hasColumn(
        this.tableName,
        'email_verification_token'
      )
      const hasEmailVerificationSentAt = await db.schema.hasColumn(
        this.tableName,
        'email_verification_sent_at'
      )
      const hasPasswordResetToken = await db.schema.hasColumn(this.tableName, 'password_reset_token')
      const hasPasswordResetSentAt = await db.schema.hasColumn(
        this.tableName,
        'password_reset_sent_at'
      )
      const hasPasswordResetExpiresAt = await db.schema.hasColumn(
        this.tableName,
        'password_reset_expires_at'
      )

      if (
        hasEmailVerifiedAt ||
        hasEmailVerificationToken ||
        hasEmailVerificationSentAt ||
        hasPasswordResetToken ||
        hasPasswordResetSentAt ||
        hasPasswordResetExpiresAt
      ) {
        await db.schema.alterTable(this.tableName, (table) => {
          if (hasEmailVerifiedAt) {
            table.dropColumn('email_verified_at')
          }
          if (hasEmailVerificationToken) {
            table.dropColumn('email_verification_token')
          }
          if (hasEmailVerificationSentAt) {
            table.dropColumn('email_verification_sent_at')
          }
          if (hasPasswordResetToken) {
            table.dropColumn('password_reset_token')
          }
          if (hasPasswordResetSentAt) {
            table.dropColumn('password_reset_sent_at')
          }
          if (hasPasswordResetExpiresAt) {
            table.dropColumn('password_reset_expires_at')
          }
        })
      }
    })
  }
}
