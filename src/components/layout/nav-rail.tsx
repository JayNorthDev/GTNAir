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

  const handleSettingsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleRailClick = () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  };

  // 1. Background Gradients (Centred Top & Bottom)
  const backgroundGlows = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top Centered Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_top,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />
      
      {/* Bottom Centered Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_bottom,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />
    </div>
  );

  // Button Visual Styles
  const buttonActiveStyles = "text-[#299fff] drop-shadow-[0_0_12px_rgba(41,159,255,0.8)]";
  const activeIndicator = "bg-[#299fff]/10 border border-[#299fff]/30 shadow-[0_0_20px_rgba(41,159,255,0.3)]";

  return (
    <>
      {/* Desktop Nav Rail */}
      <aside 
        onClick={handleRailClick}
        className="hidden md:flex flex-col items-center w-24 bg-[#0a0a0a]/40 backdrop-blur-xl border-r border-white/5 py-6 z-20 relative overflow-hidden"
      >
        {backgroundGlows}
        
        <div className="mb-10 relative z-10">
          <GtnLogo className="w-10 h-10 text-white" />
        </div>
        
        <div className="flex-1 flex items-center relative z-10">
          <nav 
            className="flex flex-col items-center gap-4 bg-black/20 p-2 rounded-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group",
                    !isActive && "hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className={cn("absolute inset-0 rounded-full", activeIndicator)}></div>
                  )}
                  <item.icon
                    className={cn(
                      "w-8 h-8 transition-all duration-300 z-10",
                      isActive
                        ? buttonActiveStyles
                        : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="relative z-10">
          <button
            onClick={handleSettingsToggle}
            title="Settings"
            className={cn(
              "relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group",
              isSettingsOpen ? activeIndicator : "hover:bg-white/5"
            )}
          >
            <Settings
              className={cn(
                "w-8 h-8 transition-all duration-300 z-10",
                isSettingsOpen
                  ? buttonActiveStyles
                  : "text-slate-400 group-hover:text-slate-200"
              )}
            />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav 
        onClick={handleRailClick}
        className="md:hidden fixed bottom-4 inset-x-4 h-16 bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 flex justify-around items-center z-50 rounded-full shadow-2xl overflow-hidden"
      >
        {backgroundGlows}
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="flex flex-col items-center justify-center h-full w-full rounded-full relative z-10"
            >
               <div className={cn(
                 "flex items-center justify-center w-10 h-10 rounded-full transition-all", 
                 isActive ? "bg-[#299fff]/10 shadow-[0_0_15px_rgba(41,159,255,0.2)]" : ""
               )}>
                <item.icon
                    className={cn("w-6 h-6", isActive ? buttonActiveStyles : "text-slate-400")}
                />
               </div>
              <span className={cn("text-[10px] -mt-1", isActive ? "text-[#299fff] font-bold" : "text-slate-400")}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={handleSettingsToggle}
          className="flex flex-col items-center justify-center h-full w-full rounded-full relative z-10"
        >
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all", 
            isSettingsOpen ? "bg-[#299fff]/10 shadow-[0_0_15px_rgba(41,159,255,0.2)]" : ""
          )}>
            <Settings
                className={cn("w-6 h-6", isSettingsOpen ? buttonActiveStyles : "text-slate-400")}
            />
          </div>
          <span className={cn("text-[10px] -mt-1", isSettingsOpen ? "text-[#299fff] font-bold" : "text-slate-400")}>Settings</span>
        </button>
      </nav>
    </>
  );
}
