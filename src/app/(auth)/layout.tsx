export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="min-h-screen bg-muted">
        <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-6 md:p-10">
          {children}
        </div>
      </main>
    </>
  );
}
