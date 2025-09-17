import { getServerSession } from '@/lib/get-session';
import { cn } from '@/lib/utils';
import { forbidden, unauthorized } from 'next/navigation';
import { ReactNode } from 'react';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const user = session?.user;
  if (!user) unauthorized();

  if (user.role !== 'admin') forbidden();

  return (
    <div className={cn('min-h-screen ')}>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
