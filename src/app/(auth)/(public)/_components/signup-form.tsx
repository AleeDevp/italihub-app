'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { GoogleSignInButton } from '@/app/(auth)/(public)/_components/google-signin-button';
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
import { signUp } from '@/lib/actions/auth-actions';

import { LoadingSpinner } from '@/components/loading-spinner';
import { PasswordInput } from '@/components/ui/password-input';
import { signupFormSchema } from '@/lib/schemas/auth_validation';
import { cn } from '@/lib/utils';
import { MailCheck } from 'lucide-react';

import Image from 'next/image';

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  // const { refetch } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignupFormValues) {
    form.clearErrors();
    setError(null);
    // Use startTransition to properly handle the async action
    startTransition(async () => {
      const result = await signUp(values.email, values.password, values.name);
      if (result.success) {
        toast.success(result.message);
        setSuccess(result.message);
        // refetch();
        // router.replace('/');
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Join ItaliHub</h1>
                  <p className="text-muted-foreground text-balance">
                    Create your account to start your Italian journey
                  </p>
                </div>

                <div className="">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mario"
                            type="text"
                            {...field}
                            disabled={isPending || !!success}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mario.rossi@example.com"
                          type="email"
                          {...field}
                          disabled={isPending || !!success}
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isPending || !!success}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isPending || !!success}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <div className="text-sm text-red-400 text-center">{error}</div>}
                {success && (
                  <div className="flex flex-col gap-2 items-center justify-center text-sm text-green-400 text-center">
                    <MailCheck />
                    Please verify your email.
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isPending || !!success}>
                  {isPending ? <LoadingSpinner /> : 'Create account'}
                </Button>

                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>

                <div className="grid grid-rows-1 gap-4">
                  <GoogleSignInButton disabled={isPending || !!success} />
                </div>

                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
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
        By clicking "Create account", you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
