'use client';

import { DEFAULT_AD_DETAIL_VARIANT } from '@/components/ad-details/types';
import { HousingDialog } from '@/components/ad-forms/housing/housing-dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AD_CATEGORY_BY_ID } from '@/constants/ad-categories';
import { AD_DETAIL_COMPONENTS } from '@/constants/ad-detail-components';
import type { AdWithDetails, AdWithHousing } from '@/data/ads/ads';
import type { AdCategory, AdStatus } from '@/generated/prisma';
import { deleteHousingAdAction } from '@/lib/actions/housing-ad-actions';
import { formatDaysLeftLabel, getExpirationColor, getExpirationDetails } from '@/lib/ad-utils';
import { cn, formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';

interface AdDetailContentProps {
  ad: AdWithDetails;
}

const getPatternColor = (category: AdCategory) => {
  const colorMap: Record<AdCategory, string> = {
    HOUSING: 'text-emerald-400',
    TRANSPORTATION: 'text-violet-400',
    MARKETPLACE: 'text-amber-400',
    SERVICES: 'text-sky-400',
    CURRENCY: 'text-yellow-400',
  };
  return colorMap[category] || 'text-slate-400';
};

const getStatusConfig = (status: AdStatus) => {
  const configs: Record<
    AdStatus,
    {
      title: string;
      description: string;
      icon: typeof CheckCircle2;
      bgColor: string;
      borderColor: string;
      iconBgColor: string;
      iconColor: string;
      button?: { label: string; action: string };
    }
  > = {
    ONLINE: {
      title: 'Published',
      description: 'Your ad is live and visible to all users on the platform.',
      icon: CheckCircle2,
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      iconBgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    PENDING: {
      title: 'Under Review',
      description:
        'Your ad is being reviewed by our moderation team. This usually takes 24-48 hours.',
      icon: Clock,
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      borderColor: 'border-amber-200',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    REJECTED: {
      title: 'Rejected',
      description: 'Your ad did not meet our community guidelines and was rejected.',
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-br from-rose-50 to-red-50',
      borderColor: 'border-rose-200',
      iconBgColor: 'bg-rose-100',
      iconColor: 'text-rose-600',
      button: { label: 'Review & Resubmit', action: 'resubmit' },
    },
    EXPIRED: {
      title: 'Expired',
      description: 'Your ad has reached its expiration date and is no longer visible.',
      icon: CalendarX,
      bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
      borderColor: 'border-gray-200',
      iconBgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
      button: { label: 'Renew', action: 'renew' },
    },
  };
  return configs[status];
};

export function AdDetailContent({ ad }: AdDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryMeta = AD_CATEGORY_BY_ID[ad.category];
  const Icon = categoryMeta?.icon;
  const expirationDetails = ad.expirationDate ? getExpirationDetails(ad.expirationDate) : null;
  const statusConfig = getStatusConfig(ad.status);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogInitialStep, setEditDialogInitialStep] = useState<number | undefined>(undefined);

  // Delete state management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isPendingDelete, startDeleteTransition] = useTransition();

  /**
   * Get Edit button configuration based on ad status
   * Memoized to avoid recalculation on every render
   */
  const editButtonConfig = useMemo(() => {
    switch (ad.status) {
      case 'PENDING':
        return {
          text: 'Edit',
          disabled: true,
          icon: Edit,
          initialStep: undefined,
        };
      case 'REJECTED':
        return {
          text: 'Review & Resubmit',
          disabled: false,
          icon: Edit,
          initialStep: undefined,
        };
      case 'EXPIRED':
        return {
          text: 'Renew',
          disabled: false,
          icon: RefreshCcw,
          initialStep: 2, // Open on Availability step (step index 2)
        };
      case 'ONLINE':
      default:
        return {
          text: 'Edit',
          disabled: false,
          icon: Edit,
          initialStep: undefined,
        };
    }
  }, [ad.status]);

  /**
   * Handles opening the edit dialog with the appropriate initial step
   */
  const handleOpenEditDialog = useCallback((initialStep?: number) => {
    setEditDialogInitialStep(initialStep);
    setEditDialogOpen(true);
  }, []);

  const renderCategoryDetails = () => {
    const renderer = AD_DETAIL_COMPONENTS[ad.category];
    if (!renderer) return null;

    return renderer({
      ad,
      variant: DEFAULT_AD_DETAIL_VARIANT,
      showContactButton: false,
      showEditButton: false, // Edit button is in the header
    });
  };

  /**
   * Handles the delete button click - shows confirmation dialog
   */
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  /**
   * Handles the confirmed deletion
   * - Shows loading dialog
   * - Calls delete action
   * - Invalidates cache and redirects on success
   * - Shows error dialog on failure
   */
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setShowDeleteLoading(true);
    setDeleteError('');

    startDeleteTransition(async () => {
      try {
        // Only call delete action for housing ads
        if (ad.category !== 'HOUSING') {
          setDeleteError('Delete functionality is only available for housing ads at this time.');
          setShowDeleteLoading(false);
          setShowDeleteError(true);
          return;
        }

        const result = await deleteHousingAdAction(ad.id);

        if (result.success) {
          // Invalidate the user-ads cache to trigger refetch
          await queryClient.invalidateQueries({ queryKey: ['user-ads'] });

          // Small delay to ensure cache invalidation completes
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Redirect to ads management page
          router.push('/dashboard/ads-management');
        } else {
          // Show error dialog
          setDeleteError(result.error);
          setShowDeleteLoading(false);
          setShowDeleteError(true);
        }
      } catch (error) {
        console.error('Unexpected error during deletion:', error);
        setDeleteError('An unexpected error occurred. Please try again.');
        setShowDeleteLoading(false);
        setShowDeleteError(true);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Actions */}
      <div className="sticky  top-12 md:top-12 z-40 bg-white border-b shadow-xs py-3 px-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Ads list
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={cn(
                'gap-2',
                editButtonConfig.disabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => handleOpenEditDialog(editButtonConfig.initialStep)}
              disabled={editButtonConfig.disabled || isPendingDelete}
            >
              <editButtonConfig.icon className="w-4 h-4" />
              {editButtonConfig.text}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDeleteClick}
              disabled={isPendingDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Windows Layout */}
      <div className="mt-4 space-y-4 mb-6">
        {/* Status Window - Full Width Top */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Status</h2>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border p-4',
              statusConfig.bgColor,
              statusConfig.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-xl', statusConfig.iconBgColor)}>
                  <statusConfig.icon className={cn('w-5 h-5', statusConfig.iconColor)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{statusConfig.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                    {statusConfig.description}
                  </p>

                  {/* Rejection Details */}
                  {ad.status === 'REJECTED' && (
                    <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/60 border border-rose-200">
                      <div>
                        <p className="text-xs text-rose-600 font-medium mb-1">Reason</p>
                        <p className="text-sm font-medium text-gray-900">Policy Violation</p>
                      </div>
                      <div>
                        <p className="text-xs text-rose-600 font-medium mb-1">Rejected On</p>
                        <p className="text-sm text-gray-600">{formatDate(ad.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {statusConfig.button && (
                <Button
                  size="sm"
                  className={cn(
                    'h-9 text-sm font-medium',
                    ad.status === 'REJECTED'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  )}
                  onClick={() => handleOpenEditDialog(editButtonConfig.initialStep)}
                >
                  {ad.status === 'EXPIRED' ? (
                    <RefreshCcw className="w-4 h-4 mr-2" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  {statusConfig.button.label}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Category Info Window - Full Width with Performance Inside */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Ad Information</h2>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border',
              categoryMeta?.bgPrimaryColor
            )}
          >
            {/* Background Pattern */}
            {Icon && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div
                  className="absolute -right-8 -top-8 w-[500px] h-[500px] rotate-12"
                  style={{
                    maskImage:
                      'radial-gradient(ellipse 140% 100% at top right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 75%)',
                    WebkitMaskImage:
                      'radial-gradient(ellipse 140% 100% at top right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 75%)',
                  }}
                >
                  <div className={cn('relative w-full h-full', getPatternColor(ad.category))}>
                    {Array.from({ length: 40 }).map((_, i) => (
                      <Icon
                        key={i}
                        className="absolute"
                        style={{
                          width: '40px',
                          height: '40px',
                          left: `${(i % 5) * 80 + 12}px`,
                          top: `${Math.floor(i / 5) * 60 + 12}px`,
                        }}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="relative p-6 grid grid-cols-3 gap-6">
              {/* Performance Window - Left 1/3 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Performance</h3>

                {/* Views */}
                <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Views</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-0.5">{ad.viewsCount}</p>
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <MousePointerClick className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Contacts</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-0.5">
                        {ad.contactClicksCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics Button */}
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm font-medium bg-white/90 hover:bg-white border-gray-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>

              {/* Category & Date Info - Right 2/3 */}
              <div className="col-span-2 space-y-4">
                {/* Category */}
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md',
                        categoryMeta?.bgSecondaryColor
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Category</p>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {categoryMeta?.name ?? ad.category.toLowerCase()}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Posted Date */}
                  <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium mb-1">Posted</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(ad.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.floor(
                            (new Date().getTime() - new Date(ad.createdAt).getTime()) / 86400000
                          )}{' '}
                          days ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expiration Date */}
                  {ad.expirationDate && expirationDetails && (
                    <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-50">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium mb-1">Expires</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(ad.expirationDate)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold mt-2',
                              getExpirationColor(expirationDetails.daysLeft)
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {formatDaysLeftLabel(expirationDetails.daysLeft)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category-specific details */}
      <div className="-mt-2">{renderCategoryDetails()}</div>

      {/* Edit Dialog - Only render for housing ads */}
      {ad.category === 'HOUSING' && 'housing' in ad && ad.housing && (
        <HousingDialog
          mode="edit"
          initialData={ad as AdWithHousing}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          initialStep={editDialogInitialStep}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete this ad?"
        description={
          <>
            This action cannot be undone. This will permanently delete your ad and remove all
            associated images from our servers.
            <br />
            <br />
            <span className="text-destructive font-medium">
              Are you sure you want to delete this ad?
            </span>
          </>
        }
        confirmText="Yes, delete ad"
        cancelText="Cancel"
        confirmVariant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {/* Delete Loading Dialog */}
      <Dialog open={showDeleteLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Deleting ad...
            </DialogTitle>
            <DialogDescription>
              Please wait while we delete your ad and remove all associated images. This may take a
              moment.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Delete Error Dialog */}
      <Dialog open={showDeleteError} onOpenChange={setShowDeleteError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed to delete ad
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p className="text-sm text-gray-700 mb-4">{deleteError}</p>
              <Button
                onClick={() => setShowDeleteError(false)}
                className="w-full"
                variant="outline"
              >
                Try Again Later
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
