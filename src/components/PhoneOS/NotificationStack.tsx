import { AnimatePresence, motion } from 'motion/react'
import type { OSNotification } from './usePhoneOS'

export function NotificationStack({
  notifications,
  onDismiss,
}: {
  notifications: OSNotification[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="absolute inset-x-2.5 top-8 z-20 space-y-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.button
            key={n.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => onDismiss(n.id)}
            className="flex w-full items-start gap-2.5 rounded-2xl border border-white/12 bg-[#121722]/90 p-2.5 text-left backdrop-blur-md"
          >
            <span className="mt-0.5 shrink-0">
              <n.icon size={15} weight="duotone" className="text-aether" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium">{n.title}</span>
              <span className="block text-[9.5px] leading-snug text-white/55">{n.body}</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}