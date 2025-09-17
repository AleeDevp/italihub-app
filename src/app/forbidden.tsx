import { Home, LogIn, ShieldAlert } from 'lucide-react';
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
  title: 'Forbidden | ItaliHub',
  description: "You don't have permission to access this resource.",
};

export default function ForbiddenPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-destructive/10 p-2 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>403 · Forbidden</CardTitle>
              <CardDescription>You don\'t have permission to view this page.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account is signed in but lacks the required permissions or roles to access this
            resource. If you believe this is a mistake, please contact support or try signing in
            with a different account.
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
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
