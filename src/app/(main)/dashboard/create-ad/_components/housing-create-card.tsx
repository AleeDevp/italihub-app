'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaHouseChimney } from 'react-icons/fa6';
import { HousingCreateDialog } from './housing-create-dialog';

export function HousingCreateCard() {
  return (
    <Card className="w-full ad-housing-bg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl ad-housing shadow-lg">
            <FaHouseChimney className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Housing Advertisement</CardTitle>
            <CardDescription className="text-base">
              Post your property listing for rent or sale
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-sm rounded-3xl py-6 space-y-6 mx-2 bg-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Before you create a housing ad</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Only post properties you own or have permission to list.</li>
            <li>Provide accurate details about price, location, and condition.</li>
            <li>Photos must be clear and not contain watermarks or sensitive info.</li>
            <li>Avoid duplicate listings or misleading information.</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <HousingCreateDialog />
        </div>
      </CardContent>
    </Card>
  );
}
