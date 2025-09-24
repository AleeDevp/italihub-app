'use client';

import LoadingSpinner from '@/components/loading-spinner';
import { StatusTransition } from '@/components/transitions/status-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
// Contract
// Inputs: status ('loading' | 'success' | 'error'), optional texts, and handlers
// Output: A minimal white card matching the provided design (same in light/dark)
// Error modes: none (pure UI)

type Status = 'idle' | 'loading' | 'success' | 'error';

interface SubmissionStatusCardProps {
  status: Status;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onRetry?: () => void;
  onBackHome?: () => void;
  onGoDashboard?: () => void;
}

export function SubmissionStatusCard({
  status,
  loadingText = 'We are submitting your profile...',
  successText = 'Yayy, All done 🎉',
  errorText,
  onRetry,
  onBackHome,
  onGoDashboard,
}: SubmissionStatusCardProps) {
  const baseCard = 'w-full md:min-w-[25rem] max-w-md overflow-hidden';

  if (status === 'loading') {
    return (
      <StatusTransition status="loading">
        <Card className={baseCard}>
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center">
              <LoadingSpinner variant="ring" size="xl" />
            </div>
            <p className="text-sm text-gray-500">{loadingText}</p>
          </CardContent>
        </Card>
      </StatusTransition>
    );
  }

  if (status === 'success') {
    return (
      <StatusTransition status="success">
        <Card className={`{${baseCard} h-150 relative bg-transparent`}>
          <CardContent className="flex flex-col justify-end items-center gap-2 text-center h-2/5">
            <div className="">
              <h3 className="text-4xl font-semibold text-white">{successText}</h3>
            </div>
            <p className="mt-2 text-white">let's go create your first post!</p>
            {onGoDashboard && (
              <Button
                type="button"
                variant="outline"
                onClick={onGoDashboard}
                className="cursor-pointer rounded-full px-6 py-5 text-base mt-1"
              >
                My dashboard
              </Button>
            )}
          </CardContent>
          <Image
            src="/complete-profile/completeProfile-onSuccess.png"
            alt="teens celebrating"
            fill
            priority={true}
            draggable={false}
            className="absolute object-cover -z-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent -z-10" />
        </Card>
      </StatusTransition>
    );
  }

  // Error
  return (
    <StatusTransition status="error">
      <Card className={baseCard} aria-live="assertive">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center ">
            <Image
              src="/rejected.png"
              alt="error"
              width={80}
              height={80}
              priority={true}
              draggable={false}
              className="inset-0 object-contain"
            />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Ooops! 😭</h3>
            <p className="mt-1 text-md text-gray-500">{errorText} </p>
          </div>
          <div className="mt-1 flex flex-col items-center gap-3">
            {onRetry && (
              <Button
                type="button"
                onClick={onRetry}
                className="rounded-full bg-red-600 px-6 py-5 text-base text-white shadow-sm hover:bg-red-500 cursor-pointer"
              >
                Try again
              </Button>
            )}
            {onBackHome && (
              <button
                type="button"
                onClick={onBackHome}
                className="text-sm text-gray-500 underline underline-offset-2 cursor-pointer"
              >
                Back to home
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </StatusTransition>
  );
}
