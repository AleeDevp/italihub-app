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
import Image from 'next/image';
import { NavAccount } from './nav-account';
import { NavActivity } from './nav-activity';
import { NavAdsManagement } from './nav-ads-management';
import { NavMain } from './nav-main';
import { NavOthers } from './nav-others';
import { NavUser } from './nav-user';
// This is sample data.
const data = {
  navMain: [
    {
      name: 'Dashboard Home',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Overview',
      url: '/dashboard/overview',
      icon: ChartColumn,
    },
  ],
  navAdsManagement: [
    {
      name: 'Ads Management',
      url: '/dashboard/ads',
      icon: Newspaper,
    },
  ],
  navAccount: [
    {
      name: 'Profile',
      url: '/dashboard/profile',
      icon: UserPen,
    },
    {
      name: 'Verification',
      url: '/dashboard/verification',
      icon: UserCheck,
    },
    {
      name: 'Security & Settings',
      url: '/dashboard/settings',
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
      url: '/dashboard/support',
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
      <SidebarHeader className="p-2 pt-4">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="ItaliHub Sidebar Logo"
            width={140}
            height={100}
            className="object-contain"
          />
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
      <SidebarFooter>
        <NavUser
          user={{
            name: 'Ali',
            email: 'ali@example.com',
            avatar: 'https://i.pravatar.cc/150?img=3',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
