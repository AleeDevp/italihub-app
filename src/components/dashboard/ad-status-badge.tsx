import { Badge } from '@/components/ui/badge';
import type { AdStatus } from '@/lib/enums';

interface StatusBadgeProps {
  status: AdStatus;
  className?: string;
}

export function AdStatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (status: AdStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'default' as const; // Success-like variant
      case 'PENDING':
        return 'secondary' as const; // Warning-like variant
      case 'REJECTED':
        return 'destructive' as const;
      case 'EXPIRED':
        return 'outline' as const; // Secondary variant
      default:
        return 'outline' as const;
    }
  };

  const getLabel = (status: AdStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'Online';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {getLabel(status)}
    </Badge>
  );
}
