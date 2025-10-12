'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AppRouteKey, getRouteDefinition } from '@/config/routes';
import { useSession } from '@/lib/auth/client';
import Image from 'next/image';
import { NavAccount } from './nav-account';
import { NavAdsManagement } from './nav-ads-management';
import { NavHome } from './nav-home';
import { NavMain } from './nav-main';
import { NavOthers } from './nav-others';

// Build sidebar groups from canonical route definitions
const pick = (keys: AppRouteKey[]) =>
  keys
    .map((key) => getRouteDefinition(key))
    .filter((route) => route.showInSidebar !== false)
    .map(({ name, url, icon }) => ({ name, url, icon }));

const data = {
  navHome: pick(['home']),
  navMain: pick(['dashboard', 'overview']),
  navAdsManagement: pick(['create-ad', 'ads-management']),
  navAccount: pick(['profile', 'verification', 'settings']),
  // navActivity: pick(['notifications']),
  navOthers: pick(['support']),
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
        <NavHome items={data.navHome} />
        <NavMain items={data.navMain} />
        <NavAdsManagement items={data.navAdsManagement} />
        <NavAccount items={data.navAccount} />
        {/* <NavActivity items={data.navActivity} /> */}
        <NavOthers items={data.navOthers} />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
