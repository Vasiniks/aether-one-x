import {
  Flashlight,
  Minus,
  Pause,
  Play,
  Plus,
  CaretLeft,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import type { AppId } from '../../data/software'
import { cn } from '../../utils/cn'
import { APP_TITLES } from './config'

export function AppScreen({ app, onClose }: { app: AppId; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title={APP_TITLES[app]} onClose={onClose} />
      <div className="relative flex-1 overflow-hidden">
        {app === 'camera' ? <CameraApp /> : null}
        {app === 'photos' ? <PhotosApp /> : null}
        {app === 'messages' ? <MessagesApp /> : null}
        {app === 'weather' ? <WeatherApp /> : null}
        {app === 'music' ? <MusicApp /> : null}
        {app === 'maps' ? <MapsApp /> : null}
        {app === 'timer' ? <TimerApp /> : null}
        {app === 'settings' ? <SettingsApp /> : null}
      </div>
    </div>
  )
}

function AppHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="relative z-10 flex items-center justify-between border-b border-white/8 px-3 py-2.5">
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to home"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-white/80"
      >
        <CaretLeft size={14} />
      </button>
      <span className="text-[12px] font-medium text-white/90">{title}</span>
      <span className="w-7" />
    </div>
  )
}

function CameraApp() {
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState(0)
  return (
    <>
      <img src="/images/camera/scene-main.svg" alt="" className="h-full w-full object-cover" />
      {flash ? <div aria-hidden="true" className="absolute inset-0 bg-[#ffe9b8]/60" /> : null}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono text-[9px] text-white/85">
        <span className="animate-[pulse-dot_2.6s_ease-in-out_infinite] text-aether">●</span> 1× AUTO
      </div>
      <div className="absolute right-3 bottom-8 left-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFlash((f) => !f)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white/85"
        >
          <Flashlight size={14} />
        </button>
        <button
          type="button"
          onClick={() => setShots((s) => s + 1)}
          aria-label="Take a photo"
          className="h-14 w-14 rounded-full border-[3px] border-white/90 bg-white/10 transition-transform active:scale-90"
        />
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 font-mono text-[9px] text-white/85">
          {shots}
        </span>
      </div>
    </>
  )
}

const PHOTO_SCENES = [
  '/images/camera/scene-ultra.svg',
  '/images/camera/scene-main.svg',
  '/images/camera/scene-zoom2.svg',
  '/images/camera/scene-tele5.svg',
  '/images/camera/scene-tele10.svg',
]

