'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { AdWithTransportation } from '@/data/ads/ads';
import { formatDate } from '@/lib/utils';
import { DEFAULT_AD_DETAIL_VARIANT, type AdDetailVariant } from './types';

interface TransportationAdDetailsProps {
  ad: AdWithTransportation;
  variant?: AdDetailVariant;
  showEditButton?: boolean;
}

const WRAPPER_VARIANT_CLASS: Record<AdDetailVariant, string> = {
  manage: 'space-y-6',
  public: 'space-y-6 border-t pt-6',
  moderator: 'space-y-6 bg-muted/30 p-4 rounded-2xl',
};

export function TransportationAdDetails({
  ad,
  variant = DEFAULT_AD_DETAIL_VARIANT,
}: TransportationAdDetailsProps) {
  const sectionClass = WRAPPER_VARIANT_CLASS[variant] ?? WRAPPER_VARIANT_CLASS.manage;

  const formatPrice = () => {
    if (ad.transportation.priceMode === 'PER_KG' && ad.transportation.pricePerKg) {
      return `€${Number(ad.transportation.pricePerKg)}/kg`;
    }
    if (ad.transportation.priceMode === 'FIXED' && ad.transportation.fixedTotalPrice) {
      return `€${Number(ad.transportation.fixedTotalPrice)} (fixed)`;
    }
    return 'On request';
  };

  return (
    <div className={sectionClass}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Direction</p>
              <p className="text-lg font-semibold">
                {ad.transportation.direction === 'TO_ITALY' ? 'To Italy' : 'From Italy'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Flight Date</p>
              <p className="text-lg font-semibold">{formatDate(ad.transportation.flightDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">From</p>
              <p className="text-lg font-semibold">
                {ad.transportation.departureCity}, {ad.transportation.departureCountry}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">To</p>
              <p className="text-lg font-semibold">
                {ad.transportation.arrivalCity}, {ad.transportation.arrivalCountry}
              </p>
            </div>
            {ad.transportation.capacityKg && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                <p className="text-lg font-semibold">{Number(ad.transportation.capacityKg)} kg</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">{formatPrice()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
