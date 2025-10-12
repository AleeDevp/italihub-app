'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LuHandPlatter } from 'react-icons/lu';

export function ServicesForm() {
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="services-title">Service Title *</Label>
            <Input id="services-title" placeholder="e.g., Professional Web Development Services" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="services-description">Description *</Label>
            <Textarea
              id="services-description"
              placeholder="Describe your services in detail..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="services-category">Service Category</Label>
              <Input id="services-category" placeholder="e.g., IT, Cleaning, Tutoring" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services-price">Price (€/hour)</Label>
              <Input id="services-price" type="number" placeholder="e.g., 45" />
            </div>
          </div>

          {/* Placeholder for additional form fields */}
          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>Additional fields will be implemented here</p>
            <p className="text-xs mt-1">(Experience, Availability, Location, etc.)</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" size="lg">
            Save Draft
          </Button>
          <Button size="lg" className="ad-services hover:shadow-lg transition-all">
            Publish Ad
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
