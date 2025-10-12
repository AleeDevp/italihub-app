'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FaHouseChimney } from 'react-icons/fa6';

export function HousingForm() {
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="housing-title">Property Title *</Label>
            <Input id="housing-title" placeholder="e.g., Modern 2BR Apartment in City Center" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="housing-description">Description *</Label>
            <Textarea
              id="housing-description"
              placeholder="Describe your property in detail..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="housing-type">Property Type</Label>
              <Input id="housing-type" placeholder="e.g., Apartment, House, Studio" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="housing-price">Price (€)</Label>
              <Input id="housing-price" type="number" placeholder="e.g., 1200" />
            </div>
          </div>

          {/* Placeholder for additional form fields */}
          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>Additional fields will be implemented here</p>
            <p className="text-xs mt-1">(Location, Bedrooms, Bathrooms, Size, etc.)</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" size="lg">
            Save Draft
          </Button>
          <Button size="lg" className="ad-housing hover:shadow-lg transition-all">
            Publish Ad
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
