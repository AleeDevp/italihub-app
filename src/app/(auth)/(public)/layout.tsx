import { getCurrentUser } from '@/lib/auth';
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
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-6 md:p-10">
        {children}
      </div>
    </main>
  );
}
