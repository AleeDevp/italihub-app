'use client';

import { LoadingButton } from '@/components/loading-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { authClient } from '@/lib/auth/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit({ email }: ForgotPasswordValues) {
    setSuccess(null);
    setError(null);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    if (error) {
      setError(error.message || 'Failed to send reset email');
    } else {
      setSuccess("If an account exists for this email, you'll receive a password reset link.");
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      disabled={loading || !!success}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!error && !success && (
              <p className="text-sm text-muted-foreground">
                we&apos;ll send you a link to reset your password.
              </p>
            )}
            {success && (
              <Alert variant="success">
                <AlertTitle>Password reset link sent!</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="text-sm text-red-400">
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
              Send reset link
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
