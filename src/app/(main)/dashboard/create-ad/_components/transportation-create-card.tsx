'use client';

import { TransportationDialog } from '@/components/ad-forms/transportation/transportation-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AD_CATEGORY_BY_ID } from '@/constants/ad-categories';
import { cn } from '@/lib/utils';

export function TransportationCreateCard() {
  const category = AD_CATEGORY_BY_ID.TRANSPORTATION;

  if (!category) {
    return null;
  }

  const Icon = category.icon;

  return (
    <Card className={cn('w-full', category.bgPrimaryColor)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl shadow-lg', category.bgSecondaryColor)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">{category.cardTitle}</CardTitle>
            <CardDescription className="text-base">{category.cardDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-sm rounded-3xl py-6 space-y-6 mx-2 bg-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{category.guidelinesTitle}</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {category.guidelines.map((guideline) => (
              <li key={guideline}>{guideline}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end">
          <TransportationDialog />
        </div>
      </CardContent>
    </Card>
  );
}
