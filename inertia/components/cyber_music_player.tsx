import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const STORAGE_KEY = 'hereos-cyber-music-player'

const TRACKS = [
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
      isMuted: Boolean(parsed.isMuted),
      isPlaying: Boolean(parsed.isPlaying),
      volume: clamp(Number.isFinite(parsedVolume) ? parsedVolume : 0.55, 0, 1),
    }
  } catch {
    return {
      currentTrackIndex: 0,
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
  const [isDesktop, setIsDesktop] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialState.current.currentTrackIndex)
  const [isMuted, setIsMuted] = useState(initialState.current.isMuted)
  const [isPlaying, setIsPlaying] = useState(initialState.current.isPlaying)
  const [volume, setVolume] = useState(initialState.current.volume)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentTrack = TRACKS[currentTrackIndex]

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
        isMuted,
        isPlaying,
        volume,
      } satisfies StoredPlayerState)
    )
  }, [currentTrackIndex, isMuted, isPlaying, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncMetadata = () => {
      setCurrentTime(audio.currentTime || 0)
      setDuration(audio.duration || 0)
    }

    const syncTime = () => setCurrentTime(audio.currentTime || 0)
    const handleEnded = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)
    }

    audio.addEventListener('loadedmetadata', syncMetadata)
    audio.addEventListener('durationchange', syncMetadata)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('ended', handleEnded)

    syncMetadata()

    return () => {
      audio.removeEventListener('loadedmetadata', syncMetadata)
      audio.removeEventListener('durationchange', syncMetadata)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.muted = isMuted
  }, [isMuted, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setCurrentTime(0)
    setDuration(audio.duration || 0)
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

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      if (!isDesktop) return
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
    <div className="fixed bottom-24 right-5 z-[45] hidden w-[22rem] lg:block">
      <div className="cyber-music-player scanlines overflow-hidden rounded-2xl border border-cyber-blue/30 text-white shadow-2xl">
        <audio ref={audioRef} src={currentTrack.src} preload="metadata" />

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
            <div className="cyber-player-bars mt-1" aria-hidden="true">
              <span className={isPlaying ? 'is-active' : ''} />
              <span className={isPlaying ? 'is-active' : ''} />
              <span className={isPlaying ? 'is-active' : ''} />
              <span className={isPlaying ? 'is-active' : ''} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-gray-400">
            <span>{currentTrack.mood}</span>
            <span>{isPlaying ? t('musicPlayer.status.live') : t('musicPlayer.status.standby')}</span>
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

          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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

          <div className="mt-4 flex items-center gap-3">
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

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                {t('musicPlayer.volume')}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="cyber-player-range flex-1"
                aria-label={t('musicPlayer.volume')}
                style={{ accentColor: '#00ff41' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
