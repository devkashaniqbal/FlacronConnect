import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-ink-950">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-display font-black gradient-text mb-6">404</div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-3">Page not found</h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Go back
          </Button>
          <Link to={ROUTES.LANDING}>
            <Button icon={<Home size={16} />}>Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
