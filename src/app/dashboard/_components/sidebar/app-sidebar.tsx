'use client';

import {
  ChartColumn,
  HeartHandshake,
  LayoutDashboard,
  Logs,
  Newspaper,
  Settings,
  UserCheck,
  UserPen,
} from 'lucide-react';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSession } from '@/lib/auth-client';
import { NavMain } from './nav-projects';

// This is sample data.
const data = {
  navMain: [
    {
      name: 'Dashboard Home',
      url: '#',
      icon: LayoutDashboard,
    },
    {
      name: 'Overview',
      url: '#',
      icon: ChartColumn,
    },
    {
      name: 'Ads Management',
      url: '#',
      icon: Newspaper,
    },
    {
      name: 'Profile',
      url: '#',
      icon: UserPen,
    },
    {
      name: 'Verification',
      url: '#',
      icon: UserCheck,
    },
    {
      name: 'Activity Logs',
      url: '#',
      icon: Logs,
    },
    {
      name: 'Security & Settings',
      url: '#',
      icon: Settings,
    },
    {
      name: 'Support / Help',
      url: '#',
      icon: HeartHandshake,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSession().data?.user;
  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="p-2">
        <div className="max-h-[5rem] min-h-[5rem] shadow-sm rounded-md border bg-gradient-to-r from-pink-500 to-rose-500 p-2">
          {/* <Image
            src="/logo.png"
            alt="ItaliHub Sidebar Logo"
            width={140}
            height={100}
            className="object-contain"
          /> */}
          {/* <Separator className="-mt-3" /> */}
        </div>
      </SidebarHeader>
      <SidebarContent className="">
        <NavMain projects={data.navMain} />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
