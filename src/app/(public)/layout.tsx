import { Header } from '@/components/header';
import { getServerSession } from '@/lib/get-session';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <>
      <Header session={session ?? null} />
      <main>{children}</main>
    </>
  );
}
