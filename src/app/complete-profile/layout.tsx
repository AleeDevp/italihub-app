import { requireUser } from '@/lib/auth/server';
import React from 'react';
export default async function CompleteProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // if (user.isProfileComplete) {
  //   redirect('/dashboard');
  // }

  return <div className="px-4">{children}</div>;
}
