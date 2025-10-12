import { Header } from '@/components/header';

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-dvh responsive-container ">
      <Header />

      <div className=" mt-4">
        <main>{children}</main>
      </div>

      <footer className=" h-20 border-t py-4 mt-4">
        <p className="mx-auto text-center">© 2025 alee | All rights reserved</p>
      </footer>
    </div>
  );
}
