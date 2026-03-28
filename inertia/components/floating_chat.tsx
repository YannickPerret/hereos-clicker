import { useState, useEffect, useRef, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { translateBackendMessage } from '~/i18n/backend_messages'

interface Message {
  id: number
  characterName: string
  message: string
  channel: string
  createdAt: string
}

interface Channel {
  id: number
  name: string
  label: string
  isPublic: boolean
}

interface UserMenuState {
  characterName: string
  x: number
  y: number
}

interface ChatFeedback {
  type: 'success' | 'error' | 'info'
  message: string
}

interface MentionQueryState {
  start: number
  end: number
  query: string
}

function getCsrfToken() {
  return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '')
}

function getChatOpenStorageKey(username: string) {
  return `floating-chat-open:${username}`
}

function getChatClosedAtStorageKey(username: string) {
  return `floating-chat-closed-at:${username}`
}

function getBlockedUsersStorageKey(username: string) {
  return `floating-chat-blocked-users:${username}`
}

function extractMentionQuery(value: string, caretPosition: number) {
  const beforeCaret = value.slice(0, caretPosition)
  const match = beforeCaret.match(/(^|\s)@([^\s@]{0,50})$/)
  if (!match) return null

  const query = match[2]
  return {
    start: beforeCaret.length - query.length - 1,
    end: caretPosition,
    query,
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function messageMentionsPlayer(message: string, playerNames: string[]) {
  return playerNames.some((playerName) => {
    const pattern = new RegExp(`(^|\\s)@${escapeRegExp(playerName)}(?=$|\\s|[.,!?;:])`, 'i')
    return pattern.test(message)
  })
}

export default function FloatingChat() {
  const page = usePage() as any
  const { auth, partyChannel } = page.props as any
  if (!auth?.user) return null

  return (
    <ChatWidget
      username={auth.user.username}
      activeCharacterName={auth.activeCharacterName || null}
      partyChannel={partyChannel || null}
      isGuest={Boolean(auth.user.isGuest)}
    />
  )
}

function ChatWidget({
  username,
  activeCharacterName,
  partyChannel,
  isGuest,
}: {
  username: string
  activeCharacterName: string | null
  partyChannel: string | null
  isGuest: boolean
}) {
  const { t, i18n } = useTranslation(['chat', 'common'])

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(getChatOpenStorageKey(username)) === '1'
  })
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState('global')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelPublic, setNewChannelPublic] = useState(true)
  const [newChannelPassword, setNewChannelPassword] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userMenu, setUserMenu] = useState<UserMenuState | null>(null)
  const [feedback, setFeedback] = useState<ChatFeedback | null>(null)
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([])
  const [mentionQuery, setMentionQuery] = useState<MentionQueryState | null>(null)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionAlertCount, setMentionAlertCount] = useState(0)
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(getBlockedUsersStorageKey(username))
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string')
        : []
    } catch {
      return []
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const closedAtRef = useRef<string | null>(
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(getChatClosedAtStorageKey(username))
  )
  const lastProcessedMessageIdsRef = useRef<Record<string, number>>({})
  const baseTitleRef = useRef(
    typeof document === 'undefined' ? 'HereOS - Cyberpunk Clicker' : document.title
  )
  const mentionSuggestions = mentionQuery
    ? onlinePlayers
        .filter(
          (playerName) =>
            mentionQuery.query.length === 0 ||
            playerName.toLowerCase().startsWith(mentionQuery.query.toLowerCase())
        )
        .slice(0, 6)
    : []

  const clearMentionAlert = useCallback(() => {
    setMentionAlertCount(0)
    if (typeof document !== 'undefined') {
      document.title = baseTitleRef.current
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getChatOpenStorageKey(username), isOpen ? '1' : '0')
  }, [isOpen, username])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getBlockedUsersStorageKey(username), JSON.stringify(blockedUsers))
  }, [blockedUsers, username])

  useEffect(() => {
    if (!userMenu) return

    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenu(null)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [userMenu])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (mentionAlertCount === 0) {
      baseTitleRef.current = document.title
      return
    }

    document.title = `(${mentionAlertCount}) ${
      mentionAlertCount > 1 ? t('chat:mentionTitlePlural') : t('chat:mentionTitle')
    } | ${baseTitleRef.current}`

    return () => {
      document.title = baseTitleRef.current
    }
  }, [mentionAlertCount, t])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const handleVisibleFocus = () => {
      if (!document.hidden) {
        clearMentionAlert()
      }
    }

    window.addEventListener('focus', handleVisibleFocus)
    document.addEventListener('visibilitychange', handleVisibleFocus)
    return () => {
      window.removeEventListener('focus', handleVisibleFocus)
      document.removeEventListener('visibilitychange', handleVisibleFocus)
    }
  }, [clearMentionAlert])

  const openChat = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
    clearMentionAlert()
    closedAtRef.current = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(getChatClosedAtStorageKey(username))
    }
  }, [clearMentionAlert, username])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setUnreadCount(0)
    setUserMenu(null)
    const closedAt = new Date().toISOString()
    closedAtRef.current = closedAt
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getChatClosedAtStorageKey(username), closedAt)
    }
  }, [username])

  // Auto-inject party channel
  useEffect(() => {
    if (!partyChannel) return
    setChannels((prev) => {
      if (prev.find((c) => c.name === partyChannel)) return prev
      return [...prev, { id: -1, name: partyChannel, label: t('partyChannel'), isPublic: false }]
    })
  }, [partyChannel])

  // Remove party channel when no longer in a party
  const prevPartyChannel = useRef(partyChannel)
  useEffect(() => {
    if (prevPartyChannel.current && prevPartyChannel.current !== partyChannel) {
      setChannels((prev) => prev.filter((c) => c.name !== prevPartyChannel.current))
      if (activeChannel === prevPartyChannel.current) {
        setActiveChannel('global')
      }
    }
    prevPartyChannel.current = partyChannel
  }, [partyChannel, activeChannel])

  // Load & poll channels
  const loadChannels = useCallback(() => {
    fetch('/chat/channels')
      .then((r) => r.json())
      .then((data: Channel[]) => {
        setChannels((prev) => {
          // Merge: keep private channels the user joined manually + party channel
          const publicNames = new Set(data.map((c: Channel) => c.name))
          const kept = prev.filter((c) => !c.isPublic && !publicNames.has(c.name))
          return [...data, ...kept]
        })
      })
      .catch(() => {})
  }, [])

  const loadOnlinePlayers = useCallback(() => {
    fetch('/chat/online')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return
        setOnlinePlayers(data.filter((entry): entry is string => typeof entry === 'string'))
      })
      .catch(() => {})
  }, [])

  const sendPresenceHeartbeat = useCallback(() => {
    const characterName = (activeCharacterName || username || '').trim()
    if (!characterName) return

    fetch('/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      body: JSON.stringify({ characterName }),
    }).catch(() => {})
  }, [activeCharacterName, username])

  const syncMentionQuery = useCallback((value: string, caretPosition: number | null) => {
    if (caretPosition === null) {
      setMentionQuery(null)
      return
    }

    const nextMentionQuery = extractMentionQuery(value, caretPosition)
    setMentionQuery(nextMentionQuery)
    setSelectedMentionIndex(0)
  }, [])

  const insertMention = useCallback(
    (playerName: string) => {
      if (!mentionQuery) return

      const nextInput = `${input.slice(0, mentionQuery.start)}@${playerName} ${input.slice(mentionQuery.end)}`
      const nextCaretPosition = mentionQuery.start + playerName.length + 2

      setInput(nextInput)
      setMentionQuery(null)
      setSelectedMentionIndex(0)

      window.requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(nextCaretPosition, nextCaretPosition)
      })
    },
    [input, mentionQuery]
  )

  useEffect(() => {
    loadChannels()
    const interval = setInterval(loadChannels, 10000)
    return () => clearInterval(interval)
  }, [loadChannels])

  useEffect(() => {
    loadOnlinePlayers()
    const interval = setInterval(loadOnlinePlayers, 10000)
    return () => clearInterval(interval)
  }, [loadOnlinePlayers])

  useEffect(() => {
    sendPresenceHeartbeat()

    const interval = window.setInterval(sendPresenceHeartbeat, 15000)
    const handleVisible = () => {
      if (!document.hidden) {
        sendPresenceHeartbeat()
        loadOnlinePlayers()
      }
    }

    document.addEventListener('visibilitychange', handleVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [loadOnlinePlayers, sendPresenceHeartbeat])

  // Load messages & poll
  const loadMessages = useCallback(() => {
    fetch(`/chat/messages?channel=${activeChannel}`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data)
        const ownMentionTargets = [activeCharacterName, username].filter(
          (value, index, values): value is string =>
            Boolean(value) && values.indexOf(value) === index
        )

        const previousLastProcessedId = lastProcessedMessageIdsRef.current[activeChannel]
        const latestMessageId = data.length > 0 ? data[data.length - 1].id : 0

        if (previousLastProcessedId === undefined) {
          lastProcessedMessageIdsRef.current[activeChannel] = latestMessageId
        } else {
          const newMessages = data.filter((msg) => msg.id > previousLastProcessedId)
          if (newMessages.length > 0) {
            lastProcessedMessageIdsRef.current[activeChannel] = latestMessageId

            const mentionHits = newMessages.filter(
              (msg) =>
                msg.characterName !== '[SYSTEM]' &&
                msg.characterName !== activeCharacterName &&
                msg.characterName !== username &&
                !blockedUsers.includes(msg.characterName) &&
                messageMentionsPlayer(msg.message, ownMentionTargets)
            )

            if (mentionHits.length > 0 && (document.hidden || !isOpen)) {
              setMentionAlertCount((current) => current + mentionHits.length)
            }
          }
        }

        if (!isOpen && closedAtRef.current) {
          const closedAtTs = new Date(closedAtRef.current).getTime()
          const unread = data.filter(
            (msg: Message) =>
              msg.characterName !== '[SYSTEM]' &&
              !blockedUsers.includes(msg.characterName) &&
              new Date(msg.createdAt).getTime() > closedAtTs
          ).length
          setUnreadCount(unread)
          return
        }
        if (isOpen) {
          setUnreadCount(0)
        }
      })
      .catch(() => {})
  }, [activeChannel, activeCharacterName, blockedUsers, isOpen, username])

  useEffect(() => {
    loadMessages()
    pollRef.current = setInterval(loadMessages, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadMessages])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const res = await fetch('/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      body: JSON.stringify({ message: input, channel: activeChannel }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const message = data?.error ? translateBackendMessage(data.error, t) : t('chat:actionFailed')
      setFeedback({ type: 'error', message })
      if (data?.upgradeRequired) {
        router.visit(data.upgradePath || '/account/upgrade')
      }
      return
    }

    setInput('')
    setMentionQuery(null)
    loadMessages()
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGuest) {
      router.visit('/account/upgrade')
      return
    }

    const res = await fetch('/chat/channels/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      body: JSON.stringify({
        name: newChannelName,
        isPublic: newChannelPublic,
        password: newChannelPassword,
      }),
    })
    if (res.ok) {
      const ch = await res.json()
      setChannels((prev) => {
        if (prev.find((c) => c.name === ch.name)) return prev
        return [...prev, ch]
      })
      setActiveChannel(ch.name)
      setShowCreateChannel(false)
      setNewChannelName('')
      setNewChannelPassword('')
    }
  }

  const handleJoinChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGuest) {
      router.visit('/account/upgrade')
      return
    }

    const res = await fetch('/chat/channels/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
      body: JSON.stringify({ name: joinName, password: joinPassword }),
    })
    if (res.ok) {
      const ch = await res.json()
      if (!channels.find((c) => c.name === ch.name)) {
        setChannels((prev) => [...prev, ch])
      }
      setActiveChannel(ch.name)
      setShowJoin(false)
      setJoinName('')
      setJoinPassword('')
    }
  }

  const openUserMenu = (event: React.MouseEvent<HTMLButtonElement>, characterName: string) => {
    if (characterName === activeCharacterName || characterName === username) return

    const rect = event.currentTarget.getBoundingClientRect()
    setUserMenu({
      characterName,
      x: rect.left,
      y: rect.bottom + 6,
    })
  }

  const toggleBlockedUser = (characterName: string) => {
    setBlockedUsers((current) =>
      current.includes(characterName)
        ? current.filter((entry) => entry !== characterName)
        : [...current, characterName]
    )

    const isBlocked = blockedUsers.includes(characterName)
    setFeedback({
      type: isBlocked ? 'success' : 'info',
      message: isBlocked
        ? t('chat:userUnblocked', { name: characterName })
        : t('chat:userBlocked', { name: characterName }),
    })
    setUserMenu(null)
  }

  const handleInviteToParty = async (characterName: string) => {
    try {
      const res = await fetch('/party/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ characterName }),
      })

      const data = await res.json().catch(() => ({}))
      setFeedback({
        type: res.ok ? 'success' : 'error',
        message:
          data.message || data.error
            ? translateBackendMessage(data.message || data.error, t)
            : t('chat:actionFailed'),
      })
    } catch {
      setFeedback({
        type: 'error',
        message: t('chat:networkError'),
      })
    }

    setUserMenu(null)
  }

  const handleReportUser = (characterName: string) => {
    const params = new URLSearchParams({
      compose: '1',
      category: 'player',
      title: t('chat:reportPlayerTitle', { name: characterName }),
      description: t('chat:reportPlayerDescription', {
        name: characterName,
        channel: activeChannel,
      }),
    })

    setUserMenu(null)
    router.visit(`/reports?${params.toString()}`)
  }

  const handleViewProfile = (characterName: string) => {
    setUserMenu(null)
    router.visit(`/profile/${encodeURIComponent(characterName)}`)
  }

  const handleAddFriend = (characterName: string) => {
    setUserMenu(null)
    router.post(
      '/friends/request',
      { characterName },
      {
        preserveScroll: true,
        preserveState: true,
      }
    )
  }

  const handleUnavailableAction = (label: string) => {
    setFeedback({
      type: 'info',
      message: t('chat:socialBackendLater', { label }),
    })
    setUserMenu(null)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setInput(nextValue)
    syncMentionQuery(nextValue, event.target.selectionStart)
  }

  const handleInputSelect = (event: React.SyntheticEvent<HTMLInputElement>) => {
    syncMentionQuery(event.currentTarget.value, event.currentTarget.selectionStart)
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionSuggestions.length === 0) {
      if (event.key === 'Escape') {
        setMentionQuery(null)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedMentionIndex((current) => (current + 1) % mentionSuggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedMentionIndex(
        (current) => (current - 1 + mentionSuggestions.length) % mentionSuggestions.length
      )
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      insertMention(mentionSuggestions[selectedMentionIndex] || mentionSuggestions[0])
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setMentionQuery(null)
    }
  }

  const visibleMessages = messages.filter(
    (msg) => msg.characterName === '[SYSTEM]' || !blockedUsers.includes(msg.characterName)
  )

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-cyber-dark border-2 border-cyber-green/50 text-cyber-green flex items-center justify-center hover:bg-cyber-green/10 hover:border-cyber-green transition-all shadow-lg"
        >
          <span className="text-lg">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyber-red text-white text-[9px] flex items-center justify-center font-bold">
              {unreadCount >= 10 ? '10+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 left-4 z-50 h-[min(500px,70vh)] w-[90vw] max-w-[90vw] bg-cyber-black border border-cyber-green/30 rounded-lg shadow-2xl flex flex-col overflow-hidden sm:h-[500px] sm:w-96 sm:max-w-none">
          {/* Header */}
          <div className="bg-cyber-dark border-b border-cyber-green/20 px-3 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] text-cyber-green uppercase tracking-widest font-bold">
                {t('chat:chatHeader')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowChannelMenu(!showChannelMenu)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                  activeChannel === partyChannel
                    ? 'border-cyber-purple/30 text-cyber-purple hover:border-cyber-purple/50'
                    : 'border-gray-800 text-gray-500 hover:text-cyber-green hover:border-cyber-green/30'
                }`}
              >
                {activeChannel === partyChannel ? '👥 ' + t('partyChannel') : `#${activeChannel}`}
              </button>
              <button
                onClick={closeChat}
                className="text-gray-600 hover:text-cyber-red text-xs ml-1 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Channel menu */}
          {showChannelMenu && (
            <div className="bg-cyber-dark border-b border-gray-800 p-2 space-y-1 shrink-0 max-h-48 overflow-y-auto">
              {channels.map((ch) => (
                <button
                  key={ch.name}
                  onClick={() => {
                    setActiveChannel(ch.name)
                    setShowChannelMenu(false)
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] transition-all ${
                    activeChannel === ch.name
                      ? ch.name === partyChannel
                        ? 'bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30'
                        : 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30'
                      : 'text-gray-500 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {ch.name === partyChannel ? '👥 ' + t('partyChannel') : `#${ch.name}`}
                  {!ch.isPublic && ch.name !== partyChannel && (
                    <span className="text-cyber-yellow ml-1">🔒</span>
                  )}
                </button>
              ))}
              <div className="flex gap-1 pt-1 border-t border-gray-800">
                {!isGuest && (
                  <>
                    <button
                      onClick={() => {
                        setShowCreateChannel(true)
                        setShowChannelMenu(false)
                      }}
                      className="flex-1 text-[9px] px-1 py-1 rounded border border-cyber-green/20 text-cyber-green hover:bg-cyber-green/10"
                    >
                      + {t('chat:create')}
                    </button>
                    <button
                      onClick={() => {
                        setShowJoin(true)
                        setShowChannelMenu(false)
                      }}
                      className="flex-1 text-[9px] px-1 py-1 rounded border border-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue/10"
                    >
                      {t('chat:join')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Create Channel Form */}
          {showCreateChannel && (
            <form
              onSubmit={handleCreateChannel}
              className="bg-cyber-dark border-b border-gray-800 p-2 space-y-1.5 shrink-0"
            >
              <div className="text-[9px] text-gray-500 uppercase">{t('createChannel')}</div>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) =>
                  setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                }
                placeholder={t('channelPlaceholder')}
                maxLength={30}
                className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:border-cyber-green/50 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewChannelPublic(!newChannelPublic)}
                  className={`text-[9px] px-2 py-0.5 rounded border ${newChannelPublic ? 'border-cyber-green/30 text-cyber-green' : 'border-cyber-yellow/30 text-cyber-yellow'}`}
                >
                  {newChannelPublic ? t('chat:public') : t('chat:private')}
                </button>
                {!newChannelPublic && (
                  <input
                    type="text"
                    value={newChannelPassword}
                    onChange={(e) => setNewChannelPassword(e.target.value)}
                    placeholder={t('chat:passwordPlaceholder')}
                    className="flex-1 bg-cyber-black border border-gray-800 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none"
                  />
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="text-[9px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="text-[9px] px-2 py-1 text-gray-600"
                >
                  {t('chat:cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Join Channel Form */}
          {showJoin && (
            <form
              onSubmit={handleJoinChannel}
              className="bg-cyber-dark border-b border-gray-800 p-2 space-y-1.5 shrink-0"
            >
              <div className="text-[9px] text-gray-500 uppercase">{t('joinPrivate')}</div>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder={t('channelPlaceholder')}
                className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
              />
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder={t('chat:passwordPlaceholder')}
                className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
              />
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="text-[9px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10"
                >
                  {t('chat:join')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  className="text-[9px] px-2 py-1 text-gray-600"
                >
                  {t('chat:cancel')}
                </button>
              </div>
            </form>
          )}

          {feedback && (
            <div
              className={`border-b px-3 py-2 text-[10px] uppercase tracking-widest shrink-0 ${
                feedback.type === 'success'
                  ? 'border-cyber-green/20 bg-cyber-green/10 text-cyber-green'
                  : feedback.type === 'error'
                    ? 'border-cyber-red/20 bg-cyber-red/10 text-cyber-red'
                    : 'border-cyber-blue/20 bg-cyber-blue/10 text-cyber-blue'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 font-mono space-y-0.5"
            style={{ fontSize: '11px' }}
          >
            {visibleMessages.length === 0 ? (
              <div className="text-gray-700 text-center py-10 text-[10px]">
                {t('chat:waitingTransmission')}
              </div>
            ) : (
              visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-1.5 px-1 rounded ${msg.characterName === '[SYSTEM]' ? 'bg-cyber-yellow/5' : 'hover:bg-cyber-green/5'}`}
                >
                  <span className="text-gray-700 shrink-0">[{formatTime(msg.createdAt)}]</span>
                  {msg.characterName === '[SYSTEM]' ? (
                    <span className="font-bold shrink-0 text-cyber-yellow">
                      {msg.characterName}:
                    </span>
                  ) : msg.characterName === activeCharacterName ||
                    msg.characterName === username ? (
                    <span className="font-bold shrink-0 text-cyber-blue">{msg.characterName}:</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => openUserMenu(event, msg.characterName)}
                      className={`font-bold shrink-0 transition-colors ${
                        msg.characterName === activeCharacterName || msg.characterName === username
                          ? 'text-cyber-blue hover:text-cyber-blue/80'
                          : 'text-cyber-green hover:text-cyber-yellow'
                      }`}
                    >
                      {msg.characterName}:
                    </button>
                  )}
                  <span
                    className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${msg.characterName === '[SYSTEM]' ? 'text-cyber-yellow/80 italic' : 'text-gray-300'}`}
                  >
                    {msg.message}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="relative border-t border-cyber-green/20 p-2 flex gap-2 shrink-0"
          >
            {!isGuest && mentionQuery && (
              <div className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-lg border border-cyber-green/20 bg-cyber-black/95 shadow-2xl backdrop-blur">
                <div className="border-b border-cyber-green/10 px-3 py-2 text-[9px] uppercase tracking-[0.3em] text-gray-500">
                  {t('chat:onlinePlayers')}
                </div>
                {mentionSuggestions.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto py-1">
                    {mentionSuggestions.map((playerName, index) => (
                      <button
                        key={playerName}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => insertMention(playerName)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition ${
                          index === selectedMentionIndex
                            ? 'bg-cyber-green/10 text-cyber-green'
                            : 'text-gray-300 hover:bg-cyber-green/5 hover:text-white'
                        }`}
                      >
                        <span>@{playerName}</span>
                        <span className="text-[9px] uppercase tracking-widest text-gray-600">
                          {t('chat:online')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-[10px] uppercase tracking-widest text-gray-600">
                    {t('chat:noOnlinePlayerMatch')}
                  </div>
                )}
              </div>
            )}
            {isGuest ? (
              <div className="flex w-full items-center justify-between gap-3 rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cyber-yellow">
                    {t('chat:guestReadonly')}
                  </div>
                  <div className="text-[10px] text-gray-500">{t('chat:guestLocked')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => router.visit('/account/upgrade')}
                  className="shrink-0 rounded border border-cyber-yellow/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-yellow hover:bg-cyber-yellow/10"
                >
                  {t('chat:upgradeGuest')}
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onClick={handleInputSelect}
                  onKeyUp={handleInputSelect}
                  onSelect={handleInputSelect}
                  onKeyDown={handleInputKeyDown}
                  maxLength={500}
                  placeholder={
                    activeChannel === partyChannel
                      ? t('chat:messageInParty')
                      : t('chat:messageInChannel', { channel: `#${activeChannel}` })
                  }
                  className="flex-1 bg-cyber-dark border border-gray-800 rounded px-2 py-1.5 text-[11px] text-white font-mono focus:border-cyber-green/30 focus:outline-none placeholder-gray-800"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 transition-all shrink-0"
                >
                  ↵
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {userMenu && (
        <div
          ref={userMenuRef}
          className="fixed z-[60] w-52 rounded-lg border border-cyber-green/30 bg-cyber-black/95 p-1.5 shadow-2xl backdrop-blur"
          style={{ left: userMenu.x, top: userMenu.y }}
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
            {userMenu.characterName}
          </div>
          <button
            type="button"
            onClick={() => handleViewProfile(userMenu.characterName)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-blue/10 hover:text-cyber-blue"
          >
            <span>{t('chat:viewProfile')}</span>
          </button>
          {!isGuest && (
            <button
              type="button"
              onClick={() => handleAddFriend(userMenu.characterName)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-green/10 hover:text-white"
            >
              <span>{t('addFriend')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleUnavailableAction(t('chat:privateMessage'))}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-green/10 hover:text-white"
          >
            <span>{t('sendPrivateMsg')}</span>
            <span className="text-[9px] uppercase text-gray-600">{t('chat:soon')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleReportUser(userMenu.characterName)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-orange/10 hover:text-cyber-orange"
          >
            <span>{t('common:reportBug')}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleBlockedUser(userMenu.characterName)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-red/10 hover:text-cyber-red"
          >
            <span>{blockedUsers.includes(userMenu.characterName) ? t('unblock') : t('block')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleInviteToParty(userMenu.characterName)}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-gray-300 transition hover:bg-cyber-purple/10 hover:text-cyber-purple"
          >
            <span>{t('inviteToGroup')}</span>
          </button>
        </div>
      )}
    </>
  )
}
