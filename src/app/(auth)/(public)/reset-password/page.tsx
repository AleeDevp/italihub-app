import { PageLabel } from '@/components/page-label';
import { Alert } from '@/components/ui/alert';
import { KeyRound } from 'lucide-react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password',
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (token) return <ResetPasswordUI token={token} />;
  else {
    return (
      <Alert role="alert" className="w-[320px]">
        Token is missing.
      </Alert>
    );
  }
}

interface ResetPasswordUIProps {
  token: string;
}

function ResetPasswordUI({ token }: ResetPasswordUIProps) {
  return (
    <div className="w-full space-y-10">
      <PageLabel
        variant="vertical"
        icon={KeyRound}
        title="Reset password"
        description="Enter your new password below."
      />
      <ResetPasswordForm token={token} />
    </div>
  );
}
