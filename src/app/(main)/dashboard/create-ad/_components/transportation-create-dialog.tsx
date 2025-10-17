'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmBeforeClose } from '@/hooks/use-confirm-before-close';

export function TransportationCreateDialog() {
  const { open, onOpenChange, markDirty, handleCancel, confirmDialog } = useConfirmBeforeClose();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="ad-transportation hover:shadow-lg transition-all">
          Start creating transportation ad
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl"
        disableOutsideClose
        disableEscapeClose
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Create transportation ad</DialogTitle>
          <DialogDescription>Fill out the details below to publish your listing.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4" onChange={markDirty}>
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

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="lg" className="ad-transportation hover:shadow-lg transition-all">
            Publish Ad
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
