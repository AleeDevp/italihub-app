'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LuHandPlatter } from 'react-icons/lu';
import { ServicesCreateDialog } from './services-create-dialog';

export function ServicesCreateCard() {
  return (
    <Card className="w-full ad-services-bg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl ad-services shadow-lg">
            <LuHandPlatter className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Services Advertisement</CardTitle>
            <CardDescription className="text-base">
              Offer your professional services to the community
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-sm rounded-3xl py-6 space-y-6 mx-2 bg-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Before you create a services ad</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Describe your service clearly and professionally.</li>
            <li>Be transparent about pricing and scope.</li>
            <li>Use clear images if applicable, no watermarks.</li>
            <li>No misleading claims or duplicate postings.</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <ServicesCreateDialog />
        </div>
      </CardContent>
    </Card>
  );
}
