import { Bell, Image, Sparkle } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import type { AppId } from '../../data/software'

export interface OSNotification {
  id: string
  title: string
  body: string
  icon: Icon
}

const INITIAL_NOTIFICATIONS: OSNotification[] = [
  { id: 'intro', title: 'Aether Intelligence', body: 'Photo cleanup ready on-device.', icon: Sparkle },
  { id: 'cam', title: 'Camera roll', body: '3 new shots from last night.', icon: Image },
]

/** Owns the state of the simulated AetherOS home screen. */
export function usePhoneOS() {
  const [activeApp, setActiveApp] = useState<AppId | null>(null)
  const [notifications, setNotifications] = useState<OSNotification[]>(INITIAL_NOTIFICATIONS)
  const [quickOpen, setQuickOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotifications((list) => [
        ...list,
        {
          id: `charge-${Date.now()}`,
          title: 'Battery',
          body: 'Charging complete. Unplug to protect the cell.',
          icon: Bell,
        },
      ])
    }, 7000)
    return () => window.clearTimeout(timer)
  }, [])

  const openApp = (app: AppId) => {
    setQuickOpen(false)
    setActiveApp(app)
  }
  const closeApp = () => setActiveApp(null)
  const dismissNotification = (id: string) => setNotifications((list) => list.filter((n) => n.id !== id))

  return {
    activeApp,
    notifications,
    quickOpen,
    openApp,
    closeApp,
    dismissNotification,
    openQuickSettings: () => setQuickOpen(true),
    closeQuickSettings: () => setQuickOpen(false),
  }
}