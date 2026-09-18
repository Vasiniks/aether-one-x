import type { ReactNode } from 'react'
import { useState } from 'react'
import { DEFAULT_FINISH, type FinishId } from '../../data/product'
import { PhoneConfigContext, type FocusLensId } from './PhoneConfig'

/** Lifts finish + focus-lens selection so every 3D viewer shares it. */
export function PhoneConfigProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<FinishId>(DEFAULT_FINISH)
  const [focusLens, setFocusLens] = useState<FocusLensId>('main')
  return (
    <PhoneConfigContext.Provider value={{ finish, setFinish, focusLens, setFocusLens }}>
      {children}
    </PhoneConfigContext.Provider>
  )
}