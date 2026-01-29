"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, Tv } from "lucide-react";
import { GtnLogo } from "../gtn-logo";

type NavRailProps = {
  view: "home" | "player";
  setView: (view: "home" | "player") => void;
};

const navItems = [
  { id: "home", label: "Home", icon: LayoutGrid },
  { id: "player", label: "Live TV", icon: Tv },
];

export function NavRail({ view, setView }: NavRailProps) {
  return (
    <>
      {/* Desktop Nav Rail */}
      <aside className="hidden md:flex flex-col items-center w-20 bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 py-4 space-y-8 z-20">
        <GtnLogo className="w-8 h-8 text-white" />
        <nav className="flex flex-col items-center space-y-6">
          {navItems.map((item) => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as 'home' | 'player')}
                className={cn(
                  "flex flex-col items-center w-full p-2 rounded-lg transition-colors duration-200",
                  isActive ? "text-sky-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-7 h-7 transition-transform duration-200", isActive && "scale-110 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]")} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as 'home' | 'player')}
              className={cn(
                "flex flex-col items-center justify-center h-full w-full transition-colors duration-200",
                isActive ? "text-sky-400" : "text-slate-400"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]")} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
