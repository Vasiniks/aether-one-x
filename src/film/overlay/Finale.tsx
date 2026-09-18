import { motion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useReducer } from 'react'
import { CONCEPT_NOTICE, DEFAULT_STORAGE_GB, FINISHES, STORAGE_OPTIONS } from '../../data/product'
import { usePhoneConfig } from '../../components/PhoneViewer/PhoneConfig'
import { RevealWindow, TitleLine } from './primitives'

/**
 * In-film finale: the purchase moment. Chooses a finish (writes into the shared
 * phone config so the configurator below inherits the selection), a storage
 * tier, and reads the price before handing off to the product page. Revealed
 * incrementally against the act-local `local` value.
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
    <div className="absolute inset-x-0 bottom-16 flex flex-col items-center px-4 text-center">
      <RevealWindow local={local} from={0.05} to={0.16}>
        <p className="font-mono text-[9px] tracking-[0.34em] text-aether">FINAL FRAME</p>
      </RevealWindow>

      <TitleLine local={local} from={0.1} title="Aether One X." />

      <RevealWindow local={local} from={0.18} to={0.28}>
        <p className="mt-3 font-mono text-[9px] tracking-[0.3em] text-white/45">
          OBSIDIAN / TITANIUM / GLACIER
        </p>
      </RevealWindow>

      {/* Interactive group stays clickable; the rest of the frame is inert. */}
      <div className="pointer-events-auto">
        <RevealWindow local={local} from={0.34} to={0.46}>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFinish(f.id)}
                aria-pressed={finish === f.id}
                aria-label={`Finish: ${f.name}`}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.18em] transition-colors ${
                  finish === f.id
                    ? 'border-white/35 bg-white/10 text-ink'
                    : 'border-white/12 bg-transparent text-dim hover:border-white/25'
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-white/25"
                  style={{ background: f.swatch }}
                  aria-hidden="true"
                />
                <span className="font-mono">{f.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </RevealWindow>

        <RevealWindow local={local} from={0.46} to={0.58}>
          <div className="mt-3 flex items-center justify-center gap-2.5">
            {STORAGE_OPTIONS.map((s) => (
              <button
                key={s.gb}
                type="button"
                onClick={() => bumpStorage(s.gb)}
                aria-pressed={storageGb === s.gb}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[10px] tracking-[0.18em] transition-colors ${
                  storageGb === s.gb
                    ? 'border-aether/60 bg-aether/15 text-sky-100'
                    : 'border-white/12 text-dim hover:border-white/25'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </RevealWindow>

        <RevealWindow local={local} from={0.56} to={0.7}>
          <div className="mt-5 flex flex-col items-center gap-4">
            <motion.p
              layout
              className="bg-gradient-to-b from-white to-white/35 bg-clip-text text-4xl font-semibold tracking-tight text-transparent"
            >
              ${price.toLocaleString()}
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
        <p className="mt-3 max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.18em] text-white/30">
          {CONCEPT_NOTICE}
        </p>
      </RevealWindow>
    </div>
  )
}