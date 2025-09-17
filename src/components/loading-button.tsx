import * as React from 'react';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from './loading-spinner';

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading: boolean;
}

export function LoadingButton({ loading, disabled, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? <LoadingSpinner /> : children}
    </Button>
  );
}
