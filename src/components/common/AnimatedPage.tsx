import { motion } from 'framer-motion'

interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
