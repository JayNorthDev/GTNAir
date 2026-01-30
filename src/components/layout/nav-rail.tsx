"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, Heart, Home, Settings } from "lucide-react";
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
  { id: "player", label: "Live TV", icon: Play },
  { id: "favorites", label: "Favorites", icon: Heart },
];

export function NavRail({ view, setView, isSettingsOpen, setIsSettingsOpen }: NavRailProps) {
  return (
    <>
      {/* Desktop Nav Rail */}
      <aside className="hidden md:flex flex-col items-center w-20 bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 py-4 z-20">
        <GtnLogo className="w-8 h-8 text-white" />
        <div className="flex-1 flex items-center">
          <nav className="flex flex-col items-center">
            {navItems.map((item, index) => {
              const isActive = view === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => setView(item.id as View)}
                    className={cn(
                      "flex flex-col items-center w-full p-3 rounded-lg transition-all duration-300",
                      isActive
                        ? "text-sky-300 bg-sky-900/30"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-7 h-7 transition-transform duration-300 fill-current",
                        isActive &&
                          "scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                      )}
                    />
                    <span className="text-xs mt-1.5">{item.label}</span>
                  </button>
                  {index < navItems.length - 1 && (
                    <div className="w-12 h-px bg-slate-700/50 shadow-lg my-4"></div>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
        <div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "flex flex-col items-center w-full p-3 rounded-lg transition-all duration-300",
              isSettingsOpen
                ? "text-sky-300 bg-sky-900/30"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <Settings
              className={cn(
                "w-7 h-7 transition-transform duration-300 fill-current",
                isSettingsOpen &&
                  "scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]"
              )}
            />
            <span className="text-xs mt-1.5">Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center h-full w-full transition-all duration-300 relative",
                isActive ? "text-sky-400" : "text-slate-400"
              )}
            >
              {isActive && <div className="absolute inset-x-0 top-0 h-0.5 bg-sky-400 shadow-[0_0_8px_theme(colors.sky.400)]"></div>}
              <item.icon
                className={cn(
                  "w-6 h-6 fill-current",
                  isActive && "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                )}
              />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center h-full w-full transition-all duration-300 relative",
            isSettingsOpen ? "text-sky-400" : "text-slate-400"
          )}
        >
          {isSettingsOpen && <div className="absolute inset-x-0 top-0 h-0.5 bg-sky-400 shadow-[0_0_8px_theme(colors.sky.400)]"></div>}
          <Settings
            className={cn(
              "w-6 h-6 fill-current",
              isSettingsOpen && "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
            )}
          />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </nav>
    </>
  );
}
