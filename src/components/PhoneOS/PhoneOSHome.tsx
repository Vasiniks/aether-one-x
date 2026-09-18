import { AnimatePresence, motion } from 'motion/react'
import { AppGrid } from './AppGrid'
import { AppScreen } from './AppScreens'
import { NotificationStack } from './NotificationStack'
import { QuickSettings } from './QuickSettings'
import { StatusBar } from './StatusBar'
import { usePhoneOS } from './usePhoneOS'

/** The interactive AetherOS home screen rendered inside a PhoneFrame. */
export function PhoneOSHome() {
  const os = usePhoneOS()

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0a0d14] text-white">
      {/* Wallpaper */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "url('/images/camera/scene-main.svg') center / cover no-repeat" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#070a10]/35" />

      <StatusBar onPull={os.openQuickSettings} />

      <div className="relative flex-1 px-3.5 pt-1.5 pb-2">
        {/* Foreground app */}
        <AnimatePresence mode="wait">
          {os.activeApp ? (
            <motion.div
              key={os.activeApp}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 z-30 overflow-hidden rounded-[2.2rem] bg-[#0b1018]"
            >
              <AppScreen app={os.activeApp} onClose={os.closeApp} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Quick settings */}
        <AnimatePresence>
          {os.quickOpen ? <QuickSettings onClose={os.closeQuickSettings} /> : null}
        </AnimatePresence>

        {/* Notifications */}
        <NotificationStack notifications={os.notifications} onDismiss={os.dismissNotification} />

        {/* App grid */}
        <div className="absolute inset-x-3 bottom-3 top-[13%] z-10">
          <AnimatePresence mode="popLayout" initial={false}>
            {!os.quickOpen && !os.activeApp ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                <AppGrid onOpen={os.openApp} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}