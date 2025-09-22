'use client';

import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, XCircle } from 'lucide-react';

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
  errorText = 'Ooops! 😭',
  onRetry,
  onBackHome,
  onGoDashboard,
}: SubmissionStatusCardProps) {
  const baseCard = 'w-full max-w-md overflow-hidden rounded-4xl';

  if (status === 'loading') {
    return (
      <Card className={baseCard}>
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center">
            <LoadingSpinner variant="ring" size="xl" />
          </div>
          <p className="text-sm text-gray-500">{loadingText}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className={baseCard}>
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center ">
            <ThumbsUp className="h-9 w-9 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">{successText}</h3>
            <p className="mt-2 text-gray-500">Go to your dashboard to create your first post!</p>
          </div>
          {onGoDashboard && (
            <Button
              type="button"
              onClick={onGoDashboard}
              className=" rounded-full bg-primary px-6 py-5 text-base shadow-sm hover:bg-primary/70"
            >
              My dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error
  return (
    <Card className={baseCard} aria-live="assertive">
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center ">
          <XCircle className="h-9 w-9 text-red-600" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{errorText}</h3>
          <p className="mt-1 text-sm text-gray-500">Something went wrong</p>
        </div>
        <div className="mt-1 flex flex-col items-center gap-2">
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-red-600 px-6 py-5 text-base text-white shadow-sm hover:bg-red-600"
            >
              Try again
            </Button>
          )}
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="text-sm text-gray-500 underline underline-offset-2"
            >
              Back to home
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
