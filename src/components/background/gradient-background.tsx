'use client';

import { motion, type HTMLMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

type GradientBackgroundProps = HTMLMotionProps<'div'>;

function GradientBackground({
  className,
  transition = { duration: 10, ease: 'easeInOut', repeat: Infinity },
  ...props
}: GradientBackgroundProps) {
  return (
    <motion.div
      data-slot="gradient-background"
      className={cn(
        'size-full bg-gradient-to-br from-[#ffc3d4] via-[#ff1563] to-[#ffffff] bg-[length:400%_400%]',
        className
      )}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={transition}
      {...props}
    >
      <div className="size-full bg-repeat bg-[url(/backgrounds/circle-ellipsis.svg)] bg-[length:50px_50px]" />
    </motion.div>
  );
}

export { GradientBackground, type GradientBackgroundProps };
