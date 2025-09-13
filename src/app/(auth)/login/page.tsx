'use client';

import { BackButton } from '@/components/back-button';
import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  console.log('LoginPage - Auth state:', { isAuthenticated, isLoading });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('LoginPage - User already authenticated, redirecting to home');
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading or redirect if authenticated
  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  // Don't render login form if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-sm md:max-w-3xl">
      <BackButton />
      <LoginForm />
    </div>
  );
}
