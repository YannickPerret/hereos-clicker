interface PresenceEntry {
  userId: number
  characterName: string
  lastSeenAt: number
}

const ONLINE_TTL_MS = 45_000

class ChatPresenceService {
  private onlineUsers = new Map<number, PresenceEntry>()

  private pruneStaleEntries() {
    const now = Date.now()

    for (const [userId, entry] of this.onlineUsers.entries()) {
      if (now - entry.lastSeenAt > ONLINE_TTL_MS) {
        this.onlineUsers.delete(userId)
      }
    }
  }

  touch(userId: number, characterName: string) {
    const normalizedName = characterName.trim()
    if (!normalizedName) return

    this.pruneStaleEntries()
    this.onlineUsers.set(userId, {
      userId,
      characterName: normalizedName,
      lastSeenAt: Date.now(),
    })
  }

  getOnlineCharacterNames(excludeUserId?: number) {
    this.pruneStaleEntries()

    return Array.from(this.onlineUsers.values())
      .filter((entry) => entry.userId !== excludeUserId)
      .map((entry) => entry.characterName)
      .filter((name, index, names) => names.indexOf(name) === index)
      .sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }))
  }

  isCharacterOnline(characterName: string) {
    const normalizedName = characterName.trim().toLowerCase()
    if (!normalizedName) return false

    this.pruneStaleEntries()

    return Array.from(this.onlineUsers.values()).some(
      (entry) => entry.characterName.trim().toLowerCase() === normalizedName
    )
  }
}

export default new ChatPresenceService()
