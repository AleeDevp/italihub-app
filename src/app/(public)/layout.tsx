import { Header } from '@/components/header';
import { getServerSession } from '@/lib/get-session';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <div className="flex flex-col h-dvh ">
      <Header session={session ?? null} />

      <div className="responsive-container mt-4">
        <main>{children}</main>
      </div>

      <footer className="responsive-container h-20 border-t py-4 mt-4">
        <p className="mx-auto text-center">© 2025 alee | All rights reserved</p>
      </footer>
    </div>
  );
}
