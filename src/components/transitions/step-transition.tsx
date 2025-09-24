import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

type StepTransitionProps = {
  children: ReactNode;
  currentStep: number;
  direction: 'forward' | 'backward';
};

const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -300 : 300,
    opacity: 0,
  }),
};

export function StepTransition({ children, currentStep, direction }: StepTransitionProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
