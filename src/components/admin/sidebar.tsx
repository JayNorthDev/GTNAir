
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListVideo, Settings, Home, LayoutDashboard, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { GtnLogo } from "../gtn-logo";
import { Button } from "../ui/button";

const navItems = [
  { href: "/admin", label: "Playlist Settings", icon: Settings },
  { href: "/admin/channels", label: "Channel Management", icon: ListVideo },
  { href: "/admin/homepage", label: "Homepage Content", icon: LayoutDashboard },
];

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={cn(
        "bg-[#1a1a1a] border-r border-[#333] flex flex-col transition-all duration-300 ease-in-out h-screen z-40 shrink-0",
        isOpen ? "w-64" : "w-0 -translate-x-full md:translate-x-0 md:border-r-0"
      )}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#333] shrink-0 overflow-hidden">
         <Link href="/" className="flex items-center gap-2 text-white shrink-0">
            <GtnLogo className="w-8 h-8 text-purple-500 shrink-0" />
            <span className="text-xl font-bold whitespace-nowrap">GTNPlay <span className="text-sm font-normal text-gray-400">Admin</span></span>
         </Link>
         {isOpen && (
           <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white shrink-0 ml-2 hover:bg-purple-500/10"
           >
              <PanelLeftClose className="w-5 h-5" />
              <span className="sr-only">Close Sidebar</span>
           </Button>
         )}
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap transition-opacity duration-200">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-[#333] shrink-0 overflow-hidden">
        <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-400 hover:bg-[#2a2a2a] hover:text-white group"
            )}
        >
            <Home className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap transition-opacity duration-200">
              Back to Main App
            </span>
        </Link>
      </div>
    </aside>
  );
}
