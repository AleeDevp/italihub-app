'use client';

import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client'; // Adjust path
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
      className="w-full"
      disabled={isSocialPending || disabled}
      onClick={() => handleGoogleSignIn()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          fill="currentColor"
        />
      </svg>
      <span className="sr-only">Login with Google</span>
    </Button>
  );
}
