'use client';
import CurrentRouteTitle from '@/components/current-route-title';
import HeaderNavigationBar from '@/components/header-navigation-bar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/lib/auth/client';
import Image from 'next/image';
import Link from 'next/link';

// import { useMediaQuery } from '@/app/hooks/use-media-query';

export function Header() {
  const isMobile = useIsMobile();
  // Use reactive client session only so UI updates immediately after login/logout
  const { data: clientSession, isPending } = useSession();
  const currentUser = clientSession?.user ?? null;
  return (
    <header className="w-full py-6 md:mb-6">
      <div className="home-header mx-auto relative">
        {/* Logo and RouteTitle Section */}
        <div className="flex items-center ">
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
          {/* Current Route Title*/}

          <span className="-mb-4 inline-flex rounded-sm border  px-1.5 py-0.5">
            <CurrentRouteTitle className="text-xs " size={14} />
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          {/* <ModeToggle /> */}

          {/* Authentication Section */}
          {isPending ? (
            <div className="h-8 w-36" />
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserDropDownMenu user={currentUser} />
            </div>
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
        <span className="absolute right-0 bottom-0 mb-[-40px]">
          {/* Desktop navigation  */}
          <HeaderNavigationBar />
        </span>
      </div>
    </header>
  );
}
