import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type StatusTransitionProps = {
  children: ReactNode;
  status: 'loading' | 'success' | 'error';
};

const statusVariants = {
  loading: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  success: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  },
  error: {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export function StatusTransition({ children, status }: StatusTransitionProps) {
  const variant = statusVariants[status];

  return (
    <motion.div
      key={status}
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={{
        duration: status === 'success' ? 0.5 : 0.4,
        ease: status === 'success' ? [0.34, 1.56, 0.64, 1] : 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
