'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCities } from '@/contexts/cities-context';
import type { VerificationMethod, VerificationStatus } from '@/generated/prisma';
import { User } from '@/lib/auth';
import { Enum, humanize } from '@/lib/enums';
import { resolveImageUrl } from '@/lib/image-utils-client';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { VerificationForm } from './verification-form';
import { VerificationMethodsGuide } from './verification-methods-guide';
import { VerificationStepper } from './verification-stepper';

interface VerificationLayoutProps {
  user: User;

  verificationHistory: {
    id: number;
    status: VerificationStatus;
    method: VerificationMethod;
    cityId: number;
    submittedAt: Date;
    reviewedAt?: Date | null;
    rejectionCode?: string | null;
    rejectionNote?: string | null;
    filesCount: number;
  }[];
}

export function VerificationLayout({ user, verificationHistory }: VerificationLayoutProps) {
  const router = useRouter();
  const cities = useCities();
  const getCityName = useCallback(
    (id?: number | null) => {
      if (!id) return '';
      const c = cities.find((x) => x.id === id);
      return c?.name ?? '';
    },
    [cities]
  );
  const [isViewingDocuments, setIsViewingDocuments] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Get the latest verification (prioritize PENDING, then most recent)
  const latestVerification =
    verificationHistory.length > 0
      ? verificationHistory.find((v) => v.status === 'PENDING') || verificationHistory[0]
      : null;

  const status: VerificationStatus | undefined = latestVerification?.status as
    | VerificationStatus
    | undefined;

  const getStatusIcon = (s: VerificationStatus | undefined) => {
    switch (s) {
      case Enum.VerificationStatus.APPROVED:
        return <ShieldCheck className="h-6 w-6 text-green-500" />;
      case Enum.VerificationStatus.PENDING:
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case Enum.VerificationStatus.REJECTED:
        return <ShieldAlert className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (s: VerificationStatus | undefined) => {
    switch (s) {
      case Enum.VerificationStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case Enum.VerificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case Enum.VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const canSubmitVerification = !latestVerification || status === Enum.VerificationStatus.REJECTED;
  const isRejected = status === Enum.VerificationStatus.REJECTED;
  const isPending = status === Enum.VerificationStatus.PENDING;
  const isVerified = status === Enum.VerificationStatus.APPROVED;

  const handleFormSuccess = () => {
    // Refresh the page to show the new pending status
    router.refresh();
  };

  // Memoized fetch function - only creates new function when verification ID changes
  const fetchStorageKey = useCallback(async () => {
    if (!latestVerification?.id) return null;

    try {
      const response = await fetch(`/api/verification/${latestVerification.id}/storage-keys`);
      if (response.ok) {
        const data = await response.json();
        return data.storageKey || null;
      } else {
        console.error('Failed to fetch verification storage key');
        toast.error('Failed to load verification document. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching verification file:', error);
      toast.error('Failed to load verification document. Please check your connection.');
      return null;
    }
  }, [latestVerification?.id]);

  // const handleViewDocuments = useCallback(async () => {
  //   if (!latestVerification) return;

  //   setIsViewingDocuments(true);

  //   // Only fetch if we don't already have the storage key
  //   if (!storageKey) {
  //     setIsLoadingFiles(true);
  //     try {
  //       const key = await fetchStorageKey();
  //       setStorageKey(key);
  //     } finally {
  //       setIsLoadingFiles(false);
  //     }
  //   }
  // }, [latestVerification, storageKey, fetchStorageKey]);

  // Memoized image URL - only recalculates when storageKey changes
  const imageUrl = useMemo(() => {
    if (!storageKey) return '/placeholder-image.png';
    return resolveImageUrl(storageKey, { width: 800 }) || '/placeholder-image.png';
  }, [storageKey]);

  return (
    <div>
      {/* Two-column layout for lg+ screens, single column for mobile */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content Column (8/12 on lg+) */}
        <div className="lg:col-span-8 space-y-6 order-first">
          {/* Main Verification Status Card */}
          <Card>
            <CardHeader className="space-y-5">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification process
              </CardTitle>
              {/* Verification Steps Indicator */}
              <VerificationStepper verificationStatus={latestVerification?.status || null} />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status Section */}
              <div className="border rounded-2xl py-6 px-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">{getStatusIcon(status)}</div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isVerified
                          ? 'Verified Account'
                          : isPending
                            ? 'Verification Pending'
                            : 'Not Verified'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isVerified
                          ? 'Your account has been successfully verified'
                          : isPending
                            ? 'Your verification request is being reviewed'
                            : 'Complete verification to unlock all features'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(status)}>
                    {status ? humanize(status) : 'Not Started'}
                  </Badge>
                </div>

                {latestVerification && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Method</p>
                          <p className="text-muted-foreground">
                            {humanize(latestVerification.method)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Submitted</p>
                          <p className="text-muted-foreground">
                            {formatDate(latestVerification.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">City</p>
                          <p className="text-muted-foreground">
                            {getCityName(user.cityId) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Files</p>
                          <p className="text-muted-foreground">
                            {latestVerification.filesCount} file
                            {latestVerification.filesCount !== 1 ? 's' : ''} uploaded
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isVerified && latestVerification?.reviewedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Verification Approved</p>
                        <p className="text-green-700">
                          Approved on {formatDate(latestVerification.reviewedAt)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {status === Enum.VerificationStatus.REJECTED && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="text-sm flex-1">
                        <p className="font-medium text-red-800">Verification Rejected</p>
                        {latestVerification?.rejectionNote && (
                          <p className="text-red-700 mt-1">{latestVerification.rejectionNote}</p>
                        )}
                        <p className="text-red-600 mt-2 text-xs">
                          You can submit a new verification request with updated documents.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              {/* {latestVerification && (
                <div className="flex gap-3 pt-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewDocuments}
                    disabled={isLoadingFiles}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )} */}
            </CardContent>
          </Card>

          {/* Submit Verification Form - Only show if can submit */}
          {canSubmitVerification && (
            <>
              <VerificationMethodsGuide />
              <VerificationForm onSuccess={handleFormSuccess} />
            </>
          )}

          {/* Verification History */}
          {verificationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Verification History
                </CardTitle>
                <CardDescription>View all your previous verification attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationHistory.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative flex-col  items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-background inset-shadow-sm">
                          {getStatusIcon(item.status)}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">{getCityName(item.cityId)}</h4>
                            <h3>{humanize(item.method)}</h3>
                          </div>

                          <div className="mt-2 flex flex-wrap text-neutral-400 space-x-4 space-y-2 ">
                            <p className="text-xs">
                              Submitted on <br /> {formatDate(item.submittedAt)}
                            </p>
                            {item.reviewedAt && (
                              <p className="text-xs">
                                Reviewed on <br /> {formatDate(item.reviewedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.status === 'REJECTED' && (item.rejectionCode || item.rejectionNote) && (
                        <div className="mt-3 rounded-md border border-red-200/70 bg-red-50/70 p-3 md:p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-red-100 p-1.5">
                              <ShieldAlert className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="w-full">
                              <p className="text-sm font-medium text-red-800">Rejection details</p>
                              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                                {item.rejectionCode && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-red-700/80">Code</p>
                                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                      {item.rejectionCode}
                                    </span>
                                  </div>
                                )}
                                {item.rejectionNote && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-red-700/80">Moderator note</p>
                                    <p className="whitespace-pre-line break-words text-sm text-red-700">
                                      {item.rejectionNote}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(getStatusColor(item.status), 'absolute right-4 top-4')}
                        >
                          {humanize(item.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column (4/12 on lg+)*/}
        <div className="w-full lg:col-span-4 space-y-6 order-last">
          {/* Verification Benefits */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Benefits of Verification
              </CardTitle>
              <CardDescription>
                Unlock premium features and build trust with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Verified Badge</h4>
                    <p className="text-xs text-muted-foreground">
                      Display a verification badge on your profile and listings
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Enhanced Trust</h4>
                    <p className="text-xs text-muted-foreground">
                      Build credibility with other users and increase response rates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <FileCheck className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Priority Support</h4>
                    <p className="text-xs text-muted-foreground">
                      Get faster response times from our support team
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Security</h4>
                    <p className="text-xs text-muted-foreground">
                      Protect your account with additional security measures
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-pink-100">
                    <MapPin className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Location Verified</h4>
                    <p className="text-xs text-muted-foreground">
                      Confirm your city location for better local connections
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Early Access</h4>
                    <p className="text-xs text-muted-foreground">
                      Get early access to new features and updates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Documents Dialog */}
      <Dialog open={isViewingDocuments} onOpenChange={setIsViewingDocuments}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Verification Document
            </DialogTitle>
            <DialogDescription>
              {latestVerification && (
                <>
                  Submitted on {formatDate(latestVerification.submittedAt)} •
                  {humanize(latestVerification.method)} •{humanize(latestVerification.status)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading documents...</span>
              </div>
            ) : storageKey ? (
              <div className="overflow-hidden">
                <div>
                  <div className="flex items-center justify-between"></div>
                </div>
                <div>
                  <div className="relative w-full">
                    <Image
                      src={imageUrl}
                      alt="Verification document"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-96 object-cover rounded-sm bg-muted/50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No document found</p>
                <p className="text-sm text-muted-foreground">
                  This verification request does not have an uploaded file.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
