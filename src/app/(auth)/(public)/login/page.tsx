import { LoginForm } from '@/app/(auth)/(public)/_components/login-form';
import { BackButton } from '@/components/back-button';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <BackButton />
      <LoginForm />
    </div>
  );
}
