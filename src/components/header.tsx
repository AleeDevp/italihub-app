import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { Session } from '@/lib/auth';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// import { useMediaQuery } from '@/app/hooks/use-media-query';
interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  return (
    <header className="w-full py-6">
      <div className="home-header mx-auto">
        {/* Logo and Breadcrumb Section */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="ItaliHub Logo"
              width={160}
              height={160}
              className="w-[140px] md:w-[160px] shrink-0 -ml-1 mt-2"
            />
          </Link>

          {/* Breadcrumb Navigation */}
          <div className="hidden md:flex">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Section - Auth & Theme Toggle */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          {/* <ModeToggle /> */}

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

          {/* Dashboard Button */}
          {session && (
            <Button
              asChild
              variant="secondary"
              className="h-full shadow-sm rounded-full border-2  text-sm font-medium text-white
              bg-radial-[at_25%_25%] from-secondary to-primary/90 to-75%
              "
            >
              <Link href="/dashboard">
                <span className="hidden md:inline">Dashboard</span>
                <LayoutDashboard />
                <ChevronRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
