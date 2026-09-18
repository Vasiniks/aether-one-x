import { createContext, useContext } from 'react'
import type { FinishId } from '../../data/product'

/** The optic that the camera section is currently "focusing". */
export type FocusLensId = 'main' | 'ultra' | 'tele'

export interface PhoneConfigValue {
  finish: FinishId
  setFinish: (finish: FinishId) => void
  focusLens: FocusLensId
  setFocusLens: (lens: FocusLensId) => void
}

export const PhoneConfigContext = createContext<PhoneConfigValue | null>(null)

export function usePhoneConfig(): PhoneConfigValue {
  const ctx = useContext(PhoneConfigContext)
  if (!ctx) throw new Error('usePhoneConfig must be used within PhoneConfigProvider')
  return ctx
}