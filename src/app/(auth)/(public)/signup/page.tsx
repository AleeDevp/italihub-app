import { SignupForm } from '@/app/(auth)/(public)/_components/signup-form';
import { BackButton } from '@/components/back-button';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign up' };

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <BackButton />
      <SignupForm />
    </div>
  );
}
