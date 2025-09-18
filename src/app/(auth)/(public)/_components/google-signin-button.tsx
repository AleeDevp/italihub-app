'use client';

import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client'; // Adjust path
import Image from 'next/image';
import { useTransition } from 'react';
import { toast } from 'sonner';
export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const [isSocialPending, startSocialTransition] = useTransition();

  const handleGoogleSignIn = async () => {
    startSocialTransition(async () => {
      try {
        const { data, error } = await signIn.social(
          {
            provider: 'google',
            callbackURL: '/', // Redirect on success
            errorCallbackURL: '/signin?error=google-failed', // Redirect on error (optional; handle query params on sign-in page)
            newUserCallbackURL: '/welcome', // Redirect for new users (optional)
          },
          {
            onRequest: () => {
              toast.loading('Redirecting to Google...');
            },
            onSuccess: (ctx) => {
              toast.success('Signed in with Google successfully!');
              // No need for manual redirect; handled by callbackURL
            },
            onError: (ctx) => {
              toast.error(ctx.error.message || 'Google sign-in failed. Please try again.');
            },
          }
        );

        if (error) {
          // Fallback error handling if onError doesn't catch it
          toast.error(error.message || 'An unexpected error occurred.');
        }
        // else if (data) {
        //   // Additional success handling if needed
        //   console.log("User data:", data.user);
        // }
      } catch (err) {
        // Catch any unexpected errors (e.g., network)
        toast.error((err as Error).message || 'Failed to initiate Google sign-in.');
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
