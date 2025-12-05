'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdWithService } from '@/data/ads/ads';
import { DEFAULT_AD_DETAIL_VARIANT, type AdDetailVariant } from './types';

interface ServiceAdDetailsProps {
  ad: AdWithService;
  variant?: AdDetailVariant;
  showEditButton?: boolean;
}

const WRAPPER_VARIANT_CLASS: Record<AdDetailVariant, string> = {
  manage: 'space-y-6',
  public: 'space-y-6 border-t pt-6',
  moderator: 'space-y-6 bg-muted/30 p-4 rounded-2xl',
};

export function ServiceAdDetails({
  ad,
  variant = DEFAULT_AD_DETAIL_VARIANT,
}: ServiceAdDetailsProps) {
  const wrapperClass = WRAPPER_VARIANT_CLASS[variant] ?? WRAPPER_VARIANT_CLASS.manage;

  const formatRateLabel = () => {
    if (!ad.service.rateAmount) return 'On request';
    const basisLabels: Record<string, string> = {
      HOURLY: '/hr',
      DAILY: '/day',
      PROJECT: '/project',
      MONTHLY: '/mo',
    };
    return `€${Number(ad.service.rateAmount)}${basisLabels[ad.service.rateBasis] || ''}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TRANSLATION: 'Translation',
      TUTORING: 'Tutoring',
      CONSULTING: 'Consulting',
      TECH_IT: 'Tech & IT',
      DESIGN_CREATIVE: 'Design & Creative',
      WRITING: 'Writing',
      LEGAL: 'Legal',
      ACCOUNTING: 'Accounting',
      HOME_REPAIR: 'Home Repair',
      CLEANING: 'Cleaning',
      MOVING: 'Moving',
      PET_CARE: 'Pet Care',
      CHILDCARE: 'Childcare',
      PHOTOGRAPHY: 'Photography',
      EVENT_PLANNING: 'Event Planning',
      OTHER: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div className={wrapperClass}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{ad.service.title}</h3>
            <p className="text-muted-foreground">{ad.service.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">
                {getCategoryLabel(ad.service.serviceCategory)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rate</p>
              <p className="text-lg font-semibold">{formatRateLabel()}</p>
            </div>
            {ad.service.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {ad.service.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
