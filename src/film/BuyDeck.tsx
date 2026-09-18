import { ArrowRight, Check } from '@phosphor-icons/react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DEFAULT_STORAGE_GB, FINISHES, STORAGE_OPTIONS } from '../data/product'
import { usePhoneConfig } from '../components/PhoneViewer/PhoneConfig'
import { Reveal } from '../components/ui/Reveal'
import { cn } from '../utils/cn'
import { formatNumber } from '../utils/format'

const PhoneViewer = lazy(() =>
  import('../components/PhoneViewer/PhoneViewer').then((m) => ({ default: m.PhoneViewer })),
)

/**
 * Post-credits configure block. The finale beat already happened in the film;
 * this section is the sober counterpart where the viewer finalizes selection
 * on the live configurator. Finish choices carry over from the film's final
 * frame via the shared phone config.
 */
export function BuyDeck() {
  const { finish, setFinish } = usePhoneConfig()
  const [storageGb, setStorageGb] = useState(DEFAULT_STORAGE_GB)
  const [claimed, setClaimed] = useState(false)

  const finishDef = useMemo(() => FINISHES.find((f) => f.id === finish) ?? FINISHES[0], [finish])
  const storage = useMemo(
    () => STORAGE_OPTIONS.find((s) => s.gb === storageGb) ?? STORAGE_OPTIONS[1],
    [storageGb],
  )

  return (
    <section id="buy" className="relative border-t border-white/8 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[10px] tracking-[0.3em] text-aether">POST-CREDITS / CONFIGURE</p>
          <h2 className="mt-3 max-w-2xl text-3xl leading-[0.98] font-semibold tracking-tight text-ink sm:text-4xl">
            Pick up where the film left off.
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-dim">
            Finish selections carry over from the final frame. Capacity is still yours to choose.
          </p>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Live hero preview */}
          <Reveal>
            <div className="relative flex justify-center">
              <div
                aria-hidden="true"
                className="absolute -inset-16 rounded-full blur-3xl"
                style={{ background: 'rgba(127,180,255,0.06)' }}
              />
              <div className="relative w-full max-w-[17rem]">
                <div className="flex h-[32rem] items-center justify-center sm:h-[36rem]">
                  <Suspense fallback={null}>
                    <PhoneViewer scene="config" className="h-full w-full" />
                  </Suspense>
                </div>
                <p className="mt-4 text-center font-mono text-[11px] tracking-[0.2em] text-dim">
                  {finishDef.name.toUpperCase()} · {storage.label.toUpperCase()}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Configuration */}
          <div>
            <Reveal>
              <h3 className="text-[15px] font-medium text-ink">Finish</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {FINISHES.map((f) => {
                  const selected = f.id === finish
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFinish(f.id)}
                      className={cn(
                        'group rounded-2xl border p-4 text-left transition-all duration-200',
                        selected
                          ? 'border-aether/60 bg-aether/10'
                          : 'border-white/10 bg-[#0c0e16] hover:border-white/25',
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span
                          className="h-9 w-9 rounded-full border border-white/15 shadow-[inset_0_1px_3px_rgba(255,255,255,0.25)]"
                          style={{ background: f.swatch }}
                        />
                        {selected ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aether text-night">
                            <Check size={12} weight="bold" />
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-3 block text-[14px] font-medium text-ink">{f.name}</span>
                      <span className="mt-1 block text-[11.5px] leading-snug text-faint">{f.tagline}</span>
                    </button>
                  )
                })}
              </div>
            </Reveal>

            <Reveal delay={90}>
              <h3 className="mt-9 text-[15px] font-medium text-ink">Capacity</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {STORAGE_OPTIONS.map((s) => {
                  const selected = s.gb === storageGb
                  return (
                    <button
                      key={s.gb}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setStorageGb(s.gb)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all duration-200',
                        selected
                          ? 'border-aether/60 bg-aether/10'
                          : 'border-white/10 bg-[#0c0e16] hover:border-white/25',
                      )}
                    >
                      <span className="block text-[15px] font-medium text-ink">
                        {s.gb >= 1024 ? '1 TB' : s.label}
                      </span>
                      <span className="mt-1.5 block font-mono text-[13px] text-aether tabular-nums">
                        ${formatNumber(s.price)}
                      </span>
                      {s.gb === 512 ? (
                        <span className="mt-2 inline-block rounded-full bg-white/8 px-2 py-0.5 font-mono text-[9.5px] text-faint">
                          MOST POPULAR
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-faint">
                    {finishDef.name.toUpperCase()} / {storage.label.toUpperCase()}
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-ink tabular-nums">
                    ${formatNumber(storage.price)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setClaimed(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[14px] font-semibold text-night transition-all duration-200 hover:bg-white"
                >
                  {claimed ? 'Reserved' : 'Buy Aether One X'}
                  <ArrowRight size={16} />
                </button>
                <Link
                  to="/specifications"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[14px] font-medium text-ink transition-all duration-200 hover:border-white/35"
                >
                  Explore configuration
                </Link>
              </div>

              <p className="mt-6 font-mono text-[11px] leading-relaxed text-faint">
                {claimed
                  ? 'Reserved. This is a fictional concept, so there is no bag and no charge.'
                  : 'Fictional concept pricing. There is no bag, and no charge.'}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}