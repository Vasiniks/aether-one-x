import { List, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { cn } from '../../utils/cn'

const LINKS = [
  { label: 'Overview', to: '/' },
  { label: 'Cameras', to: '/cameras' },
  { label: 'Performance', to: '/performance' },
  { label: 'Display', to: '/display' },
  { label: 'Software', to: '/software' },
  { label: 'Specifications', to: '/specifications' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12))

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-white/10' : 'border-b border-transparent',
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-night">
        Skip to content
      </a>
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 sm:px-8',
          scrolled ? 'h-16' : 'h-20',
        )}
      >
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Aether One X, home">
          <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden="true" className="translate-y-[1px]">
            <defs>
              <linearGradient id="nav-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8fc0ff" />
                <stop offset="1" stopColor="#27548f" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="24" fill="none" stroke="url(#nav-ring)" strokeWidth="9" />
            <circle cx="32" cy="32" r="6" fill="#eaf2ff" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[0.08em]">
            AETHER<span className="ml-1.5 text-faint">One X</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative text-[13.5px] transition-colors duration-200',
                      isActive ? 'text-ink' : 'text-dim hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <span className="relative">
                      {link.label}
                      <span
                        className={cn(
                          'absolute -bottom-2 left-0 h-px w-full origin-left bg-aether transition-transform duration-300',
                          isActive ? 'scale-x-100' : 'scale-x-0',
                        )}
                      />
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/#buy"
            className="hidden rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-night transition-all duration-200 hover:bg-white sm:inline-flex"
          >
            Buy
          </Link>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition-colors hover:bg-white/5 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-night px-6 pb-10 pt-6 lg:hidden">
          <nav aria-label="Mobile">
            <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
              {LINKS.map((link, index) => (
                <li key={link.to}>
                  <Link to={link.to} className="group flex items-center justify-between py-5">
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] text-faint">0{index + 1}</span>
                      <span className="text-xl font-medium">{link.label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            to="/#buy"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-night"
          >
            Buy Aether One X
          </Link>
          <p className="mt-4 text-center text-[12px] text-faint">Fictional concept product.</p>
        </div>
      ) : null}
    </header>
  )
}