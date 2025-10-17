'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HiShoppingBag } from 'react-icons/hi2';
import { MarketCreateDialog } from './market-create-dialog';

export function MarketCreateCard() {
  return (
    <Card className="w-full  ad-marketplace-bg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl ad-marketplace shadow-lg">
            <HiShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Market Advertisement</CardTitle>
            <CardDescription className="text-base">
              Sell your items or products on the marketplace
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-sm rounded-3xl py-6 space-y-6 mx-2 bg-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Before you create a market ad</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Ensure product descriptions and prices are accurate.</li>
            <li>Use clear, honest photos without watermarks.</li>
            <li>Specify condition and shipping/collection details.</li>
            <li>No counterfeit or prohibited goods.</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <MarketCreateDialog />
        </div>
      </CardContent>
    </Card>
  );
}
