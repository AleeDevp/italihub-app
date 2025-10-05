import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { requireUser } from '@/lib/auth';
import { Bell } from 'lucide-react';
import type { Metadata } from 'next';
import { unauthorized } from 'next/navigation';
import { AppSidebar } from './_components/sidebar/app-sidebar';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user;
  try {
    user = await requireUser();
  } catch {
    unauthorized();
  }

  return (
    <div className="">
      {/* <SidebarProvider defaultOpen={defaultOpen}> */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="star-pattern">
          <header className="sticky flex flex-col top-0 pt-2 px-1 z-50">
            <div className="z-40 w-full mx-auto py-1.5 px-4 rounded-sm bg-background/50 backdrop-blur-lg shadow-sm shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-fit">
              <div className="flex justify-between md:pr-5">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="shadow-2xs" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <Breadcrumbs />
                </div>
                <div className="flex items-center gap-2">
                  <div className=" hidden md:flex justify-end gap-2">
                    <NotificationBell />
                  </div>
                  <UserDropDownMenu user={user} />
                </div>
              </div>
            </div>
            <div className=" flex md:hidden justify-end gap-2">
              <Button variant="outline" size="sm" className="shadow-none">
                Notifications
                <Bell />
              </Button>
            </div>
          </header>
          <main className="py-4 px-3 md:px-8 ">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
