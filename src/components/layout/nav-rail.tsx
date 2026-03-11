
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, Heart, Home, Settings, Grid2X2 } from "lucide-react";
import { GtnLogo } from "../gtn-logo";
import { View } from "@/hooks/useSettings";

type NavRailProps = {
  view: View;
  setView: (view: View) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
};

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "categories", label: "Categories", icon: Grid2X2 },
  { id: "player", label: "Live TV", icon: Play },
  { id: "favorites", label: "Favorites", icon: Heart },
];

export function NavRail({ view, setView, isSettingsOpen, setIsSettingsOpen }: NavRailProps) {
  const handleNavClick = (viewId: string) => {
    setView(viewId as View);
    setIsSettingsOpen(false);
  };

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <>
      {/* Desktop Nav Rail */}
      <aside className="hidden md:flex flex-col items-center w-24 bg-black/20 backdrop-blur-lg border-r border-white/5 py-6 z-20">
        <div className="mb-10">
          <GtnLogo className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1 flex items-center">
          <nav className="flex flex-col items-center gap-4 bg-black/20 p-2 rounded-full border border-white/10">
            {navItems.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group",
                    !isActive && "hover:bg-white/10"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-primary/10 border-2 border-primary/30 shadow-lg"></div>
                  )}
                  <item.icon
                    className={cn(
                      "w-8 h-8 transition-all duration-300 z-10",
                      isActive
                        ? "text-primary drop-shadow-[0_0_10px_theme(colors.primary)]"
                        : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>
        <div>
          <button
            onClick={handleSettingsToggle}
            title="Settings"
            className={cn(
              "relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group",
              isSettingsOpen ? "bg-primary/10 border-2 border-primary/30 shadow-lg" : "hover:bg-white/10"
            )}
          >
            <Settings
              className={cn(
                "w-8 h-8 transition-all duration-300 z-10",
                isSettingsOpen
                  ? "text-primary drop-shadow-[0_0_10px_theme(colors.primary)]"
                  : "text-slate-400 group-hover:text-slate-200"
              )}
            />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 h-16 bg-black/20 backdrop-blur-lg border border-white/10 flex justify-around items-center z-50 rounded-full shadow-2xl">
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="flex flex-col items-center justify-center h-full w-full rounded-full"
            >
               <div className={cn("flex items-center justify-center w-10 h-10 rounded-full transition-colors", isActive ? 'bg-primary/20' : '')}>
                <item.icon
                    className={cn("w-6 h-6", isActive ? "text-primary" : "text-slate-400")}
                />
               </div>
              <span className={cn("text-[10px] -mt-1", isActive ? "text-primary" : "text-slate-400")}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={handleSettingsToggle}
          className="flex flex-col items-center justify-center h-full w-full rounded-full"
        >
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-full transition-colors", isSettingsOpen ? 'bg-primary/20' : '')}>
            <Settings
                className={cn("w-6 h-6", isSettingsOpen ? "text-primary" : "text-slate-400")}
            />
          </div>
          <span className={cn("text-[10px] -mt-1", isSettingsOpen ? 'text-primary' : 'text-slate-400')}>Settings</span>
        </button>
      </nav>
    </>
  );
}
