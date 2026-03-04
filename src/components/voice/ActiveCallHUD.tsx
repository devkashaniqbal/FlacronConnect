import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Mic, MicOff, Minimize2, ChevronDown } from 'lucide-react'
import { useVoiceStore } from '@/store/voiceStore'
import { cn } from '@/utils/cn'

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Animated waveform bars
const WAVEFORM_BARS = [3, 6, 10, 8, 12, 7, 9, 5, 11, 6, 4, 8]

function Waveform({ active }: { active: boolean }) {
  // Generate random values once — stable across re-renders
  const randoms = useRef(
    WAVEFORM_BARS.map(() => ({
      heightMult: 1 + Math.random() * 0.8,
      duration:   0.5 + Math.random() * 0.4,
    }))
  ).current

  return (
    <div className="flex items-center gap-0.5 h-8">
      {WAVEFORM_BARS.map((h, i) => (
        <motion.div
          key={i}
          className={cn('w-1 rounded-full', active ? 'bg-emerald-400' : 'bg-ink-500')}
          animate={active ? {
            height: [`${h}px`, `${h * randoms[i].heightMult}px`, `${h}px`],
          } : { height: `${Math.max(h * 0.3, 2)}px` }}
          transition={active ? {
            duration:   randoms[i].duration,
            repeat:     Infinity,
            repeatType: 'reverse',
            delay:      i * 0.06,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  )
}

export function ActiveCallHUD() {
  const { session, hudVisible, toggleMute, endCall, hideHud } = useVoiceStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { incrementDuration } = useVoiceStore()

  // Tick duration counter
  useEffect(() => {
    if (session.status === 'active') {
      intervalRef.current = setInterval(incrementDuration, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [session.status, incrementDuration])

  const isActive  = session.status === 'active'
  const isRinging = session.status === 'ringing' || session.status === 'connecting'

  return (
    <AnimatePresence>
      {hudVisible && session.status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[360px] glass rounded-2xl shadow-glass-dark overflow-hidden"
        >
          {/* Header bar */}
          <div className={cn(
            'px-4 py-3 flex items-center justify-between',
            isActive  ? 'bg-emerald-600/90' : 'bg-ink-700/90',
          )}>
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isActive ? 'bg-white animate-pulse' : 'bg-amber-400 animate-pulse',
              )} />
              <span className="text-white font-medium text-sm">
                {isActive ? 'Call in progress' : isRinging ? 'Connecting…' : 'Ending…'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-white/80 text-sm font-mono tabular-nums">
                  {formatDuration(session.duration)}
                </span>
              )}
              <button onClick={hideHud} className="text-white/70 hover:text-white transition-colors">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Agent + number */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink-900 dark:text-white text-sm truncate">
                  {session.agentName}
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-400 font-mono">{session.toNumber}</p>
              </div>
              <div className="ml-auto">
                <Waveform active={isActive && !session.isMuted} />
              </div>
            </div>

            {/* Live transcript */}
            {session.transcript.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1.5 rounded-xl bg-ink-50 dark:bg-ink-800/60 p-3">
                {session.transcript.slice(-4).map((entry, i) => (
                  <p key={i} className={cn(
                    'text-xs leading-relaxed',
                    entry.speaker === 'agent'
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-ink-700 dark:text-ink-300',
                  )}>
                    <span className="font-semibold capitalize mr-1">{entry.speaker}:</span>
                    {entry.text}
                  </p>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={toggleMute}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  session.isMuted
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                    : 'bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600',
                )}
                title={session.isMuted ? 'Unmute' : 'Mute'}
              >
                {session.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                title="End call"
              >
                <PhoneOff size={22} />
              </button>

              <button
                onClick={hideHud}
                className="w-12 h-12 rounded-full bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600 flex items-center justify-center transition-all"
                title="Minimize"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
