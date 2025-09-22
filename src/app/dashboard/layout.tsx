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
    await requireUser();
  } catch {
    unauthorized();
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="rounded-md my-2 mx-2 bg-secondary/20 sticky top-0 py-2.5 h-fit flex shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-fit">
          <div className="">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1  bg-secondary md:bg-transparent" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumbs />
            </div>
            {/* <Separator /> */}
          </div>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
