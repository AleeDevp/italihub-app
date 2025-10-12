import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (user) {
    // You can also redirect to a login page or show an error
    redirect('/dashboard');
  }

  return (
    <main>
      <div className="flex min-h-svh items-center justify-center px-4">{children}</div>
    </main>
  );
}
