import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { requireUser } from '@/lib/auth';
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
  try {
    const user = await requireUser();
  } catch {
    unauthorized();
  }

  // Read sidebar cookie on the server to set the initial state and avoid hydration flicker
  // const cookieStore = await cookies();
  // const sidebarCookie = cookieStore.get('sidebar_state')?.value;
  // const defaultOpen = sidebarCookie ? sidebarCookie === 'true' : true;

  return (
    <div className="">
      {/* <SidebarProvider defaultOpen={defaultOpen}> */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="star-pattern">
          <header className="sticky top-0  pt-2 px-1 z-40">
            <div className="w-full mx-auto py-1.5 px-4 rounded-sm bg-background/50 backdrop-blur-lg shadow-sm shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-fit">
              <div className="flex items-center gap-2 ">
                <SidebarTrigger className="shadow-2xs" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumbs />
              </div>
            </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
