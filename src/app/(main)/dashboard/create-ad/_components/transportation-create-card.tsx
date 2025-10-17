'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BiSolidPlaneAlt } from 'react-icons/bi';
import { TransportationCreateDialog } from './transportation-create-dialog';

export function TransportationCreateCard() {
  return (
    <Card className="w-full ad-transportation-bg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl ad-transportation shadow-lg">
            <BiSolidPlaneAlt className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Transportation Advertisement</CardTitle>
            <CardDescription className="text-base">
              List your vehicle for sale or service
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="shadow-sm rounded-3xl py-6 space-y-6 mx-2 bg-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Before you create a transportation ad</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Ensure the vehicle details are accurate and verifiable.</li>
            <li>Disclose any defects or known issues honestly.</li>
            <li>Use clear photos; avoid watermarks or sensitive information.</li>
            <li>No duplicate or misleading listings.</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <TransportationCreateDialog />
        </div>
      </CardContent>
    </Card>
  );
}
