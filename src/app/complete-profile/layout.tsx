import { requireUser } from '@/lib/auth';
import { unauthorized } from 'next/navigation';
import React from 'react';

export default async function CompleteProfileLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser();
  } catch {
    unauthorized();
  }
  return <div className="px-4">{children}</div>;
}
