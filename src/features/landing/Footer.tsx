import { Link } from 'react-router-dom'
import { Zap, Twitter, Linkedin, Github, Mail } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'Documentation', href: '#' },
    { label: 'Status', href: '#' },
    { label: 'Contact', href: '#' },
  ],
}

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Mail, label: 'Email', href: 'mailto:hello@flacroncontrol.com' },
]

export function Footer() {
  return (
    <footer className="bg-ink-900 dark:bg-ink-950 text-ink-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="font-display font-bold text-lg text-white">FlacronControl</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered business automation for modern service businesses. Manage everything from one beautiful platform.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-ink-800 hover:bg-ink-700 flex items-center justify-center transition-colors"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-ink-200 mb-4 text-sm">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-ink-200 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ink-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} FlacronControl. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span>Built with</span>
            <span className="text-brand-400">React</span>
            <span>·</span>
            <span className="text-brand-400">Firebase</span>
            <span>·</span>
            <span className="text-brand-400">OpenAI</span>
            <span>·</span>
            <span className="text-brand-400">WatsonX</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
