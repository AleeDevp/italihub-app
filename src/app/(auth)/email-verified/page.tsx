import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Email Verified - Welcome to ItaliHub',
  description: 'Your email has been successfully verified. Welcome to ItaliHub!',
};

export default function EmailVerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        {/* Success Animation Container */}
        <div className="text-center mb-8">
          <div className="relative inline-flex">
            <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in-50 duration-500" />
            <div className="absolute -top-2 -right-2"></div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="text-center">
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Email Verified!
              </h1>
              <p>
                Welcome to <span className="font-black">ItaliHub!</span>
              </p>
              <p>
                Your email has been successfully verified <br /> and your account is now{' '}
                <span className="font-mono font-semibold text-neutral-600"> active</span>.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-0">
            {/* Success Details */}
            <Alert variant="success">
              <AlertTitle>Account Activated</AlertTitle>
              <AlertDescription>Only one step left to start adding posts.</AlertDescription>
            </Alert>
            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button asChild size="lg" className="w-full group relative overflow-hidden">
                <Link href="/complete-profile" className="flex items-center justify-center gap-2">
                  <span>Complete your profile</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              {/* <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/">Back to Home</Link>
              </Button> */}
            </div>
            {/* Decorative Element */}
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-8 h-px bg-border"></div>
                <Sparkles className="w-3 h-3" />
                <span>Ready to begin your journey</span>
                <Sparkles className="w-3 h-3" />
                <div className="w-8 h-px bg-border"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
