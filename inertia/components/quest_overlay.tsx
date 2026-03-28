import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface FlowStep {
  id: number
  stepType: 'narration' | 'conversation' | 'objective' | 'wait' | 'choice'
  sortOrder: number
  content: any
  nextStepId: number | null
}

interface FlowState {
  characterQuestId: number
  status: 'active' | 'completed'
  currentStep: FlowStep | null
  stepState: any
  steps: FlowStep[]
}

interface Props {
  questId: number
  questTitle: string
  flowState: FlowState
  onClose: () => void
  onUpdate: (flowState: FlowState) => void
}

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
}

async function postJson(url: string, body: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() || ''),
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function getJson(url: string) {
  const res = await fetch(url)
  return res.json()
}

export default function QuestOverlay({
  questId,
  questTitle,
  flowState: initialFlowState,
  onClose,
  onUpdate,
}: Props) {
  const { t } = useTranslation('quests')
  const [flowState, setFlowState] = useState<FlowState>(initialFlowState)
  const [conversationLine, setConversationLine] = useState(0)

  const step = flowState.currentStep

  useEffect(() => {
    setFlowState(initialFlowState)
    setConversationLine(initialFlowState.stepState?.currentLine || 0)
  }, [initialFlowState])

  const updateState = useCallback(
    (newState: FlowState) => {
      setFlowState(newState)
      setConversationLine(newState.stepState?.currentLine || 0)
      onUpdate(newState)
    },
    [onUpdate]
  )

  const handleAdvance = useCallback(async () => {
    const result = await postJson(`/quests/${questId}/advance`)
    if (result.success && result.flowState) {
      updateState(result.flowState)
    }
    if (result.event || result.flowState?.status === 'completed') {
      onClose()
    }
  }, [questId, updateState, onClose])

  const handleChoice = useCallback(
    async (optionIndex: number) => {
      const result = await postJson(`/quests/${questId}/choose`, { optionIndex })
      if (result.success && result.flowState) {
        updateState(result.flowState)
      }
      if (result.event || result.flowState?.status === 'completed') {
        onClose()
      }
    },
    [questId, updateState, onClose]
  )

  // Poll for wait/objective steps
  useEffect(() => {
    if (!step) return
    if (step.stepType !== 'wait' && step.stepType !== 'objective') return

    const interval = setInterval(async () => {
      const result = await getJson(`/quests/${questId}/flow-state`)
      if (result.flowState) {
        if (result.flowState.currentStep?.id !== step.id) {
          updateState(result.flowState)
        } else {
          setFlowState(result.flowState)
        }
        if (result.flowState.status === 'completed') {
          onClose()
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [step?.id, step?.stepType, questId, updateState, onClose])

  if (!step) {
    return null
  }

  if (flowState.status === 'completed') {
    return null
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-cyber-blue/20">
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-blue">{questTitle}</div>
        {(step.stepType === 'objective' || step.stepType === 'wait') && (
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white border border-gray-700 rounded px-3 py-1.5 hover:border-gray-500 transition-all"
          >
            {t('overlay.minimize')}
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-end justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* ── NARRATION ── */}
          {step.stepType === 'narration' && (
            <div className="rounded-xl border border-cyber-blue/30 bg-cyber-dark/90 p-6">
              {step.content.speaker && (
                <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-purple mb-3">
                  {step.content.speaker}
                </div>
              )}
              <p className="text-base text-gray-200 leading-relaxed">{step.content.text}</p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAdvance}
                  className="px-6 py-2.5 border border-cyber-blue/40 text-cyber-blue rounded text-[11px] uppercase tracking-widest hover:bg-cyber-blue/10 transition-all"
                >
                  {t('overlay.next')}
                </button>
              </div>
            </div>
          )}

          {/* ── CONVERSATION ── */}
          {step.stepType === 'conversation' &&
            (() => {
              const lines = step.content.lines || []
              const currentLineIdx = flowState.stepState?.currentLine || conversationLine
              const line = lines[currentLineIdx]
              if (!line) return null

              return (
                <div className="rounded-xl border border-cyber-purple/30 bg-cyber-dark/90 p-6">
                  <div className="flex items-start gap-4">
                    {line.avatar && (
                      <div className="w-12 h-12 rounded-lg border border-cyber-purple/30 bg-cyber-purple/10 flex items-center justify-center text-lg shrink-0">
                        {line.avatar === 'player' ? '🧑' : '👤'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-purple mb-2">
                        {line.speaker}
                      </div>
                      <p className="text-base text-gray-200 leading-relaxed">{line.text}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-[10px] text-gray-600">
                      {currentLineIdx + 1} / {lines.length}
                    </div>
                    <button
                      onClick={handleAdvance}
                      className="px-6 py-2.5 border border-cyber-purple/40 text-cyber-purple rounded text-[11px] uppercase tracking-widest hover:bg-cyber-purple/10 transition-all"
                    >
                      {currentLineIdx < lines.length - 1
                        ? t('overlay.next')
                        : t('overlay.continue')}
                    </button>
                  </div>
                </div>
              )
            })()}

          {/* ── OBJECTIVE ── */}
          {step.stepType === 'objective' &&
            (() => {
              const content = step.content
              const stepState = flowState.stepState || {}
              const progress = stepState.progress || 0
              const target = content.targetValue || 1
              const percent = Math.min(100, (progress / target) * 100)

              return (
                <div className="rounded-xl border border-cyber-yellow/30 bg-cyber-dark/90 p-6">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-yellow mb-3">
                    {t('overlay.objectiveInProgress')}
                  </div>
                  <p className="text-base text-gray-200 mb-4">
                    {content.label || `${content.objectiveType}: ${target}`}
                  </p>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                    <span>{t('overlay.progress')}</span>
                    <span>
                      {progress}/{target}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden border border-gray-800 bg-cyber-black/60">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-yellow to-cyber-orange transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-4 text-[10px] text-gray-600 text-center">
                    {t('overlay.autoClose')}
                  </div>
                </div>
              )
            })()}

          {/* ── WAIT ── */}
          {step.stepType === 'wait' &&
            (() => {
              const content = step.content
              const stepState = flowState.stepState || {}
              const duration = content.duration || 1
              const unit = content.unit || 'minutes'

              let remainingLabel = t('overlay.calculating')
              if (stepState.waitStartedAt) {
                const start = new Date(stepState.waitStartedAt).getTime()
                const durationMs =
                  duration * (unit === 'hours' ? 3600000 : unit === 'seconds' ? 1000 : 60000)
                const endMs = start + durationMs
                const remainMs = Math.max(0, endMs - Date.now())
                if (remainMs <= 0) {
                  remainingLabel = t('overlay.complete')
                } else {
                  const mins = Math.ceil(remainMs / 60000)
                  remainingLabel =
                    mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`
                }
              }

              return (
                <div className="rounded-xl border border-gray-700 bg-cyber-dark/90 p-6 text-center">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">
                    {t('overlay.waitingInProgress')}
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{remainingLabel}</div>
                  <div className="text-xs text-gray-500">
                    {t('overlay.duration', { duration, unit })}
                  </div>
                </div>
              )
            })()}

          {/* ── CHOICE ── */}
          {step.stepType === 'choice' &&
            (() => {
              const content = step.content
              const options = content.options || []

              return (
                <div className="rounded-xl border border-cyber-green/30 bg-cyber-dark/90 p-6">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-green mb-3">
                    {t('overlay.choice')}
                  </div>
                  <p className="text-base text-gray-200 mb-6">{content.prompt}</p>
                  <div className="space-y-3">
                    {options.map((opt: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleChoice(idx)}
                        className="w-full text-left rounded-lg border border-cyber-green/30 bg-cyber-black/40 px-5 py-3.5 text-sm text-gray-200 hover:bg-cyber-green/10 hover:border-cyber-green/50 hover:text-white transition-all"
                      >
                        <span className="text-cyber-green mr-2">&gt;</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
        </div>
      </div>
    </div>
  )
}
