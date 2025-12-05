'use client';

import { OptimizedImage } from '@/components/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdWithMarketplace } from '@/data/ads/ads';
import { cn, formatDate } from '@/lib/utils';
import { MapPin, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_AD_CARD_VARIANT, type AdCardVariant } from './types';

interface MarketplaceAdCardProps {
  ad: AdWithMarketplace;
  variant?: AdCardVariant;
}

const CARD_VARIANT_CLASSES: Record<AdCardVariant, string> = {
  manage: 'border-l-4 border-l-green-500/20 hover:border-l-green-500',
  public: 'border border-muted/40 hover:border-primary/40',
  moderator: 'border border-destructive/30',
};

export function MarketplaceAdCard({
  ad,
  variant = DEFAULT_AD_CARD_VARIANT,
}: MarketplaceAdCardProps) {
  const { marketplace, status, coverMedia, city, createdAt, viewsCount, contactClicksCount } = ad;

  const getStatusColor = (value: string) => {
    switch (value) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      NEW: 'New',
      LIKE_NEW: 'Like New',
      GOOD: 'Good',
      FAIR: 'Fair',
      POOR: 'Poor',
    };
    return labels[condition] || condition;
  };

  const variantClasses = CARD_VARIANT_CLASSES[variant] ?? CARD_VARIANT_CLASSES.manage;

  return (
    <Link href={`/dashboard/ads-management/${ad.id}`} data-variant={variant}>
      <Card
        className={cn('hover:shadow-lg transition-all duration-200 cursor-pointer', variantClasses)}
      >
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {/* Image */}
            <div className="flex-shrink-0 w-full sm:w-24 md:w-32">
              {coverMedia ? (
                <OptimizedImage
                  storageKey={coverMedia.storageKey}
                  imageType="gallery"
                  alt={coverMedia.alt || marketplace.title}
                  className="w-full h-40 sm:h-24 md:h-32 object-cover rounded-lg"
                  fallbackIcon={<ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />}
                />
              ) : (
                <div className="w-full h-40 sm:h-24 md:h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-green-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <Badge className={getStatusColor(status)} variant="secondary">
                      {status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getConditionLabel(marketplace.condition)}
                    </Badge>
                    {marketplace.category && (
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                        {marketplace.category}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base md:text-lg line-clamp-2">
                    {marketplace.title}
                  </h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base md:text-lg text-primary whitespace-nowrap">
                    €{Number(marketplace.price)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                <p className="line-clamp-2">{marketplace.description}</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{city.name}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4 pt-1 text-[10px] md:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">👁️ {viewsCount}</span>
                <span className="flex items-center gap-1">📞 {contactClicksCount}</span>
                <span className="hidden sm:flex items-center gap-1">
                  🗓️ {formatDate(createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
