'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight, Bell, CheckCircle2, Clock, Eye, FileEdit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: number;
}

export function AdSuccessDialog({ open, onOpenChange, adId }: AdSuccessDialogProps) {
  const router = useRouter();

  const handleGoToManagement = () => {
    onOpenChange(false);
    router.push('/dashboard/ads-management');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] overflow-hidden border-4 border-card p-0">
        {/* Success Header with gradient background */}
        <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-6 pt-8 rounded-b-2xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

          <DialogHeader className="relative space-y-2">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                  <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-semibold text-white drop-shadow-sm">
              Successfully Submitted!
            </DialogTitle>
            <div className="text-center text-sm text-white/90 max-w-sm mx-auto pb-6">
              Your housing ad is now pending review and will be published soon.
            </div>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="px-6 py-1 space-y-2">
          {/* Review Time Badge */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 rounded-full border border-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
            <span className="text-xs font-medium text-slate-700">
              Review time: less than 1 hour
            </span>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">What happens next?</h4>
            <div className="space-y-2">
              <div className="flex gap-3 items-start group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Eye className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Quality review to ensure standards
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Published and visible to all users
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <FileEdit className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Edit or manage anytime in Ads Management
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Bell className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Get notified when status changes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 pb-6 pt-0 gap-4 sm:gap-4">
          <Button variant="outline" onClick={handleClose} className="sm:flex-1">
            Close
          </Button>
          <Button onClick={handleGoToManagement} className="sm:flex-1">
            Ads Management
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
