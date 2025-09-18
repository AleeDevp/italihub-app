import { Header } from '@/components/header';
import { getServerSession } from '@/lib/get-session';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <div className="relative min-h-screen bg-[#f8cfd9]">
      {/* <GradientBackground className="absolute inset-0 -z-10" /> */}
      <Header session={session ?? null} />
      <main className="home">{children}</main>
    </div>
  );
}
