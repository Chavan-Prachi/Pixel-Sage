import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Sidejot
        </h1>
        <p className="text-2xl mb-8 text-muted-foreground">
          Your AI-powered Pomodoro planner for better focus and productivity
        </p>

        <Link href="/app">
          <Button size="lg" className="text-lg px-8">
            Get Started
          </Button>
        </Link>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">AI Task Planning</h3>
            <p className="text-muted-foreground">
              Tell us what you need to do, and we'll break it down into
              manageable chunks
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Smart Pomodoro</h3>
            <p className="text-muted-foreground">
              25-minute focused work sessions with intelligent task progression
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Context Preservation</h3>
            <p className="text-muted-foreground">
              Keep your progress and notes for the next day, maintaining
              momentum
            </p>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <p className="flex-1">
                Share your tasks and goals for the day with our AI assistant
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <p className="flex-1">
                Get a personalized schedule broken into 25-minute Pomodoro
                sessions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <p className="flex-1">
                Focus on one task at a time, with built-in breaks and progress
                tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>Built with focus and accessibility in mind.</p>
      </footer>
    </div>
  )
}
