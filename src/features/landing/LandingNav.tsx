import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import { ThemeToggleIcon } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'About', href: '#about' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'glass border-b border-ink-200/50 dark:border-ink-800/50'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-lg text-ink-900 dark:text-ink-100">
            FlacronControl
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 rounded-xl hover:bg-ink-100/80 dark:hover:bg-ink-800/80 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggleIcon />
          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to={ROUTES.SIGNUP}>
            <Button size="sm">Get started free</Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleIcon />
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-ink-200/50 dark:border-ink-800/50"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link to={ROUTES.LOGIN} onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">Sign in</Button>
                </Link>
                <Link to={ROUTES.SIGNUP} onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Get started free</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
