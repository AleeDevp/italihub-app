import { AlertTriangle, LogIn } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = {
  title: 'Unauthorized | ItaliHub',
  description: 'You need to be signed in to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>
                You don\'t have permission to view this page. Please sign in to continue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, try signing in again or contact support. Your session
            may have expired or you might not have the required permissions.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button asChild>
            <Link href="/login" className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
