import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { Session } from '@/lib/auth';
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
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="ItaliHub Logo"
              width={160}
              height={160}
              className="md:w-[160px] shrink-0 mt-1.5"
            />
          </Link>

          {/* Breadcrumb Navigation */}
          <div className="hidden md:flex">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Section - Auth & Theme Toggle */}
        <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
}
