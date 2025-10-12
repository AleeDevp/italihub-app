'use client';

import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { authToasts, signIn } from '@/lib/auth/client';
import Image from 'next/image';
import { useTransition } from 'react';

export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const [isSocialPending, startSocialTransition] = useTransition();

  const handleGoogleSignIn = async () => {
    startSocialTransition(async () => {
      try {
        const { data, error } = await signIn.social(
          {
            provider: 'google',
            callbackURL: '/',
            errorCallbackURL: '/signin?error=google-failed',
            newUserCallbackURL: '/welcome',
          },
          {
            onRequest: () => {
              authToasts.loading('Redirecting to Google...');
            },
            onSuccess: () => {
              authToasts.dismiss();
              authToasts.signedIn();
            },
            onError: (ctx: any) => {
              authToasts.dismiss();
              const errorMessage = ctx?.error?.message || 'Failed to sign in with Google';
              authToasts.signInFailed(errorMessage);
            },
          }
        );

        if (error) {
          authToasts.dismiss();
          const errorMessage = error.message || 'Failed to sign in with Google';
          authToasts.signInFailed(errorMessage);
        }
      } catch (err) {
        authToasts.dismiss();
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        authToasts.signInFailed(errorMessage);
      }
    });
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full h-fit py-3"
      disabled={isSocialPending || disabled}
      onClick={() => handleGoogleSignIn()}
    >
      {isSocialPending ? (
        <LoadingSpinner />
      ) : (
        <>
          <Image src="/icons/google.svg" alt="Logo" width={20} height={20} />
          <span className="sr-only">Login with Google</span>
        </>
      )}
    </Button>
  );
}
