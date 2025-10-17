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

export function MarketCreateDialog() {
  const { open, onOpenChange, markDirty, handleCancel, confirmDialog } = useConfirmBeforeClose();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="ad-marketplace hover:shadow-lg transition-all">
          Start creating market ad
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl"
        disableOutsideClose
        disableEscapeClose
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Create market ad</DialogTitle>
          <DialogDescription>Fill out the details below to publish your listing.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4" onChange={markDirty}>
          <div className="space-y-2">
            <Label htmlFor="market-title">Product Title *</Label>
            <Input id="market-title" placeholder="e.g., iPhone 14 Pro - Excellent Condition" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="market-description">Description *</Label>
            <Textarea
              id="market-description"
              placeholder="Describe your product in detail..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market-category">Product Category</Label>
              <Input id="market-category" placeholder="e.g., Electronics, Clothing" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-price">Price (€)</Label>
              <Input id="market-price" type="number" placeholder="e.g., 850" />
            </div>
          </div>

          {/* Placeholder for additional form fields */}
          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>Additional fields will be implemented here</p>
            <p className="text-xs mt-1">(Condition, Brand, Quantity, Shipping, etc.)</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="lg" className="ad-marketplace hover:shadow-lg transition-all">
            Publish Ad
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
