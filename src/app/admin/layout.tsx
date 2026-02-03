
"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
             {/* Header Title or Breadcrumbs could go here */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
