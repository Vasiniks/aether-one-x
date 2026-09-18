import { Airplane, Bluetooth, Flashlight, Target, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

type ToggleKey = 'wifi' | 'bluetooth' | 'airplane' | 'focus' | 'flashlight'

const TILES: { key: ToggleKey; label: string; icon: typeof WifiHigh }[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: WifiHigh },
  { key: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
  { key: 'airplane', label: 'Airplane', icon: Airplane },
  { key: 'focus', label: 'Focus', icon: Target },
]

export function QuickSettings({ onClose }: { onClose: () => void }) {
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    wifi: true,
    bluetooth: true,
    airplane: false,
    focus: false,
    flashlight: false,
  })
  const toggle = (key: ToggleKey) => setToggles((t) => ({ ...t, [key]: !t[key] }))

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute inset-x-0 top-0 z-30 rounded-b-[2.2rem] border-b border-white/10 bg-[#10151f]/95 p-3.5 pt-1.5 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss quick settings"
        className="mx-auto block h-1 w-10 rounded-full bg-white/30"
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {TILES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={toggles[key]}
            onClick={() => toggle(key)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2.5 transition-colors',
              toggles[key] ? 'bg-aether/25' : 'bg-white/8',
            )}
          >
            <Icon size={15} className={toggles[key] ? 'text-aether' : 'text-white/60'} />
            <span className="text-[8.5px] text-white/75">{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => toggle('flashlight')}
        className={cn(
          'mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[10.5px] transition-colors',
          toggles.flashlight ? 'bg-[#ffe9b8]/20 text-[#ffd98f]' : 'bg-white/8 text-white/70',
        )}
      >
        <Flashlight size={13} />
        Flashlight {toggles.flashlight ? 'on' : 'off'}
      </button>
    </motion.div>
  )
}