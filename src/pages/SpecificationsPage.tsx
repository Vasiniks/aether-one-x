import { CONCEPT_NOTICE, SPEC_CATEGORIES } from '../data/product'
import { CtaBand } from '../components/layout/CtaBand'
import { PageHero } from '../components/layout/PageHero'
import { Reveal } from '../components/ui/Reveal'

const META = [
  { k: 'Display', v: '3200 × 1440' },
  { k: 'Weight', v: '198 g' },
  { k: 'Battery', v: '5200 mAh' },
  { k: 'Process', v: '3 nm' },
]

/** Full data sheet: every category expanded, nothing tucked away. */
export function SpecificationsPage() {
  return (
    <>
      <PageHero
        kicker="Aether One X · Specifications"
        title="The data sheet, in full"
        lead="Every figure for the Aether One X, on one page. Categories stay open - a spec page that hides its own numbers is a brochure, not a spec page."
        meta={META}
      />

      <section className="relative py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f17]">
            {SPEC_CATEGORIES.map((category, index) => (
              <Reveal key={category.label} delay={Math.min(index * 40, 200)}>
                <div className="grid gap-4 border-b border-white/5 p-6 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:p-7">
                  <h2 className="font-mono text-[11px] leading-6 tracking-[0.22em] text-aether uppercase">
                    {category.label}
                  </h2>
                  <dl>
                    {category.rows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[9rem_1fr] gap-4 border-b border-white/5 py-2.5 last:border-b-0 sm:grid-cols-[13rem_1fr]"
                      >
                        <dt className="text-[13px] text-faint">{row.label}</dt>
                        <dd className="text-[13.5px] text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-6 font-mono text-[11px] leading-relaxed text-faint">{CONCEPT_NOTICE}</p>
        </div>
      </section>

      <CtaBand />
    </>
  )
}