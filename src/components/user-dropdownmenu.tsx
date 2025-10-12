'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/auth/client';
// import { signOut } from '@/lib/auth-client';
import { Loader2, LogOut, Settings, ShieldUser, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from './user-avatar';

import { ROUTE_DEFINITIONS } from '@/config/routes';
// keep direct imports available for other parts, but use the reusable helper here
import { authToasts, logout } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  user: User;
};

export function UserDropDownMenu({ user }: Props) {
  const router = useRouter();
  const homeRoute = ROUTE_DEFINITIONS.find((r) => r.key === 'home');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const { success, error } = await logout(120);
    if (success) {
      router.refresh();
      authToasts.loggedOut();
      router.push(homeRoute?.url ?? '/');
    } else {
      authToasts.logoutFailed(error);
    }
    setIsLoggingOut(false);
  };

  const name = user.name ?? 'User';
  const email = user.email ?? '';
  const hasRole = (required?: Array<'USER' | 'MODERATOR' | 'ADMIN'>) => {
    if (!required || required.length === 0) return true;
    return required.includes(user.role as any);
  };

  // Pull routes from centralized config
  const profileRoute = ROUTE_DEFINITIONS.find((r) => r.key === 'profile');
  const settingsRoute = ROUTE_DEFINITIONS.find((r) => r.key === 'settings');
  const panelRoute = ROUTE_DEFINITIONS.find((r) => r.key === 'panel');
  const ProfileIcon = profileRoute?.icon ?? UserIcon;
  const SettingsIcon = settingsRoute?.icon ?? Settings;
  const PanelIcon = panelRoute?.icon ?? ShieldUser;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`cursor-pointer relative transition-opacity ${isLoggingOut ? 'opacity-60 pointer-events-none' : ''}`}
          aria-disabled={isLoggingOut}
        >
          <UserAvatar image={user.image} size={96} isVerified={user.verified as boolean} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-2xl" align="start" sideOffset={12} forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <UserAvatar image={user.image ?? null} alt={name} isVerified={!!user.verified} />
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium leading-none">{name}</p>
              {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileRoute?.url ?? '/dashboard/profile'} className="flex items-center">
            <ProfileIcon className="mr-2 h-4 w-4" />
            <span>{profileRoute?.name ?? 'Profile'}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={settingsRoute?.url ?? '/dashboard/settings'} className="flex items-center">
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>{settingsRoute?.name ?? 'Security & Settings'}</span>
          </Link>
        </DropdownMenuItem>
        {hasRole(panelRoute?.requiresRole) && (
          <DropdownMenuItem asChild>
            <Link href={panelRoute?.url ?? '/panel'} className="flex items-center">
              <PanelIcon className="mr-2 h-4 w-4" />
              <span>{panelRoute?.name ?? 'Admin Panel'}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          onSelect={(e) => {
            if (isLoggingOut) e.preventDefault();
          }}
          disabled={isLoggingOut}
          aria-disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          className="text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
