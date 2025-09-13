import { Header } from "@/components/header"

export default function LanguageCoursesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-6">
            Italian Language Courses
          </h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-xl font-semibold mb-3">Beginner Course</h3>
              <p className="text-muted-foreground mb-4">
                Perfect for those just starting their Italian journey. Learn basic vocabulary, pronunciation, and essential phrases.
              </p>
              <div className="text-sm text-muted-foreground">
                Duration: 8 weeks • Level: A1
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-xl font-semibold mb-3">Intermediate Course</h3>
              <p className="text-muted-foreground mb-4">
                Build on your existing knowledge with complex grammar, conversation practice, and cultural insights.
              </p>
              <div className="text-sm text-muted-foreground">
                Duration: 10 weeks • Level: A2-B1
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-xl font-semibold mb-3">Advanced Course</h3>
              <p className="text-muted-foreground mb-4">
                Master advanced Italian with literature, business communication, and native-level fluency.
              </p>
              <div className="text-sm text-muted-foreground">
                Duration: 12 weeks • Level: B2-C1
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
