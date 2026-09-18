import { AnimatePresence, motion, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { Suspense, lazy } from 'react'
import { ACTS, type ActId } from '../story'
import { useChapter } from './useChapter'
import { CHAPTERS, type ChapterCopy } from './chapters'
import {
  DisplayBar,
  EditorialStat,
  NoteLine,
  RevealWindow,
  TierSeries,
  TitleLine,
  Wordmark,
  XRayRead,
} from './primitives'
import { ChipAnnotations } from './ChipAnnotations'
import { Finale } from './Finale'
import { DIMENSIONS } from '../../data/product'

const AetherOSPhone = lazy(() =>
  import('../../components/PhoneOS/AetherOSPhone').then((m) => ({ default: m.AetherOSPhone })),
)

/**
 * The editorial layer of the film: per-act spec compositions driven by the
 * act-local `local` value, live act rail, hairline progress, scroll cue, the
 * AetherOS moment and the finale purchase beat. React only re-renders at act
 * boundaries; every stagger inside an act is a motion value.
 */

/** Where each act's caption sits, anchored into the open half of the frame. */
const WRAP: Record<ActId, string> = {
  arrival: 'absolute top-[calc(5rem+env(safe-area-inset-top))] right-5 left-5 flex flex-col items-start px-1 sm:left-8 lg:left-14',
  settle: 'absolute bottom-[calc(7rem+env(safe-area-inset-bottom))] right-5 left-5 flex flex-col items-start px-1 sm:left-8 lg:left-14',
  approach:
    'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:left-8 lg:left-[44vw] lg:right-16',
  xray: 'absolute inset-x-0 bottom-[calc(8rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:right-8 lg:left-16 lg:right-[44vw]',
  chip: 'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:left-8 lg:left-16',
  rebuild:
    'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-center px-5 text-center',
  camera:
    'absolute top-[15%] right-5 left-5 flex flex-col items-start px-1 sm:left-8 lg:left-[44vw] lg:right-16',
  display:
    'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-center px-4 text-center',
  storage:
    'absolute inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:left-8 lg:left-[42vw] lg:right-20',
  battery:
    'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:right-8 lg:left-20 lg:right-[43vw]',
  software:
    'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:left-8 lg:left-16',
  ai: 'absolute inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col items-start px-5 sm:left-8 lg:left-[44vw] lg:right-16',
  final: 'absolute inset-0',
}

export function FilmOverlay({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion()
  const { act, local } = useChapter(progress)
  const copy = CHAPTERS[act.id]
  const index = ACTS.findIndex((a) => a.id === act.id) + 1
  const align = act.align

  const scrollCueOpacity = useTransform(progress, [0, 0.035], [1, 0])
  const hairlineWidth = useTransform(progress, (v) => `${(v * 100).toFixed(1)}%`)

  const isSoftware = act.id === 'software'
  const isFinale = act.id === 'final'

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

      {/* Chapter caption */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={act.id}
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -14, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={isFinale ? WRAP.final : WRAP[act.id]}
          >
            {isFinale ? <Finale local={local} /> : <CoreCaption local={local} copy={copy} align={align} />}
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
                animate={{
                  opacity: i + 1 <= index ? 1 : 0.22,
                  backgroundColor: i + 1 === index ? '#7aa5ff' : '#ffffff',
                }}
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
      <div className="absolute inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-center px-4">
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
      <motion.div className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] flex justify-center" style={{ opacity: scrollCueOpacity }}>
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="block h-9 w-px bg-gradient-to-b from-white/45 to-transparent"
        />
      </motion.div>

      {/* A1 Ultra spec annotations (chip act, desktop) */}
      <AnimatePresence>{act.id === 'chip' ? <ChipAnnotations key="chip" local={local} /> : null}</AnimatePresence>

      {/* X-ray hover cue (xray act, desktop) */}
      <AnimatePresence>
        {act.id === 'xray' ? (
          <motion.div
            key="xray-cue"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-[calc(9rem+env(safe-area-inset-bottom))] hidden justify-center lg:flex"
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
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
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

/** Per-act editorial composition, staggered against the act-local motion value. */
function CoreCaption({
  local,
  copy,
  align,
}: {
  local: MotionValue<number>
  copy: ChapterCopy
  align: 'center' | 'bottom' | 'left' | 'right'
}) {
  const r = copy.reveal ?? {}
  const centered = align === 'center' || align === 'bottom'

  switch (copy.layout) {
    case 'wordmark':
      return (
        <Wordmark
          local={local}
          from={r.title ?? 0.1}
          ruleFrom={r.rule ?? r.title ?? 0.24}
          title={copy.title}
          note={copy.note}
          noteFrom={r.note}
        />
      )
    case 'stat':
      return (
        <EditorialStat
          local={local}
          headline={copy.title}
          headlineFrom={r.title ?? 0.1}
          num={copy.num}
          numFrom={r.num}
          numUnit={copy.numUnit}
          unitFrom={r.unit}
          rows={copy.rows}
          rowsFrom={r.rows}
          note={copy.note}
          noteFrom={r.note}
          ruleFrom={r.rule ?? 0.24}
        />
      )
    case 'display':
      return (
        <DisplayBar
          local={local}
          title={copy.title}
          titleFrom={r.title ?? 0.08}
          num={copy.num}
          numFrom={r.num}
          numUnit={copy.numUnit}
          unitFrom={r.unit}
          rows={copy.rows}
          rowsFrom={r.rows}
        />
      )
    case 'tiers':
      return (
        <TierSeries
          local={local}
          title={copy.title}
          titleFrom={r.title ?? 0.08}
          tiers={copy.tiers ?? []}
          from={r.tiers ?? 0.18}
          note={copy.note}
          noteFrom={r.note}
        />
      )
    case 'inspect':
      return (
        <div className="flex flex-col items-start">
          <TitleLine local={local} from={r.title ?? 0.12} title={copy.title} />
          {copy.note ? <NoteLine local={local} from={r.note ?? 0.5} note={copy.note} className="mt-4" /> : null}
          {copy.extra === 'xray' ? (
            <RevealWindow local={local} from={0.62} to={0.72} className="mt-6">
              <XRayRead
                x={`${DIMENSIONS.widthM} m`}
                y={`${DIMENSIONS.heightM} m`}
                z={`${DIMENSIONS.thicknessMm} mm`}
              />
            </RevealWindow>
          ) : null}
        </div>
      )
    case 'chiplead':
      return (
        <div className="flex flex-col items-start">
          <TitleLine local={local} from={r.title ?? 0.1} title={copy.title} />
          {copy.note ? <NoteLine local={local} from={r.note ?? 0.6} note={copy.note} className="mt-4" /> : null}
        </div>
      )
    default:
      return (
        <div
          className={
            centered ? 'flex flex-col items-center text-center' : 'flex flex-col items-start text-left'
          }
        >
          <TitleLine local={local} from={r.title ?? 0.1} title={copy.title} />
          {copy.note ? <NoteLine local={local} from={r.note ?? 0.5} note={copy.note} className="mt-3" /> : null}
        </div>
      )
  }
}