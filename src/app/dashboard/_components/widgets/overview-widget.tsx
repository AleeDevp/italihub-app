import { StatChip } from '@/components/dashboard/stat-chip';
import { Widget } from '@/components/dashboard/widget';
import { BarChart3 } from 'lucide-react';

export interface OverviewWidgetProps {
  stats: {
    online: number;
    pending: number;
    rejected: number;
    expired: number;
  };
}

export function OverviewWidget({ stats }: OverviewWidgetProps) {
  return (
    <Widget
      title="Overview"
      description="Ad statistics and performance"
      ctaLabel="View Details"
      href="/dashboard/overview"
      icon={<BarChart3 className="h-5 w-5" />}
    >
      <div className="flex flex-wrap gap-2">
        <StatChip label="Online" count={stats.online} variant="default" />
        <StatChip label="Pending" count={stats.pending} variant="secondary" />
        <StatChip label="Rejected" count={stats.rejected} variant="destructive" />
        <StatChip label="Expired" count={stats.expired} variant="outline" />
      </div>
    </Widget>
  );
}
