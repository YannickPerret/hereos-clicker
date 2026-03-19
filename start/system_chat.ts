import SystemMessage from '#models/system_message'
import ChatMessage from '#models/chat_message'
import transmit from '@adonisjs/transmit/services/main'

const timers: Map<number, ReturnType<typeof setInterval>> = new Map()

async function startSystemMessages() {
  // Clear all existing timers
  for (const timer of timers.values()) {
    clearInterval(timer)
  }
  timers.clear()

  try {
    const messages = await SystemMessage.query().where('isActive', true)

    for (const msg of messages) {
      const intervalMs = msg.intervalMinutes * 60 * 1000

      const timer = setInterval(async () => {
        try {
          const chatMsg = await ChatMessage.create({
            userId: 0,
            characterName: '[SYSTEM]',
            channel: msg.channel,
            message: msg.message,
          })

          const payload = {
            id: chatMsg.id,
            characterName: '[SYSTEM]',
            message: chatMsg.message,
            channel: msg.channel,
            createdAt: chatMsg.createdAt.toISO(),
          }

          transmit.broadcast(`chat/${msg.channel}`, payload)
        } catch {
          // Silently ignore errors
        }
      }, intervalMs)

      timers.set(msg.id, timer)
    }
  } catch {
    // DB might not be ready yet during boot
  }
}

export function reloadSystemMessages() {
  startSystemMessages()
}

const isAceProcess = process.argv.some((arg) => arg.includes('/ace') || arg.endsWith('ace'))

// Start after a short delay to let DB initialize (HTTP server only)
if (!isAceProcess) {
  setTimeout(startSystemMessages, 3000)
}
