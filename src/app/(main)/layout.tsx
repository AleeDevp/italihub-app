import BottomNavigationBar from '@/components/bottom-navigation-bar';
import { getServerSession } from '@/lib/auth/server';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await getServerSession();

  return (
    <div>
      <div>
        <main>{children}</main>
      </div>
      <footer>
        {/* Mobile bottom navigation */}
        <BottomNavigationBar />
      </footer>
    </div>
  );
}
