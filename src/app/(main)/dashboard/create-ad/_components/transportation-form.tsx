'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BiSolidPlaneAlt } from 'react-icons/bi';

export function TransportationForm() {
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transport-title">Vehicle Title *</Label>
            <Input id="transport-title" placeholder="e.g., 2020 Toyota Corolla - Like New" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport-description">Description *</Label>
            <Textarea
              id="transport-description"
              placeholder="Describe your vehicle in detail..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport-type">Vehicle Type</Label>
              <Input id="transport-type" placeholder="e.g., Car, Motorcycle, Bicycle" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport-price">Price (€)</Label>
              <Input id="transport-price" type="number" placeholder="e.g., 15000" />
            </div>
          </div>

          {/* Placeholder for additional form fields */}
          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>Additional fields will be implemented here</p>
            <p className="text-xs mt-1">(Make, Model, Year, Mileage, Condition, etc.)</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" size="lg">
            Save Draft
          </Button>
          <Button size="lg" className="ad-transportation hover:shadow-lg transition-all">
            Publish Ad
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
