import { StatusBadge } from '@/components/dashboard/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listUserAds, UserAdListParams } from '@/lib/dal/ads';
import type { AdStatus } from '@/lib/enums';
import {
  Calendar,
  Edit,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface AdsContentProps {
  userId: string;
  params: {
    status?: string;
    q?: string;
    page?: number;
    sort?: 'created-desc' | 'created-asc';
  };
}

export async function AdsContent({ userId, params }: AdsContentProps) {
  const adParams: UserAdListParams = {
    userId,
    page: params.page || 1,
    pageSize: 12,
    sort: params.sort || 'created-desc',
  };

  if (params.status && params.status !== 'all') {
    adParams.status = params.status.toUpperCase() as AdStatus;
  }

  if (params.q) {
    adParams.q = params.q;
  }

  const ads = await listUserAds(adParams);

  const tabs = [
    { key: 'all', label: 'All', active: !params.status || params.status === 'all' },
    { key: 'online', label: 'Online', active: params.status === 'online' },
    { key: 'pending', label: 'Pending', active: params.status === 'pending' },
    { key: 'rejected', label: 'Rejected', active: params.status === 'rejected' },
    { key: 'expired', label: 'Expired', active: params.status === 'expired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard/ads${tab.key === 'all' ? '' : `?status=${tab.key}`}`}
            >
              <Button variant={tab.active ? 'default' : 'outline'} size="sm" className="h-8">
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>

        <Link href="/post-ad">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Ad
          </Button>
        </Link>
      </div>

      {/* Simple Search */}
      <div className="flex gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {ads.items.length} of {ads.total} ads
        </div>
      </div>

      {/* Ads List */}
      <div className="space-y-4">
        {ads.items.length > 0 ? (
          ads.items.map((ad) => (
            <Card key={ad.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {ad.category}
                      </Badge>
                      <StatusBadge status={ad.status} />
                      {ad.expirationDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Expires {new Date(ad.expirationDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-lg">
                        {ad.title || `${ad.category} Ad #${ad.id}`}
                      </h3>
                      {ad.priceLabel && (
                        <p className="text-green-600 font-medium">{ad.priceLabel}</p>
                      )}
                      {ad.summary && (
                        <p className="text-sm text-muted-foreground mt-1">{ad.summary}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {ad.viewsCount} views
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {ad.contactClicksCount} contacts
                      </div>
                      <span>{ad.cityName}</span>
                      <span>Created {ad.createdAt.toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {ad.status === 'EXPIRED' && (
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {ad.thumbnail && (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-md"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No ads found</h3>
                  <p className="text-muted-foreground">
                    {params.q || params.status
                      ? 'Try adjusting your search or filters'
                      : 'Create your first ad to get started'}
                  </p>
                </div>
                <Link href="/post-ad">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ad
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
