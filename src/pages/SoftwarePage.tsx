import { CheckCircle } from '@phosphor-icons/react'
import { AI_CAPABILITIES, CONCEPT_NOTICE } from '../data/product'
import { PHONE_INTERACTION_COPY } from '../data/software'
import { AetherOSPhone } from '../components/PhoneOS/AetherOSPhone'
import { CtaBand } from '../components/layout/CtaBand'
import { PageHero } from '../components/layout/PageHero'
import { Reveal } from '../components/ui/Reveal'

const META = [
  { k: 'Operating system', v: 'AetherOS 2.0' },
  { k: 'Memory', v: '16 GB' },
  { k: 'Neural engine', v: '46 TOPS' },
  { k: 'Intelligence', v: 'On-device' },
]

/** Software product page: the interactive OS, its principles, and its on-device promise. */
export function SoftwarePage() {
  return (
    <>
      <PageHero
        kicker="Aether One X · Software"
        title="Software that steps back"
        lead="AetherOS keeps the essentials one thumb away and quietly handles everything else. Summaries, transcripts, photo cleanup - all of it runs on the phone itself."
        meta={META}
      />

      <section className="relative py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto w-full max-w-[20rem]">
            <Reveal>
              <AetherOSPhone />
            </Reveal>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-2">
            {PHONE_INTERACTION_COPY.map((item, index) => (
              <Reveal key={item} delay={index * 70}>
                <div className="h-full bg-[#0d0f17] p-6">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-aether" />
                  <span className="mt-3 block text-[13.5px] leading-relaxed text-dim">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-6 border-l border-white/10 pl-4 font-mono text-[11.5px] leading-relaxed text-faint">
            The phone above is interactive: open an app, dismiss a notification, pull down the quick settings.
          </p>
        </div>
      </section>

      <section className="relative py-8 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">On-device by design</h2>
            <p className="mt-3 max-w-xl text-pretty text-dim">
              The A1 Ultra neural engine handles the everyday intelligence. Nothing personal has to leave the phone
              to be useful.
            </p>
          </Reveal>
          <ul className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
            {AI_CAPABILITIES.map((cap, index) => (
              <Reveal key={cap} delay={index * 50}>
                <li className="flex items-center gap-3 bg-[#0d0f17] p-5">
                  <CheckCircle size={17} weight="fill" className="shrink-0 text-aether" />
                  <span className="text-[13.5px] text-dim">{cap}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 font-mono text-[11px] leading-relaxed text-faint">{CONCEPT_NOTICE}</p>
        </div>
      </section>

      <CtaBand />
    </>
  )
}