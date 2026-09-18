import { motion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useReducer } from 'react'
import { CONCEPT_NOTICE, DEFAULT_STORAGE_GB, FINISHES, STORAGE_OPTIONS } from '../../data/product'
import { usePhoneConfig } from '../../components/PhoneViewer/PhoneConfig'
import { Hairline, RevealWindow } from './primitives'
import { formatNumber } from '../../utils/format'

/**
 * In-film finale: the purchase moment. Chooses a finish (writes into the shared
 * phone config so the configurator below inherits the selection), a storage
 * tier, and reads the price before handing off to the product page. Editorial
 * arrangement: wordmark, hairline, then hairline-ruled selectors, then price
 * and purchase actions.
 */
export function Finale({ local }: { local: MotionValue<number> }) {
  const { finish, setFinish } = usePhoneConfig()
  const [storageGb, bumpStorage] = useReducer(
    (prev: number, next: number) => (STORAGE_OPTIONS.some((s) => s.gb === next) ? next : prev),
    DEFAULT_STORAGE_GB,
  )

  const price = STORAGE_OPTIONS.find((s) => s.gb === storageGb)?.price ?? 1199

  const scrollToBuy = () => {
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="absolute inset-x-0 bottom-[calc(3rem+env(safe-area-inset-bottom))] flex flex-col items-center px-4 text-center">
      <RevealWindow local={local} from={0.04} to={0.1}>
        <p className="font-mono text-[9px] tracking-[0.34em] text-aether">FINAL FRAME</p>
      </RevealWindow>

      <RevealWindow local={local} from={0.1} to={0.22}>
        <h2 className="spec-num text-[clamp(48px,7.5vw,104px)] leading-[0.9] tracking-[-0.02em] text-ink">
          Aether One X.
        </h2>
      </RevealWindow>

      <Hairline
        local={local}
        from={0.18}
        to={0.28}
        className="mt-5 h-px w-36 bg-gradient-to-r from-white/50 to-white/10"
      />

      {/* Interactive group stays clickable; the rest of the frame is inert. */}
      <div className="pointer-events-auto w-full max-w-xl">
        {/* Finish selection: hairline-ruled tabs */}
        <RevealWindow local={local} from={0.3} to={0.42}>
          <div className="mt-6 flex border-b border-white/10">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFinish(f.id)}
                aria-pressed={finish === f.id}
                aria-label={`Finish: ${f.name}`}
                className={`relative flex flex-1 items-center justify-center gap-2.5 px-3 py-3.5 transition-colors ${
                  finish === f.id ? 'text-ink' : 'text-dim hover:text-ink'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/25"
                  style={{ background: f.swatch }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[9.5px] tracking-[0.22em]">
                  {f.name.toUpperCase()}
                </span>
                {finish === f.id ? (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-aether" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </RevealWindow>

        {/* Storage selection with tier pricing */}
        <RevealWindow local={local} from={0.4} to={0.52}>
          <div className="mt-5 flex border-b border-white/10">
            {STORAGE_OPTIONS.map((s) => (
              <button
                key={s.gb}
                type="button"
                onClick={() => bumpStorage(s.gb)}
                aria-pressed={storageGb === s.gb}
                className={`relative flex flex-1 flex-col items-center gap-1 px-3 py-3.5 transition-colors ${
                  storageGb === s.gb ? 'text-ink' : 'text-dim hover:text-ink'
                }`}
              >
                <span className="font-mono text-[10px] tracking-[0.22em]">{s.label.toUpperCase()}</span>
                <span
                  className={`font-mono text-[9px] tabular-nums ${
                    storageGb === s.gb ? 'text-aether' : 'text-faint'
                  }`}
                >
                  ${formatNumber(s.price)}
                </span>
                {storageGb === s.gb ? (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-aether" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </RevealWindow>

        {/* Price + purchase actions */}
        <RevealWindow local={local} from={0.54} to={0.68}>
          <div className="mt-7 flex flex-col items-center gap-5">
            <motion.p
              layout
              className="bg-gradient-to-b from-white to-white/35 bg-clip-text text-4xl font-semibold tracking-tight text-transparent tabular-nums"
            >
              ${formatNumber(price)}
            </motion.p>
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={scrollToBuy}
                className="rounded-full bg-white px-6 py-3 font-mono text-[11px] tracking-[0.24em] text-black transition-colors hover:bg-sky-100"
              >
                RESERVE YOURS
              </motion.button>
              <a
                href="/specifications"
                className="rounded-full border border-white/15 px-6 py-3 font-mono text-[11px] tracking-[0.24em] text-dim transition-colors hover:border-white/35 hover:text-ink"
              >
                VIEW SPECS
              </a>
            </div>
          </div>
        </RevealWindow>
      </div>

      <RevealWindow local={local} from={0.72} to={0.84}>
        <p className="mt-4 max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.18em] text-white/30">
          {CONCEPT_NOTICE}
        </p>
      </RevealWindow>
    </div>
  )
}