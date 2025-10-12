import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listRecentUserActivity } from '@/data/activity/activity';
import { getUserAdStats } from '@/data/ads/ads';
import { getOnlineAdsWithCounters } from '@/data/metrics/metrics';
import { Activity, BarChart3, Eye, MessageCircle, TrendingUp } from 'lucide-react';

interface OverviewContentProps {
  userId: string;
}

export async function OverviewContent({ userId }: OverviewContentProps) {
  const [adStats, topAds, recentActivity] = await Promise.all([
    getUserAdStats(userId),
    getOnlineAdsWithCounters(userId),
    listRecentUserActivity(userId, 10),
  ]);

  const totalAds = adStats.online + adStats.pending + adStats.rejected + adStats.expired;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAds}</div>
            <p className="text-xs text-muted-foreground">All time ads created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Ads</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{adStats.online}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{adStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Total views (mock data)</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Top Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance This Month</CardTitle>
            <CardDescription>Views and clicks overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Views</span>
                </div>
                <div className="text-2xl font-bold">1,234</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Contacts</span>
                </div>
                <div className="text-2xl font-bold">89</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                📈 +12% compared to last month
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Ads */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Ads</CardTitle>
            <CardDescription>Your most viewed online ads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAds.length > 0 ? (
                topAds.map((ad, index) => (
                  <div key={ad.adId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ad.title || `Ad #${ad.adId}`}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {ad.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {ad.clicks}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No online ads yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create an ad to see performance metrics
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions on ItaliaHub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {activity.action.replace('_', ' ').toLowerCase()}
                      </span>
                      <Badge
                        variant={activity.outcome === 'SUCCESS' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.outcome}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.createdAt.toLocaleDateString()} at{' '}
                      {activity.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">Your actions will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
