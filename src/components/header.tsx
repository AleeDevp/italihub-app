import { Breadcrumbs } from '@/components/breadcrumbs';
import ModeToggle from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { Session } from '@/lib/auth';
import Link from 'next/link';

// import { useMediaQuery } from '@/app/hooks/use-media-query';
interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-22 w-full content-end-safe  backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex  h-16 w-7/8 md:max-w-[1280px] place-self-center-safe border rounded-2xl items-center justify-between px-4">
        {/* Logo and Breadcrumb Section */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">IH</span>
            </div>
            <span className="hidden font-bold sm:inline-block">ItaliHub</span>
          </Link>

          {/* Breadcrumb Navigation */}
          <div className="hidden md:flex">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Section - Auth & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* Authentication Section */}
          {session ? (
            <UserDropDownMenu user={session.user} />
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          )}

          {/* Theme Toggle */}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
