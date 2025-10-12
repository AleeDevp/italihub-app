'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsAuthed } from '@/hooks/use-auth';
import Link from 'next/link';
import { useState, type PropsWithChildren } from 'react';

export type AuthRequiredGateProps = PropsWithChildren<
  { href: string } & {
    // optional override to force show even if authed (debug)
    force?: boolean;
    // forward aria-current to the underlying Link for a11y semantics
    ariaCurrent?: 'page' | undefined;
  }
>;

export function AuthRequiredGate({
  href,
  children,
  force = false,
  ariaCurrent,
}: AuthRequiredGateProps) {
  const isAuthed = useIsAuthed();
  const [open, setOpen] = useState(false);

  const needsAuth = force || !isAuthed;

  const onClick: React.MouseEventHandler = (e) => {
    if (!needsAuth) return; // allow default nav
    // intercept and show dialog
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Link
        href={href}
        onClick={onClick}
        aria-disabled={needsAuth}
        data-protected={needsAuth}
        aria-current={ariaCurrent}
      >
        {children}
      </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access requires an account</DialogTitle>
            <DialogDescription>
              <span role="img" aria-label="sad">
                😔
              </span>{' '}
              These features are for signed-in users. Please log in or create an account to
              continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Maybe later
            </Button>
            <Button asChild variant="secondary">
              <Link href="/signup">Sign up</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AuthRequiredGate;
