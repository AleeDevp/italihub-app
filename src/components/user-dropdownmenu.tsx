'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/lib/auth';
// import { signOut } from '@/lib/auth-client';
import { LogOut, Settings, ShieldUser, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from './user-avatar';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

type Props = {
  user: User;
};

export function UserDropDownMenu({ user }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/'); // Redirect to your desired page (e.g., login or home)
        },
      },
    });
  };

  const name = user.name ?? 'User';
  const email = user.email ?? '';
  const isModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer relative ">
          <UserAvatar image={user.image ?? null} size={96} isVerified={user.verified as boolean} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-2xl" align="start" sideOffset={12} forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              image={user.image ?? null}
              alt={name}
              className="h-9 w-9"
              isVerified={!!user.verified}
            />
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium leading-none">{name}</p>
              {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        {isModerator && (
          <DropdownMenuItem asChild>
            <Link href="/panel" className="flex items-center">
              <ShieldUser className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
