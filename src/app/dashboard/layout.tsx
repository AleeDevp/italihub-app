import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { requireUser } from '@/lib/auth';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
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
    await requireUser();
  } catch {
    unauthorized();
  }

  // Read sidebar cookie on the server to set the initial state and avoid hydration flicker
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarCookie ? sidebarCookie === 'true' : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="rounded-md  bg-background sticky top-0 py-2.5 h-fit flex shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-fit">
          <div className="w-full">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="shadow-2xs" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumbs />
            </div>
            <Separator className="my-1 mx-2" />
          </div>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
