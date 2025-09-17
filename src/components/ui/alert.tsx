import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4.5)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-6 gap-y-0.5 items-start [&>svg]:size-6 [&>svg]:self-center [&>svg]:row-span-2 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'border-red-200/80 dark:border-red-900/60 text-red-800 dark:text-red-200 bg-gradient-to-br from-red-50 via-red-50/90 to-red-100/70 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-900/10 [&>svg]:text-red-600 dark:[&>svg]:text-red-400 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_0_0_1px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur supports-[backdrop-filter]:bg-red-50/70 dark:supports-[backdrop-filter]:bg-red-950/30 *:data-[slot=alert-description]:text-red-700 dark:*:data-[slot=alert-description]:text-red-300',
        success:
          'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 [&>svg]:text-green-600 dark:[&>svg]:text-green-400 *:data-[slot=alert-description]:text-green-700 dark:*:data-[slot=alert-description]:text-green-400',
        warning:
          'border-yellow-200/80 dark:border-yellow-900/60 text-yellow-800 dark:text-yellow-200 bg-gradient-to-br from-yellow-50 via-yellow-50/90 to-yellow-100/70 dark:from-yellow-950/40 dark:via-yellow-950/20 dark:to-yellow-900/10 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_0_0_1px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur supports-[backdrop-filter]:bg-yellow-50/70 dark:supports-[backdrop-filter]:bg-yellow-950/30 *:data-[slot=alert-description]:text-yellow-700 dark:*:data-[slot=alert-description]:text-yellow-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function iconForVariant(v?: string) {
  switch (v) {
    case 'destructive':
      return <AlertCircle />;
    case 'success':
      return <CheckCircle2 />;
    case 'warning':
      return <TriangleAlert />;
    default:
      return <Info />;
  }
}

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {iconForVariant(variant ?? undefined)}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
