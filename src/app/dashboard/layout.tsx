import { getServerSession } from '@/lib/get-session';
import type { Metadata } from 'next';
import { unauthorized } from 'next/navigation';
import AppSidebar from './_component/app-sidebar';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  if (!session) {
    unauthorized();
  }

  return (
    <>
      <AppSidebar session={session} />
      <main>{children}</main>
    </>
  );
}
