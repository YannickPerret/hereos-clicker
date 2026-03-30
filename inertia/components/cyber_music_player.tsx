import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const STORAGE_KEY = 'hereos-cyber-music-player'

type LoopMode = 'playlist' | 'track'

const TRACKS = [
  {
    src: '/sounds/Chrome%20Horizons.wav',
    title: 'CHROME HORIZONS',
    mood: 'SKYLINE PULSE',
  },
  {
    src: '/sounds/Chromedrift%20Arcade.wav',
    title: 'CHROMEDRIFT ARCADE',
    mood: 'ARCADE RUSH',
  },
  {
    src: '/sounds/cyber_1.wav',
    title: 'CYBER_1.WAV',
    mood: 'NEON GRID',
  },
  {
    src: '/sounds/cyber_2.wav',
    title: 'CYBER_2.WAV',
    mood: 'NIGHT DRIVE',
  },
] as const

interface StoredPlayerState {
  currentTrackIndex: number
  isMinimized: boolean
  isMuted: boolean
  isPlaying: boolean
  volume: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readStoredPlayerState(): StoredPlayerState {
  if (typeof window === 'undefined') {
    return {
      currentTrackIndex: 0,
      isMinimized: false,
      isMuted: false,
      isPlaying: false,
      volume: 0.55,
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        currentTrackIndex: 0,
        isMinimized: false,
        isMuted: false,
        isPlaying: false,
        volume: 0.55,
      }
    }

    const parsed = JSON.parse(raw)
    const parsedTrackIndex = Number(parsed.currentTrackIndex)
    const parsedVolume = Number(parsed.volume)

    return {
      currentTrackIndex: clamp(
        Number.isFinite(parsedTrackIndex) ? parsedTrackIndex : 0,
        0,
        TRACKS.length - 1
      ),
      isMinimized: Boolean(parsed.isMinimized),
      isMuted: Boolean(parsed.isMuted),
      isPlaying: Boolean(parsed.isPlaying),
      volume: clamp(Number.isFinite(parsedVolume) ? parsedVolume : 0.55, 0, 1),
    }
  } catch {
    return {
      currentTrackIndex: 0,
      isMinimized: false,
      isMuted: false,
      isPlaying: false,
      volume: 0.55,
    }
  }
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function CyberMusicPlayer() {
  const { t } = useTranslation('common')
  const initialState = useRef(readStoredPlayerState())
  const audioRef = useRef<HTMLAudioElement>(null)
  const frameRef = useRef<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialState.current.currentTrackIndex)
  const [isMinimized, setIsMinimized] = useState(initialState.current.isMinimized)
  const [isMuted, setIsMuted] = useState(initialState.current.isMuted)
  const [isPlaying, setIsPlaying] = useState(initialState.current.isPlaying)
  const [loopMode, setLoopMode] = useState<LoopMode>('playlist')
  const [volume, setVolume] = useState(initialState.current.volume)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentTrack = TRACKS[currentTrackIndex]

