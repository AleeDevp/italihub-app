import { BackButton } from '@/components/back-button';
import { PageLabel } from '@/components/page-label';
import { LockKeyhole } from 'lucide-react';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <PageLabel
        variant="vertical"
        icon={LockKeyhole}
        title="Forgot password"
        description="Enter your email address"
      />
      <BackButton />
      <ForgotPasswordForm />
    </div>
  );
}
