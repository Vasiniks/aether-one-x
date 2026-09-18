import { Sparkle } from '@phosphor-icons/react'

export function StatusBar({ onPull }: { onPull: () => void }) {
  return (
    <button
      type="button"
      onClick={onPull}
      aria-label="Open quick settings"
      className="relative z-40 flex items-center justify-between px-5 pt-[4.5%] pb-1 font-mono text-[9.5px] text-white/85"
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Sparkle size={9} className="text-aether" />
        <span className="h-2 w-3.5 rounded-[2.5px] bg-white/90" />
      </span>
    </button>
  )
}