  const syncProgress = () => {
    const audio = audioRef.current
    if (!audio) return

    setCurrentTime(audio.currentTime || 0)
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const syncDesktopState = () => setIsDesktop(mediaQuery.matches)

    syncDesktopState()
    mediaQuery.addEventListener('change', syncDesktopState)
    return () => mediaQuery.removeEventListener('change', syncDesktopState)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentTrackIndex,
        isMinimized,
        isMuted,
        isPlaying,
        volume,
      } satisfies StoredPlayerState)
    )
  }, [currentTrackIndex, isMinimized, isMuted, isPlaying, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const cancelFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    const tickProgress = () => {
      syncProgress()
      if (!audio.paused && !audio.ended) {
        frameRef.current = window.requestAnimationFrame(tickProgress)
      } else {
        frameRef.current = null
      }
    }

    const startProgressLoop = () => {
      cancelFrame()
      frameRef.current = window.requestAnimationFrame(tickProgress)
    }

    const handlePause = () => {
      cancelFrame()
      syncProgress()
      setIsPlaying(false)
    }

    const handlePlay = () => {
      syncProgress()
      setIsPlaying(true)
      startProgressLoop()
    }

    const handleEnded = () => {
      cancelFrame()
      syncProgress()
      setIsPlaying(false)
      if (audio.loop) return
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)
    }

    audio.addEventListener('loadedmetadata', syncProgress)
    audio.addEventListener('loadeddata', syncProgress)
    audio.addEventListener('durationchange', syncProgress)
    audio.addEventListener('canplay', syncProgress)
    audio.addEventListener('seeked', syncProgress)
    audio.addEventListener('timeupdate', syncProgress)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    syncProgress()

    return () => {
      cancelFrame()
      audio.removeEventListener('loadedmetadata', syncProgress)
      audio.removeEventListener('loadeddata', syncProgress)
      audio.removeEventListener('durationchange', syncProgress)
      audio.removeEventListener('canplay', syncProgress)
      audio.removeEventListener('seeked', syncProgress)
      audio.removeEventListener('timeupdate', syncProgress)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.muted = isMuted
    audio.loop = loopMode === 'track'
  }, [isMuted, loopMode, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setCurrentTime(0)
    setDuration(0)
    audio.load()
    syncProgress()
  }, [currentTrackIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!isDesktop) {
      audio.pause()
      return
    }

    if (!isPlaying) {
      audio.pause()
      return
    }

    void audio.play().catch(() => {
      setIsPlaying(false)
    })
  }, [currentTrackIndex, isDesktop, isPlaying])

  const goToTrack = (direction: -1 | 1) => {
    setCurrentTrackIndex((prev) => (prev + direction + TRACKS.length) % TRACKS.length)
  }

  const toggleLoopMode = () => {
    setLoopMode((prev) => (prev === 'playlist' ? 'track' : 'playlist'))
  }

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !isDesktop) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value
    setCurrentTime(value)
  }

  if (!isDesktop) return null

  return (
    <div className="fixed bottom-24 right-5 z-[45] hidden lg:block">
      <audio ref={audioRef} src={currentTrack.src} preload="metadata" />

      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          aria-label={t('musicPlayer.expand')}
          className="cyber-music-player scanlines relative flex h-15 w-15 items-center justify-center overflow-hidden rounded-2xl border border-cyber-blue/30 text-cyber-blue shadow-2xl transition-all hover:border-cyber-pink/40 hover:text-cyber-pink"
        >
          <div className="relative z-[1] flex flex-col items-center gap-1">
            <div className="text-lg leading-none">{isPlaying ? '◉' : '◎'}</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.28em]">
              {isPlaying ? 'LIVE' : 'AUX'}
            </div>
          </div>
        </button>
      ) : (
        <div className="cyber-music-player scanlines w-[22rem] overflow-hidden rounded-2xl border border-cyber-blue/30 text-white shadow-2xl">
          <div className="relative z-[1] border-b border-cyber-blue/20 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-cyber-blue">
                  {t('musicPlayer.title')}
                </div>
                <div className="mt-1 text-sm font-bold tracking-[0.24em] text-white">
                  {currentTrack.title}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="cyber-player-bars mt-1" aria-hidden="true">
                  <span className={isPlaying ? 'is-active' : ''} />
                  <span className={isPlaying ? 'is-active' : ''} />
                  <span className={isPlaying ? 'is-active' : ''} />
                  <span className={isPlaying ? 'is-active' : ''} />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  aria-label={t('musicPlayer.minimize')}
                  className="rounded-lg border border-cyber-blue/25 bg-cyber-blue/8 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyber-blue transition-all hover:bg-cyber-blue/18"
                >
                  _
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-gray-300">
              <span>{currentTrack.mood}</span>
              <span>
                {isPlaying ? t('musicPlayer.status.live') : t('musicPlayer.status.standby')} •{' '}
                {t(`musicPlayer.loop.${loopMode}`)}
              </span>
            </div>
          </div>

          <div className="relative z-[1] px-4 py-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => handleSeek(Number(event.target.value))}
              className="cyber-player-range w-full"
              aria-label={t('musicPlayer.seek')}
              style={{ accentColor: '#00f0ff' }}
            />

            <div className="mt-2 flex items-center justify-between text-xs font-medium tracking-[0.16em] text-cyber-blue/90">
              <span>
                {t('musicPlayer.elapsed')} {formatTime(currentTime)}
              </span>
              <span>
                {t('musicPlayer.duration')} {formatTime(duration)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToTrack(-1)}
                className="rounded-lg border border-cyber-pink/30 bg-cyber-pink/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-cyber-pink transition-all hover:bg-cyber-pink/20"
              >
                {t('musicPlayer.previous')}
              </button>
              <button
                type="button"
                onClick={() => void togglePlayback()}
                className="flex-1 rounded-lg border border-cyber-blue/40 bg-cyber-blue/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyber-blue transition-all hover:bg-cyber-blue/20"
              >
                {isPlaying ? t('musicPlayer.pause') : t('musicPlayer.play')}
              </button>
              <button
                type="button"
                onClick={() => goToTrack(1)}
                className="rounded-lg border border-cyber-pink/30 bg-cyber-pink/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-cyber-pink transition-all hover:bg-cyber-pink/20"
              >
                {t('musicPlayer.next')}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-all ${
                    isMuted
                      ? 'border-cyber-red/35 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                      : 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20'
                  }`}
                >
                  {isMuted ? t('musicPlayer.unmute') : t('musicPlayer.mute')}
                </button>

                <button
                  type="button"
                  onClick={toggleLoopMode}
                  className={`rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-all ${
                    loopMode === 'track'
                      ? 'border-cyber-yellow/35 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20'
                      : 'border-cyber-blue/35 bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20'
                  }`}
                >
                  {t(`musicPlayer.loop.${loopMode}`)}
                </button>
              </div>

              <div className="flex min-w-0 w-full items-center gap-3">
                <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-gray-300">
                  {t('musicPlayer.volume')}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="cyber-player-range min-w-0 w-full flex-1"
                  aria-label={t('musicPlayer.volume')}
                  style={{ accentColor: '#00ff41' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
