export default function Home() {
  return (
    <div className="min-h-screen bg-background ">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Welcome to ItaliHub
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
            Your gateway to Italian culture, language, and community. Discover the beauty of Italy through our comprehensive platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/signup"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Get started
            </a>
            <a href="/about" className="text-sm font-semibold leading-6 text-foreground">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
          
          {/* Quick Navigation */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
            <a href="/services/language-courses" className="group relative rounded-lg border p-6 hover:bg-muted/50 transition-colors">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">Language Courses</h3>
              <p className="mt-2 text-sm text-muted-foreground">Learn Italian with our comprehensive courses</p>
            </a>
            <a href="/about" className="group relative rounded-lg border p-6 hover:bg-muted/50 transition-colors">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">About Us</h3>
              <p className="mt-2 text-sm text-muted-foreground">Discover our mission and values</p>
            </a>
            <a href="/signup" className="group relative rounded-lg border p-6 hover:bg-muted/50 transition-colors">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">Sign Up</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create your account</p>
            </a>
            <a href="/login" className="group relative rounded-lg border p-6 hover:bg-muted/50 transition-colors">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">Login</h3>
              <p className="mt-2 text-sm text-muted-foreground">Access your account</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
