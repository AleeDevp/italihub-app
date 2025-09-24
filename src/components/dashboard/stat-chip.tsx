import { Badge } from '@/components/ui/badge';

interface StatChipProps {
  label: string;
  count: number;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function StatChip({ label, count, variant = 'secondary', className }: StatChipProps) {
  return (
    <Badge variant={variant} className={`text-xs px-2 py-1 rounded-full ${className || ''}`}>
      {label}: {count}
    </Badge>
  );
}