function PhotosApp() {
  return (
    <div className="h-full overflow-y-auto bg-[#0b1018] p-2.5">
      <div className="mb-3 px-1 font-mono text-[9px] text-white/50">
        RECENT · {PHOTO_SCENES.length} CAPTURES
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PHOTO_SCENES.map((src) => (
          <div key={src} className="aspect-square overflow-hidden rounded-lg">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesApp() {
  const [thread, setThread] = useState([
    { from: 'aether', text: 'Welcome to AetherOS. Ask me anything.' },
    { from: 'you', text: 'Summarize my notes offline?' },
    { from: 'aether', text: 'Done - 14 notes condensed locally, nothing left the device.' },
  ])
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    setThread((t) => [...t, { from: 'you', text: draft.trim() }])
    setDraft('')
    window.setTimeout(() => {
      setThread((t) => [...t, { from: 'aether', text: 'Noted. Keeping it offline until you say otherwise.' }])
    }, 900)
  }
  return (
    <div className="flex h-full flex-col bg-[#0b1018]">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {thread.map((m, i) => (
          <div key={i} className={cn('flex', m.from === 'you' ? 'justify-end' : 'justify-start')}>
            <span
              className={cn(
                'max-w-[78%] rounded-2xl px-3 py-1.5 text-[10px] leading-snug',
                m.from === 'you'
                  ? 'rounded-br-md bg-aether/30 text-white'
                  : 'rounded-bl-md bg-white/8 text-white/85',
              )}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/8 p-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message"
          className="flex-1 rounded-full bg-white/8 px-3 py-1.5 text-[10px] text-white placeholder:text-white/40 focus:outline-none"
        />
        <button type="button" onClick={send} className="rounded-full bg-aether/30 px-3 py-1.5 text-[10px] text-white">
          Send
        </button>
      </div>
    </div>
  )
}

function WeatherApp() {
  return (
    <div className="flex h-full flex-col justify-between bg-[#1a2b46] p-3">
      <div>
        <p className="font-mono text-[9px] text-white/55">AETHER WEATHER · LOCAL</p>
        <p className="mt-1 text-[26px] font-medium text-white">18°</p>
        <p className="text-[10px] text-white/70">Clear tonight · Low 11°</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[21, 20, 18, 16].map((t, i) => (
          <div key={i} className="rounded-xl bg-white/8 p-1.5 text-center">
            <p className="text-[8px] text-white/55">{['Now', '22:00', '00:00', '02:00'][i]}</p>
            <p className="mt-0.5 text-[11px] text-white">{t}°</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MusicApp() {
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(38)
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setProgress((p) => (p + 0.5 >= 100 ? 0 : p + 0.5)), 240)
    return () => window.clearInterval(id)
  }, [playing])
  return (
    <div className="flex h-full flex-col justify-end bg-[#0e1a29] p-3">
      <div className="flex-1" />
      <div
        className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl"
        style={{ background: 'linear-gradient(160deg,#2e4a66,#122238)' }}
      >
        <div className="h-20 w-20 rounded-full bg-[#1b3350] shadow-[0_0_40px_rgba(127,180,255,0.35)]" />
      </div>
      <p className="mt-3 text-[12px] font-medium text-white">Night Drive</p>
      <p className="text-[9px] text-white/55">Aether Ambient · Vol. 1</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-aether" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[8px] text-white/50">
        <span>0:{String(Math.floor(progress * 0.26)).padStart(2, '0')}</span>
        <span>3:12</span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0f18]"
        >
          {playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
        </button>
      </div>
    </div>
  )
}

function MapsApp() {
  return (
    <div className="relative h-full overflow-hidden bg-[#0e1a2b]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(127,180,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(127,180,255,0.12) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M 20 260 C 70 240, 60 160, 110 150 S 160 80, 190 60"
          fill="none"
          stroke="#7fb4ff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="1 9"
          opacity="0.85"
        />
        <circle cx="20" cy="260" r="7" fill="#7fb4ff" />
        <circle cx="190" cy="60" r="7" fill="#ff6b6b" />
        <circle cx="110" cy="150" r="4" fill="#ffffff" opacity="0.8" />
      </svg>
      <div className="absolute right-2 bottom-2 rounded-lg bg-white/10 p-1.5 font-mono text-[8px] text-white/80">
        AETHER MAPS · OFFLINE
      </div>
    </div>
  )
}

function TimerApp() {
  const [minutesSet, setMinutesSet] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  useEffect(() => {
    if (secondsLeft === null || secondsLeft === 0) return
    const id = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])
  const total = minutesSet * 60
  const left = secondsLeft ?? total
  const pct = (left / total) * 100
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#0b1018] p-4">
      <div className="relative">
        <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#7fb4ff"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={327}
            strokeDashoffset={327 * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-1000 linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[16px] text-white tabular-nums">
          {secondsLeft === null ? `${minutesSet}:00` : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
        </div>
      </div>
      {secondsLeft === null ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMinutesSet((m) => Math.min(60, m + 1))}
            aria-label="Add minute"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white"
          >
            <Plus size={14} />
          </button>
          <span className="font-mono text-[12px] text-white/80">{minutesSet} min</span>
          <button
            type="button"
            onClick={() => setMinutesSet((m) => Math.max(1, m - 1))}
            aria-label="Remove minute"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white"
          >
            <Minus size={14} />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => (secondsLeft === null ? setSecondsLeft(total) : setSecondsLeft(null))}
        className="rounded-full bg-aether px-5 py-2 text-[11px] font-medium text-[#0a0f18]"
      >
        {secondsLeft === null ? 'Start' : 'Reset'}
      </button>
      {secondsLeft === 0 ? <p className="font-mono text-[10px] text-aether">TIME&apos;S UP</p> : null}
    </div>
  )
}

function SettingsApp() {
  const [rows, setRows] = useState({
    wifi: true,
    bluetooth: true,
    dark: true,
    alwaysOn: false,
  })
  const toggle = (key: keyof typeof rows) => setRows((r) => ({ ...r, [key]: !r[key] }))
  return (
    <div className="h-full space-y-2 overflow-y-auto bg-[#0b1018] p-3">
      {(
        [
          { key: 'wifi', label: 'Wi-Fi', sub: 'AetherNet 5G' },
          { key: 'bluetooth', label: 'Bluetooth', sub: 'Aether Pods Pro' },
          { key: 'dark', label: 'Dark mode', sub: 'Always on' },
          { key: 'alwaysOn', label: 'Always-on display', sub: '1 Hz idle' },
        ] as const
      ).map(({ key, label, sub }) => (
        <button
          type="button"
          key={key}
          onClick={() => toggle(key)}
          className="flex w-full items-center justify-between rounded-xl bg-white/6 px-3 py-2.5"
        >
          <span>
            <span className="block text-[10.5px] text-white/90">{label}</span>
            <span className="block text-[8.5px] text-white/45">{sub}</span>
          </span>
          <span className={cn('relative h-4 w-8 rounded-full transition-colors', rows[key] ? 'bg-aether' : 'bg-white/12')}>
            <span
              className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', rows[key] ? 'left-[18px]' : 'left-0.5')}
            />
          </span>
        </button>
      ))}
      <p className="px-1 pt-1 font-mono text-[8px] leading-relaxed text-white/35">
        AETHEROS 2.0 · DEMONSTRATION BUILD
      </p>
    </div>
  )
}