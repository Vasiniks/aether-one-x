import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { Reveal } from '../ui/Reveal'

/** Shared closing call-to-action for product pages: one clear next step. */
export function CtaBand() {
  return (
    <section className="relative py-20 text-center lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Your One X is waiting.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-4 max-w-md text-pretty text-lg leading-relaxed text-dim">
            Choose a finish and a capacity. From $999, in obsidian, titanium, or glacier.
          </p>
        </Reveal>
        <Reveal delay={180}>
          <Link
            to="/#buy"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-[15px] font-semibold text-night transition-all duration-200 hover:bg-white"
          >
            Buy from $999
            <ArrowRight size={17} />
          </Link>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-5 font-mono text-[11px] tracking-[0.18em] text-faint">
            OBSIDIAN / TITANIUM / GLACIER
          </p>
        </Reveal>
      </div>
    </section>
  )
}