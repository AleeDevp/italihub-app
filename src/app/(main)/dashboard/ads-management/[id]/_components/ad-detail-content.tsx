'use client';

import { DEFAULT_AD_DETAIL_VARIANT } from '@/components/ad-details/types';
import { HousingDialog } from '@/components/ad-forms/housing/housing-dialog';
import { OptimizedImage } from '@/components/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Info,
  Loader2,
  MapPin,
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header with Actions */}
      <div className="sticky top-12 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm py-3 px-4 -mx-4 md:mx-0 md:rounded-b-xl transition-all duration-200">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Status & Key Actions (1/3) */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={cn('border-l-4 shadow-sm', statusConfig.borderColor)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-full', statusConfig.iconBgColor)}>
                  <statusConfig.icon className={cn('w-5 h-5', statusConfig.iconColor)} />
                </div>
                <span className={cn('text-lg font-bold', statusConfig.iconColor)}>
                  {statusConfig.title}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{statusConfig.description}</p>

              {/* Rejection Details */}
              {ad.status === 'REJECTED' && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                  <p className="text-xs font-bold text-red-700 uppercase mb-1">Reason</p>
                  <p className="text-sm text-red-600">Policy Violation</p>
                  <p className="text-xs text-red-500 mt-1">
                    Rejected on {formatDate(ad.updatedAt)}
                  </p>
                </div>
              )}

              {statusConfig.button && (
                <Button
                  className="w-full"
                  variant={ad.status === 'REJECTED' ? 'destructive' : 'default'}
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
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total Views</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{ad.viewsCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Contacts</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{ad.contactClicksCount}</span>
              </div>
              <Button variant="outline" className="w-full text-xs h-8">
                <BarChart3 className="w-3 h-3 mr-2" />
                Detailed Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ad Details (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm overflow-hidden border-0 ring-1 ring-gray-200">
            <div className="relative h-32 bg-gradient-to-r from-gray-100 to-gray-200">
              {/* Background Pattern or Cover Blur */}
              {ad.coverMedia && (
                <div className="absolute inset-0">
                  <OptimizedImage
                    storageKey={ad.coverMedia.storageKey}
                    imageType="cover"
                    alt="Cover Background"
                    className="w-full h-full object-cover opacity-50 blur-sm"
                  />
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent" />
            </div>

            <CardContent className="relative pt-0 px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start gap-6 -mt-12">
                {/* Main Image / Icon */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center shrink-0">
                  {ad.coverMedia ? (
                    <OptimizedImage
                      storageKey={ad.coverMedia.storageKey}
                      imageType="thumbnail"
                      alt="Ad Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-full h-full flex items-center justify-center',
                        categoryMeta?.bgSecondaryColor
                      )}
                    >
                      {Icon && <Icon className="w-12 h-12 text-white" />}
                    </div>
                  )}
                </div>

                {/* Title & Meta */}
                <div className="flex-1 pt-2 sm:pt-12 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="hover:bg-gray-200 transition-colors">
                      {categoryMeta?.name}
                    </Badge>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {ad.city.name}
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {categoryMeta?.name} Ad #{ad.id}
                  </h1>
                  <p className="text-sm text-gray-500">Created on {formatDate(ad.createdAt)}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    General Info
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Category</dt>
                      <dd className="font-medium text-gray-900">{categoryMeta?.name}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Location</dt>
                      <dd className="font-medium text-gray-900">{ad.city.name}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Ad ID</dt>
                      <dd className="font-medium text-gray-900 font-mono text-xs">#{ad.id}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Timeline
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Posted</dt>
                      <dd className="font-medium text-gray-900">{formatDate(ad.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="font-medium text-gray-900">{formatDate(ad.updatedAt)}</dd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <dt className="text-gray-500">Expires</dt>
                      <dd
                        className={cn(
                          'font-medium',
                          ad.expirationDate ? 'text-gray-900' : 'text-gray-400'
                        )}
                      >
                        {ad.expirationDate ? formatDate(ad.expirationDate) : 'Never'}
                      </dd>
                    </div>
                    {ad.expirationDate && expirationDetails && (
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'w-full justify-center py-1 border-0 bg-gray-50',
                            getExpirationColor(expirationDetails.daysLeft)
                          )}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDaysLeftLabel(expirationDetails.daysLeft)}
                        </Badge>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Specific Content */}
      <div className="pt-2">{renderCategoryDetails()}</div>

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
