import { ArrowUp, ArrowUpRight } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { CONCEPT_NOTICE } from '../../data/product'

const FOOTER_COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Explore',
    links: [
      { label: 'Overview', to: '/' },
      { label: 'Cameras', to: '/cameras' },
      { label: 'Performance', to: '/performance' },
      { label: 'Display', to: '/display' },
      { label: 'Software', to: '/software' },
      { label: 'Specifications', to: '/specifications' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About (fictional)', to: '/#overview' },
      { label: 'Design journal', to: '/' },
      { label: 'Sustainability', to: '/' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Getting started', to: '/#software' },
      { label: 'Trade-in', to: '/#buy' },
      { label: 'Order status', to: '/#buy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#08090d]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="Back to home">
              <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <linearGradient id="foot-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8fc0ff" />
                    <stop offset="1" stopColor="#27548f" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="24" fill="none" stroke="url(#foot-ring)" strokeWidth="9" />
                <circle cx="32" cy="32" r="6" fill="#eaf2ff" />
              </svg>
              <span className="text-[16px] font-semibold tracking-[0.08em]">
                AETHER<span className="ml-1.5 text-faint">One X</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-dim">
              Power, without the noise. A fictional concept device built to demonstrate a complete,
              self-contained product page.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-1.5 font-mono text-[12px] text-aether transition-colors hover:text-white"
            >
              Back to top <ArrowUp size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">{column.heading}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="inline-flex items-center gap-1 text-[13.5px] text-dim transition-colors hover:text-ink"
                      >
                        {link.label}
                        <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <p className="font-mono text-[11.5px] leading-relaxed text-faint">{CONCEPT_NOTICE}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] text-faint">© 2026 Aether · a fictional concept page</p>
            <p className="font-mono text-[11px] text-faint">Built with React 19 / Vite / Tailwind CSS / Motion</p>
          </div>
        </div>
      </div>
    </footer>
  )
}