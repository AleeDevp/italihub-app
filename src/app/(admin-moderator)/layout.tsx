import { requireUser } from '@/lib/auth/server';
import { cn } from '@/lib/utils';
import { forbidden } from 'next/navigation';
import { ReactNode } from 'react';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  if (user.role === 'USER') forbidden();

  return (
    <div className={cn('min-h-screen ')}>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
