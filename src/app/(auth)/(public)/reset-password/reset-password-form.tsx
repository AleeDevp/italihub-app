'use client';

import { LoadingButton } from '@/components/loading-button';
import LoadingSpinner from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { authClient, authToasts } from '@/lib/auth/client';
import { passwordSchema } from '@/lib/schemas/auth_validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = form.watch('newPassword');
  const confirmPasswordValue = form.watch('confirmPassword');

  const meetsLengthRequirement = newPasswordValue.length >= 8;
  const passwordsMatch =
    confirmPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue;

  async function onSubmit({ newPassword }: ResetPasswordValues) {
    setSuccess(null);
    setError(null);

    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    if (error) {
      setError(error.message || 'Failed to reset password');
    } else {
      setSuccess('Password has been reset. You can now sign in.');
      authToasts.success('Password updated', {
        description: 'Your password has been reset successfully!',
      });
      setTimeout(() => router.push('/login'), 3000);
    }
  }

  const loading = form.formState.isSubmitting;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={loading}>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={loading || !!success}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Minimum of 8 characters. Mix letters, numbers, or symbols to keep it strong.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={loading || !!success}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className="rounded-lg border bg-background/80 p-4 text-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="mb-3 font-medium text-foreground/80">Quick checklist</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  {meetsLengthRequirement ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500" aria-hidden />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-muted-foreground" aria-hidden />
                  )}
                  <span className="text-muted-foreground">
                    {meetsLengthRequirement ? 'Length requirement met' : 'At least 8 characters'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500" aria-hidden />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-muted-foreground" aria-hidden />
                  )}
                  <span className="text-muted-foreground">
                    {passwordsMatch ? 'Passwords match' : 'Confirm password should match above'}
                  </span>
                </li>
              </ul>
            </div>

            {success && (
              <Alert variant="success">
                <AlertTitle>{success}</AlertTitle>
                <AlertDescription className="flex items-center animate-pulse" aria-live="polite">
                  Redirecting to login page…
                  <LoadingSpinner size="sm" variant="dots" className="text-green-500 pl-1" />
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="text-sm text-red-600">
                {error}
              </Alert>
            )}

            <LoadingButton
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!!success}
              aria-disabled={!!success || loading}
              aria-busy={loading}
            >
              Reset password
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
