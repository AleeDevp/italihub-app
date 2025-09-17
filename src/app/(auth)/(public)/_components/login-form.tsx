'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { useSession } from '@/lib/auth-client';
import { loginFormSchema } from '@/lib/schemas/auth_validation';
import { MailCheck } from 'lucide-react';

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const { refetch } = useSession(); // For refetching session after success

  const [error, setError] = useState(null as string | null);

  const [resendEmailActive, setResendEmailActive] = useState(false as boolean);
  const [resendEmailSuccess, setResendEmailSuccess] = useState(false as boolean);

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
    // Call inside a transition so isPendingSignIn updates correctly (React 19 requirement)
    startTransitionSignIn(async () => {
      const result = await signIn(values.email, values.password);
      if (result.success) {
        toast.success(result.message || 'Signed in successfully!');
        refetch();
        router.replace('/');
      }
      if (!result.success) {
        if (result.statusCode === 403) {
          console.log('Need to verify your email first!');
          setResendEmailActive(true);
          setError(result.message || 'Please verify your email.');
        } else setError(result.message);
      }
    });
  }

  const handleResendEmail = async () => {
    setError(null);
    setResendEmailSuccess(false);
    setResendEmailActive(false);
    // Call inside a transition so isPendingResend updates correctly (React 19 requirement)
    startTransitionResend(async () => {
      const result = await requestVerificationEmail(form.getValues('email'));
      if (result.success) {
        setResendEmailSuccess(true);
      } else {
        setError(result.message || 'Something went wrong, please try again later.');
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
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
