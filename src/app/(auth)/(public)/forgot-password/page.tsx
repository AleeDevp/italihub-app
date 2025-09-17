import { BackButton } from '@/components/back-button';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm md:max-w-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-muted-foreground">Enter your email address</p>
      </div>
      <BackButton />
      <ForgotPasswordForm />
    </div>
  );
}
