import { PhoneFrame } from '../Phone/PhoneFrame'
import { PhoneOSHome } from './PhoneOSHome'
import { cn } from '../../utils/cn'

/** The interactive AetherOS phone (a stylized CSS render, not a screenshot). */
export function AetherOSPhone({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <PhoneFrame variant="front">
        <PhoneOSHome />
      </PhoneFrame>
    </div>
  )
}