import { AnimatePresence, motion, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Suspense, lazy } from 'react'
import { ACTS } from '../story'
import { useChapter } from './useChapter'
import { CHAPTERS } from './chapters'
import { Caption, XRayRead } from './primitives'
import { ChipAnnotations } from './ChipAnnotations'

const AetherOSPhone = lazy(() =>
  import('../../components/PhoneOS/AetherOSPhone').then((m) => ({ default: m.AetherOSPhone })),
)

/**
 * The editorial layer of the film: chapter captions, live rail, scroll cue,
 * and the interactive AetherOS moment. Everything is scroll-driven from the
 * master `progress` motion value and crossfades on act boundaries.
 */
export function FilmOverlay({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion()
  const { act } = useChapter(progress)
  const copy = CHAPTERS[act.id]
  const index = ACTS.findIndex((a) => a.id === act.id) + 1
  const align = act.align

  const scrollCueOpacity = useTransform(progress, [0, 0.035], [1, 0])
  const hairlineWidth = useTransform(progress, (v) => `${(v * 100).toFixed(1)}%`)

  const isSoftware = act.id === 'software'

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Legibility vignettes */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-36"
        style={{ background: 'linear-gradient(180deg, rgba(5,7,13,0.72), rgba(5,7,13,0))' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-44"
        style={{ background: 'linear-gradient(0deg, rgba(5,7,13,0.7), rgba(5,7,13,0))' }}
      />

      {/* Product chip, pinned just below the fixed nav. */}
      <div className="absolute inset-x-0 top-24 flex justify-center px-4 sm:top-24">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-[9px] tracking-[0.32em] text-ink">AETHER FILM</span>
          <span className="h-1 w-1 rounded-full bg-ink/40" />
          <span className="hidden font-mono text-[9px] tracking-[0.24em] text-dim sm:inline">
            A REAL PRODUCT, SHOT IN REAL TIME
          </span>
        </div>
      </div>

      {/* Chapter caption */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={act.id}
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={
              align === 'center'
                ? 'absolute inset-x-0 bottom-24 flex flex-col items-center text-center'
                : align === 'bottom'
                  ? 'absolute inset-x-0 bottom-24 flex flex-col items-center text-center'
                  : align === 'right'
                    ? 'absolute right-5 bottom-24 left-5 sm:right-8 lg:right-14 lg:left-[36vw]'
                    : 'absolute bottom-24 left-5 right-5 sm:left-8 lg:left-14 lg:right-[36vw]'
            }
          >
            {align === 'center' || align === 'bottom' ? (
              <div className="flex flex-col items-center">
                {copy.metric ? (
                  <div
                    aria-hidden="true"
                    className="bg-gradient-to-b from-white to-white/25 bg-clip-text text-[120px] leading-[0.85] font-semibold tracking-tight text-transparent sm:text-[180px] lg:text-[210px]"
                  >
                    {copy.metric}
                  </div>
                ) : null}
                {copy.metricSub ? (
                  <p className="mt-3 font-mono text-[9px] tracking-[0.32em] text-white/45">
                    {copy.metricSub}
                  </p>
                ) : null}
                <div className="mt-2">
                  <CaptionSmall index={index} label={copy.label} title={copy.title} note={copy.note} lines={copy.lines} />
                </div>
                {copy.extra === 'xray' ? (
                  <div className="mt-6">
                    <XRayRead x="0.076 m" y="0.159 m" z="7.8 mm" />
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Caption
                  index={index}
                  label={copy.label}
                  title={copy.title}
                  note={copy.note}
                  lines={copy.lines}
                  align={align === 'right' ? 'right' : 'left'}
                  metric={copy.metric ? (
                    <span className="flex flex-col">
                      <span className="bg-gradient-to-b from-white to-white/30 bg-clip-text text-[84px] font-semibold tracking-tight text-transparent sm:text-[110px]">
                        {copy.metric}
                      </span>
                      {copy.metricSub ? (
                        <span className="mt-2 font-mono text-[9px] tracking-[0.32em] text-white/45">
                          {copy.metricSub}
                        </span>
                      ) : null}
                    </span>
                  ) : undefined}
                />
                {copy.extra === 'xray' ? (
                  <div className="mt-6">
                    <XRayRead x="0.076 m" y="0.159 m" z="7.8 mm" />
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right-edge act rail (desktop) */}
      <div className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 lg:right-7 lg:flex">
        <div className="flex flex-col items-center gap-4">
          <span className="font-mono text-[9px] tracking-[0.3em] text-faint">FILM</span>
          <div className="relative h-52 w-px bg-white/10">
            {ACTS.map((a, i) => (
              <motion.span
                key={a.id}
                initial={false}
                animate={{ opacity: i + 1 <= index ? 1 : 0.22, backgroundColor: i + 1 === index ? '#7aa5ff' : '#ffffff' }}
                transition={{ duration: 0.3 }}
                className="absolute left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ top: `${(a.start + (a.end - a.start) * 0.5) * 100}%` }}
              />
            ))}
          </div>
          <span className="font-mono text-[9px] tracking-[0.3em] text-faint">/ 13</span>
        </div>
      </div>

      {/* Bottom hairline progress */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.28em] text-faint">
            {String(index).padStart(2, '0')}
          </span>
          <div className="relative h-px w-32 overflow-hidden bg-white/10 sm:w-48">
            <motion.div className="absolute inset-y-0 left-0 bg-aether/70" style={{ width: hairlineWidth }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.28em] text-faint">13</span>
        </div>
      </div>

      {/* Arrival scroll cue */}
      <motion.div className="absolute inset-x-0 bottom-16 flex justify-center" style={{ opacity: scrollCueOpacity }}>
        <div className="flex flex-col items-center gap-3 font-mono text-[9px] tracking-[0.34em] text-white/40">
          <span>AETHER FILM</span>
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="block h-8 w-px bg-gradient-to-b from-white/50 to-transparent"
          />
        </div>
      </motion.div>

      {/* A1 Ultra spec annotations (chip act, desktop) */}
      <AnimatePresence>{act.id === 'chip' ? <ChipAnnotations key="chip" /> : null}</AnimatePresence>

      {/* X-ray hover cue (xray act, desktop) */}
      <AnimatePresence>
        {act.id === 'xray' ? (
          <motion.div
            key="xray-cue"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-36 hidden justify-center lg:flex"
          >
            <div className="flex items-center gap-2.5 rounded-sm border border-white/10 bg-black/40 px-3 py-2 font-mono text-[9px] tracking-[0.3em] text-white/50 backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300/80" />
              <span>HOVER TO INSPECT</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Interactive AetherOS moment */}
      <AnimatePresence>
        {isSoftware ? (
          <motion.div
            key="os"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
          >
            <Suspense fallback={null}>
              <AetherOSPhone className="w-[30vh] sm:w-[28vh] lg:w-[33vh]" />
            </Suspense>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Compact centered caption used by the center/bottom acts. */
function CaptionSmall({
  index,
  label,
  title,
  note,
  lines,
}: {
  index: number
  label: string
  title: string
  note?: string
  lines?: { k: string; v: string }[]
}) {
  return (
    <div>
      <FilmKickerMini index={index} label={label} />
      <h3 className="mt-3 text-4xl leading-none font-semibold tracking-tight text-ink sm:text-5xl">
        {title}
      </h3>
      {note ? <p className="mt-3 text-[13px] leading-relaxed text-dim">{note}</p> : null}
      {lines?.length ? (
        <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-left">
          {lines.map((l) => (
            <div key={l.k} className="flex items-baseline gap-10 font-mono text-[11px] tracking-[0.18em]">
              <span className="w-24 text-white/40">{l.k}</span>
              <span className="text-ink">{l.v}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FilmKickerMini({ index, label }: { index: number; label: string }) {
  return (
    <p className="flex items-center justify-center gap-2.5 font-mono text-[10px] tracking-[0.3em] text-aether">
      <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-aether" />
      <span>CHAPTER {String(index).padStart(2, '0')} / 13</span>
      <span className="text-white/15">/</span>
      <span className="text-white/45">{label}</span>
    </p>
  )
}