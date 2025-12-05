'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDashboardOverview, type OverviewStats } from '@/hooks/use-dashboard-overview';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, BarChart3, Eye, MessageCircle, TrendingUp } from 'lucide-react';
import { memo, useMemo, type ReactNode } from 'react';

const PERFORMANCE_PLACEHOLDER = {
  views: 1234,
  viewsDelta: 12,
  contacts: 89,
  contactsDelta: 6,
};

const STATUS_LABELS: Record<keyof OverviewStats, { label: string; accent: string }> = {
  online: { label: 'Online', accent: 'text-emerald-600' },
  pending: { label: 'Pending', accent: 'text-amber-600' },
  rejected: { label: 'Rejected', accent: 'text-rose-600' },
  expired: { label: 'Expired', accent: 'text-slate-500' },
};

export function AdsOverviewSidebar() {
  const { data, isLoading, error, refetch } = useDashboardOverview();

  const totalAds = useMemo(() => {
    if (!data) return 0;
    const { online, pending, rejected, expired } = data.stats;
    return online + pending + rejected + expired;
  }, [data]);

  if (isLoading && !data) {
    return <OverviewSidebarSkeleton />;
  }

  if (error && !data) {
    return (
      <EmptySidebarState
        title="Overview is unavailable"
        description="Something went wrong while pulling your ad analytics."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-fit bg-white shadow-lg rounded-3xl gap-6 p-6 text-sm">
      {error && (
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          {error.message || 'Failed to load overview data'}
        </div>
      )}

      {/* Ads Health Section */}
      <StatsSection stats={data?.stats} totalAds={totalAds} />
      <Separator className="bg-border/30" />

      {/* Performance Snapshot Section */}
      <PerformanceSection />
      <Separator className="bg-border/30" />

      {/* Top Performing Ads Section */}
      <TopAdsSection topAds={data?.topAds} />
      <Separator className="bg-border/30" />

      {/* Recent Activity Section */}
      <RecentActivitySection recentActivity={data?.recentActivity} />
    </div>
  );
}

// Extract sections into memoized components for better performance
const StatsSection = memo(function StatsSection({
  stats,
  totalAds,
}: {
  stats?: OverviewStats;
  totalAds: number;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ad stats
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          Object.entries(STATUS_LABELS) as Array<
            [keyof OverviewStats, { label: string; accent: string }]
          >
        ).map(([key, meta]) => {
          const value = stats?.[key] ?? 0;

          return (
            <div
              key={key}
              className="group relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/20 p-3 transition-all"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                {meta.label}
              </p>
              <p className={cn('mt-1 text-2xl font-bold leading-none', meta.accent)}>{value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-muted/30 px-4 py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Total ads
          </p>
          <p className="mt-0.5 text-2xl font-bold leading-none">{totalAds}</p>
        </div>
        <Separator orientation="vertical" className="h-10 bg-border/40" />
        <p className="text-xs text-muted-foreground/80">
          {stats ? 'All categories' : 'Loading metrics…'}
        </p>
      </div>
    </section>
  );
});

const PerformanceSection = memo(function PerformanceSection() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Performance Snapshot
        </h2>
        <p className="mt-1 text-xs text-muted-foreground/70">Views vs contacts this month</p>
      </div>

      <div className="space-y-4">
        <MetricRow
          icon={<Eye className="h-4 w-4 text-blue-500" />}
          label="Views"
          value={PERFORMANCE_PLACEHOLDER.views}
          delta={PERFORMANCE_PLACEHOLDER.viewsDelta}
        />
        <ProgressBar value={75} accent="bg-gradient-to-r from-blue-500 to-blue-600" />

        <MetricRow
          icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
          label="Contacts"
          value={PERFORMANCE_PLACEHOLDER.contacts}
          delta={PERFORMANCE_PLACEHOLDER.contactsDelta}
        />
        <ProgressBar value={45} accent="bg-gradient-to-r from-emerald-500 to-emerald-600" />
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <TrendingUp className="h-3 w-3 text-emerald-500" />
        <span>+12% compared to previous month</span>
      </p>
    </section>
  );
});

const TopAdsSection = memo(function TopAdsSection({
  topAds,
}: {
  topAds?: Array<{ adId: number; title?: string | null; views: number; clicks: number }>;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Top Performing Ads
        </h2>
        <p className="mt-1 text-xs text-muted-foreground/70">Highest engagement online ads</p>
      </div>

      <div className="space-y-2">
        {topAds?.length ? (
          topAds.slice(0, 5).map((ad, index) => (
            <div
              key={ad.adId}
              className="group flex min-w-0 items-center gap-3 rounded-lg border border-border/40 bg-gradient-to-br from-background to-muted/10 p-3 transition-all"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {ad.title?.trim() || `Ad #${ad.adId}`}
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {ad.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {ad.clicks}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyStateMessage
            icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
            title="No online ads yet"
            description="Publish an ad to unlock performance insights."
          />
        )}
      </div>
    </section>
  );
});

const RecentActivitySection = memo(function RecentActivitySection({
  recentActivity,
}: {
  recentActivity?: Array<{
    createdAt: Date;
    action: string;
    entityType: string;
    entityId?: number | null;
    outcome: string;
  }>;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h2>
        <p className="mt-1 text-xs text-muted-foreground/70">Latest actions on ItaliaHub</p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {recentActivity?.length ? (
          recentActivity.slice(0, 6).map((activity, index) => (
            <div
              key={`${activity.action}-${index}`}
              className="flex items-start gap-3 rounded-lg border border-border/30 bg-gradient-to-br from-background to-muted/10 p-2.5 transition-colors"
            >
              <div className="rounded-full bg-primary/10 p-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">
                    {formatActionLabel(activity.action)}
                  </span>
                  <Badge
                    variant={activity.outcome === 'SUCCESS' ? 'default' : 'destructive'}
                    className="shrink-0 text-[9px]"
                  >
                    {activity.outcome}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                  {activity.createdAt.toLocaleDateString()} ·{' '}
                  {activity.createdAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyStateMessage
            icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
            title="No recent actions"
            description="Your moderation and publishing events will show up here."
          />
        )}
      </div>
    </section>
  );
});

function formatActionLabel(action: string) {
  return action.replace(/_/g, ' ').toLowerCase();
}

const MetricRow = memo(function MetricRow({
  icon,
  label,
  value,
  delta,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  delta: number;
}) {
  const trend = delta >= 0 ? 'positive' : 'negative';
  const trendIcon =
    trend === 'positive' ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
    );

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold">{value.toLocaleString()}</p>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            trend === 'positive' ? 'text-emerald-600' : 'text-rose-600'
          )}
        >
          {trendIcon}
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
});

const ProgressBar = memo(function ProgressBar({
  value,
  accent,
}: {
  value: number;
  accent: string;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
      <div
        className={cn('h-full rounded-full transition-all', accent)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
});

const EmptyStateMessage = memo(function EmptyStateMessage({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border/50 bg-muted/20 py-8 text-center">
      {icon}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
      </div>
    </div>
  );
});

const EmptySidebarState = memo(function EmptySidebarState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-8 text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground/80">{description}</p>
      </div>
      <Button variant="default" onClick={onRetry} className="mt-2">
        Retry
      </Button>
    </div>
  );
});

const OverviewSidebarSkeleton = memo(function OverviewSidebarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {[1, 2, 3, 4].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-3 w-full animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
