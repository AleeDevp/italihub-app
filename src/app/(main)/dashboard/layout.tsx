import CurrentRouteTitle from '@/components/current-route-title';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserDropDownMenu } from '@/components/user-dropdownmenu';
import { requireUser } from '@/lib/auth/server';
import type { Metadata } from 'next';
import { AppSidebar } from './_components/sidebar/app-sidebar';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="star-pattern">
      {/* <SidebarProvider defaultOpen={defaultOpen}> */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky w-full flex flex-col top-0 px-0 md:px-1 z-50">
            <div className="z-40 w-full mx-auto py-1.5 px-4 rounded-br-sm rounded-bl-sm bg-background shadow-sm shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-fit">
              <div className="flex justify-between md:pr-5">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />

                  <CurrentRouteTitle />
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <UserDropDownMenu user={user} />
                </div>
              </div>
            </div>
          </header>
          <main className="py-4 px-3 md:px-8 mb-20 md:mb-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
