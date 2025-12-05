'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { AdWithMarketplace } from '@/data/ads/ads';
import { DEFAULT_AD_DETAIL_VARIANT, type AdDetailVariant } from './types';

interface MarketplaceAdDetailsProps {
  ad: AdWithMarketplace;
  variant?: AdDetailVariant;
  showEditButton?: boolean;
}

const WRAPPER_VARIANT_CLASS: Record<AdDetailVariant, string> = {
  manage: 'space-y-6',
  public: 'space-y-6 border-t pt-6',
  moderator: 'space-y-6 bg-muted/30 p-4 rounded-2xl',
};

export function MarketplaceAdDetails({
  ad,
  variant = DEFAULT_AD_DETAIL_VARIANT,
}: MarketplaceAdDetailsProps) {
  const wrapperClass = WRAPPER_VARIANT_CLASS[variant] ?? WRAPPER_VARIANT_CLASS.manage;

  return (
    <div className={wrapperClass}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{ad.marketplace.title}</h3>
            <p className="text-muted-foreground">{ad.marketplace.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">€{Number(ad.marketplace.price)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Condition</p>
              <p className="text-lg font-semibold">{ad.marketplace.condition}</p>
            </div>
            {ad.marketplace.category && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-lg font-semibold">{ad.marketplace.category}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
