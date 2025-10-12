'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCities } from '@/contexts/cities-context';
import type { VerificationMethod } from '@/generated/prisma';
import { VerificationStatus } from '@/generated/prisma';
import type { User } from '@/lib/auth/client';
import { cn } from '@/lib/utils';
import { humanize } from '@/lib/utils/enum-utils';
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
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
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
    submittedAt: string | Date;
    reviewedAt?: string | Date | null;
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

  // Sort history by submitted date (desc) and get the latest (prioritize PENDING, then most recent)
  const sortedHistory = useMemo(() => {
    const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d));
    return [...verificationHistory].sort(
      (a, b) => toDate(b.submittedAt).getTime() - toDate(a.submittedAt).getTime()
    );
  }, [verificationHistory]);

  const latestVerification =
    sortedHistory.length > 0
      ? sortedHistory.find((v) => v.status === VerificationStatus.PENDING) || sortedHistory[0]
      : null;

  const status: VerificationStatus | undefined = latestVerification?.status as
    | VerificationStatus
    | undefined;

  const getStatusIcon = (s: VerificationStatus | undefined) => {
    switch (s) {
      case VerificationStatus.APPROVED:
        return <ShieldCheck className="h-7 w-7 text-green-500" />;
      case VerificationStatus.PENDING:
        return <Clock className="h-7 w-7 text-yellow-500" />;
      case VerificationStatus.REJECTED:
        return <ShieldAlert className="h-7 w-7 text-red-500" />;
      default:
        return <Shield className="h-7 w-7 text-gray-500" />;
    }
  };

  const getStatusColor = (s: VerificationStatus | undefined) => {
    switch (s) {
      case VerificationStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case VerificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const canSubmitVerification = !latestVerification || status === VerificationStatus.REJECTED;
  const isRejected = status === VerificationStatus.REJECTED;
  const isPending = status === VerificationStatus.PENDING;
  const isVerified = status === VerificationStatus.APPROVED;

  const handleFormSuccess = () => {
    // Refresh the page to show the new pending status
    router.refresh();
  };

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
                    <div className="p-2 rounded-full inset-shadow-sm">{getStatusIcon(status)}</div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border rounded-lg px-6 py-3">
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
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">City</p>
                          <p className="text-muted-foreground">
                            {getCityName(latestVerification.cityId) || 'Unknown'}
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
                    </div>
                  </>
                )}

                {isVerified && latestVerification?.reviewedAt && (
                  <>
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

                {isRejected && (
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
          {sortedHistory.length > 0 && (
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
                  {sortedHistory.map((item) => (
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
                      {item.status === VerificationStatus.REJECTED &&
                        (item.rejectionCode || item.rejectionNote) && (
                          <div className="mt-3 rounded-md border border-red-200/70 bg-red-50/70 p-3 md:p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-full bg-red-100 p-1.5">
                                <ShieldAlert className="h-4 w-4 text-red-600" />
                              </div>
                              <div className="w-full">
                                <p className="text-sm font-medium text-red-800">
                                  Rejection details
                                </p>
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
    </div>
  );
}
