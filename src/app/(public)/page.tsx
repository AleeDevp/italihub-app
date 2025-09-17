export default function Home() {
  return (
    <div className="min-h-screen bg-background ">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Welcome to ItaliHub
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
            Provide a **central hub** for five key categories: Housing, Transportation, Currency
            Exchange, marketplace, and Services{' '}
          </p>
        </div>
      </main>
    </div>
  );
}
