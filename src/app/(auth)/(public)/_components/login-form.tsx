'use client';

import { authToasts } from '@/lib/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { GoogleSignInButton } from '@/app/(auth)/(public)/_components/google-signin-button';
import { requestVerificationEmail } from '@/app/(auth)/(public)/actions';
import LoadingSpinner from '@/components/loading-spinner';
import { PasswordInput } from '@/components/ui/password-input';
import { signIn } from '@/lib/actions/auth-actions';
import { authErrorMessage } from '@/lib/auth/auth-errors';
import { useSession } from '@/lib/auth/client';
import { loginFormSchema } from '@/lib/schemas/auth_validation';
import { MailCheck } from 'lucide-react';
import Image from 'next/image';

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const { refetch } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [resendEmailActive, setResendEmailActive] = useState(false);
  const [resendEmailSuccess, setResendEmailSuccess] = useState(false);

  const [isPendingSignIn, startTransitionSignIn] = useTransition();
  const [isPendingResend, startTransitionResend] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    form.clearErrors();
    setError(null);
    setResendEmailActive(false);
    setResendEmailSuccess(false);

    startTransitionSignIn(async () => {
      const result = await signIn(values.email, values.password);

      if (result.ok) {
        authToasts.signedIn();
        refetch();
        router.replace('/');
        return;
      }

      if (!result.ok) {
        const { message: errorMessage, code } = result.error;

        // Check if email verification is required
        if (
          code === 'EMAIL_NOT_VERIFIED' ||
          errorMessage.toLowerCase().includes('verify your email')
        ) {
          setResendEmailActive(true);
          setError(errorMessage);
          authToasts.emailVerificationRequired();
        } else {
          setError(errorMessage);
          authToasts.signInFailed(errorMessage);
        }
      }
    });
  }

  const handleResendEmail = async () => {
    setError(null);
    setResendEmailSuccess(false);
    setResendEmailActive(false);

    startTransitionResend(async () => {
      const result = await requestVerificationEmail(form.getValues('email'));

      if (result.ok) {
        setResendEmailSuccess(true);
      } else {
        const message = authErrorMessage(result, 'Something went wrong, please try again later.');
        setError(message);
      }
    });
  };

  // Social login success typically redirects; errors are handled in handleSocialAuth

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                aria-busy={isPendingSignIn}
              >
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-balance">
                    Login to your ItaliHub account
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="user@example.com"
                          disabled={resendEmailSuccess || isPendingSignIn}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <a
                          href="/forgot-password"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <FormControl>
                        <PasswordInput
                          type="password"
                          placeholder="password123"
                          disabled={resendEmailSuccess || isPendingSignIn}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* // Show error message if any */}

                {error && (
                  <div className="flex flex-col items-center justify-center">
                    <p className=" text-sm text-red-400 text-center">{error}</p>
                    {resendEmailActive && (
                      <Button
                        type="button"
                        variant="link"
                        className="text-blue-400 text-[12px] underline "
                        onClick={handleResendEmail}
                      >
                        Haven't received it yet?
                      </Button>
                    )}
                  </div>
                )}
                {isPendingResend && <LoadingSpinner className="place-self-center" />}
                {resendEmailSuccess && (
                  <div className="flex flex-col items-center justify-center text-sm text-green-400 gap-2">
                    <MailCheck />
                    <p className="text-sm text-green-400">Verification email sent again</p>
                  </div>
                )}

                {/* Submit button */}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resendEmailSuccess || isPendingSignIn}
                  aria-disabled={resendEmailSuccess || isPendingSignIn}
                  aria-busy={isPendingSignIn}
                >
                  {isPendingSignIn ? <LoadingSpinner /> : 'Sign in'}
                </Button>

                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>

                <div className="grid grid-rows-1 gap-4">
                  <GoogleSignInButton disabled={resendEmailSuccess || isPendingSignIn} />
                </div>

                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </Form>
          </div>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth/group-people.png"
              alt="Login poster"
              fill={true}
              loading="eager"
              placeholder="blur"
              blurDataURL="/auth/group-people-blur.png"
              objectFit="cover"
              objectPosition="center"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
