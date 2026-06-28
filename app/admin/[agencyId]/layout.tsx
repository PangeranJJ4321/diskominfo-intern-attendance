import { Navbar } from "@/components/custom/navbar";
import { AdminSidebar } from "./components/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AdminAgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden w-full h-[calc(100vh-64px)]">
          <AdminSidebar agencyId={agencyId} />
          
          <main className="flex-1 overflow-y-auto w-full relative">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
              <SidebarTrigger className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 lg:hidden [&>svg]:size-6" />
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
