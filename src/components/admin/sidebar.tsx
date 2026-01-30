"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListVideo, Settings, Home, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { GtnLogo } from "../gtn-logo";

const navItems = [
  { href: "/admin", label: "Playlist Settings", icon: Settings },
  { href: "/admin/channels", label: "Channel Management", icon: ListVideo },
  { href: "/admin/homepage", label: "Homepage Content", icon: LayoutDashboard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-[#333]">
         <Link href="/" className="flex items-center gap-2 text-white">
            <GtnLogo className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold">GTNPlay <span className="text-sm font-normal text-gray-400">Admin</span></span>
         </Link>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-[#333]">
        <Link
            href="/"
            className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
            )}
        >
            <Home className="w-5 h-5" />
            <span>Back to Main App</span>
        </Link>
      </div>
    </aside>
  );
}
