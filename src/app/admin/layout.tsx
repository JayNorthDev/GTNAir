"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Determine the title based on the current path
  const getPageTitle = () => {
    if (pathname === "/admin") return "Playlist Settings";
    if (pathname === "/admin/channels") return "Channel Management";
    if (pathname === "/admin/homepage") return "Homepage Content";
    return "Admin Dashboard";
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 flex overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-[#333] bg-[#1a1a1a]/30 backdrop-blur-md flex items-center px-4 md:px-8 shrink-0">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-gray-400 hover:text-white transition-all hover:bg-purple-500/10"
            >
              <PanelLeftOpen className="w-6 h-6" />
              <span className="sr-only">Open Sidebar</span>
            </Button>
          )}
          <div className="flex-1">
             <h2 className="text-lg font-semibold text-white tracking-tight">{getPageTitle()}</h2>
          </div>
          {isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white transition-all hover:bg-purple-500/10 ml-auto"
            >
              <PanelLeftClose className="w-6 h-6" />
              <span className="sr-only">Close Sidebar</span>
            </Button>
          )}
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
