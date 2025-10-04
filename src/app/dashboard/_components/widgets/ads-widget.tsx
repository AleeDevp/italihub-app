import { StatusBadge } from '@/components/dashboard/status-badge';
import { Widget } from '@/components/dashboard/widget';
import type { AdStatus } from '@/lib/enums';
import { Eye, FileText, MessageCircle } from 'lucide-react';

export interface AdsWidgetProps {
  ads: Array<{
    id: number; // updated to number
    title?: string | null;
    category: string;
    status: AdStatus;
    viewsCount: number;
    contactClicksCount: number;
  }>;
}

export function AdsWidget({ ads }: AdsWidgetProps) {
  return (
    <Widget
      title="My Ads"
      description="Manage your listings"
      ctaLabel="View All Ads"
      href="/dashboard/ads"
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="space-y-2">
        {ads.slice(0, 3).map((ad) => (
          <div key={ad.id} className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{ad.title || `${ad.category} Ad`}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {ad.viewsCount}
                <MessageCircle className="h-3 w-3" />
                {ad.contactClicksCount}
              </div>
            </div>
            <StatusBadge status={ad.status} />
          </div>
        ))}
        {ads.length === 0 && <p className="text-sm text-muted-foreground">No ads yet</p>}
      </div>
    </Widget>
  );
}
