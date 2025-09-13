import { Header } from "@/components/header"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-6">
            About ItaliHub
          </h1>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              ItaliHub is your comprehensive platform for exploring Italian culture, language, and community. 
              We provide authentic experiences and connections to help you discover the beauty of Italy.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-6">
              To bridge cultures and create meaningful connections between Italy and the world through 
              language learning, cultural exchange, and community building.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Interactive Italian language courses</li>
              <li>• Cultural immersion experiences</li>
              <li>• Community forums and discussions</li>
              <li>• Travel guides and recommendations</li>
              <li>• Authentic Italian recipes and cooking classes</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
