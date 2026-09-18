import { motion } from 'motion/react'
import { APPS } from './config'

export function AppGrid({ onOpen }: { onOpen: (id: (typeof APPS)[number]['id']) => void }) {
  return (
    <div className="flex h-full flex-col justify-between pb-1">
      <div className="grid grid-cols-4 gap-x-3 gap-y-4">
        {APPS.map((app, index) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.035 }}
            onClick={() => onOpen(app.id)}
            aria-label={`Open ${app.label}`}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-[0.95rem] bg-gradient-to-br shadow-[0_6px_16px_rgba(0,0,0,0.35)] ${app.tint}`}
            >
              <app.icon size={21} weight="fill" className="text-white/90" />
            </span>
            <span className="max-w-full truncate text-[8.5px] text-white/70">{app.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="mx-auto h-1 rounded-full bg-white/80" />
    </div>
  )
}