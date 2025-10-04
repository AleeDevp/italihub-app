'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/actions/auth-actions';
import { User } from '@/lib/auth';
// import { signOut } from '@/lib/auth-client';
import { LogOut, Settings, ShieldUser, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserAvatar } from './user-avatar';

type Props = {
  user: User;
};

export function UserDropDownMenu({ user }: Props) {
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out, please try again.');
    }
  };

  const name = user.name ?? 'User';
  const email = user.email ?? '';
  const isAdmin = user.role === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer border-1 relative overflow-hidden shadow-lg rounded-full ">
          <UserAvatar image={user.image ?? null} className="h-9 w-9" />
          {/* <div className="absolute h-1/4 w-full bg-white rounded-t-3xl border-t-1 border-t-white bottom-0">
            <ChevronDown className="size-3 place-self-center text-center text-primary -mt-0.5" />
          </div> */}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-2xl" align="start" sideOffset={12} forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <UserAvatar image={user.image ?? null} alt={name} className="h-9 w-9" />
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
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin-panel" className="flex items-center">
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
