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
import { NavAccount } from './nav-account';
import { NavActivity } from './nav-activity';
import { NavAdsManagement } from './nav-ads-management';
import { NavMain } from './nav-main';
import { NavOthers } from './nav-others';

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
  ],
  navAdsManagement: [
    {
      name: 'Ads Management',
      url: '#',
      icon: Newspaper,
    },
  ],
  navAccount: [
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
      name: 'Security & Settings',
      url: '#',
      icon: Settings,
    },
  ],
  navActivity: [
    {
      name: 'Activity Logs',
      url: '#',
      icon: Logs,
    },
  ],
  navOthers: [
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
        <NavMain items={data.navMain} />
        <NavAdsManagement items={data.navAdsManagement} />
        <NavAccount items={data.navAccount} />
        <NavActivity items={data.navActivity} />
        <NavOthers items={data.navOthers} />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
