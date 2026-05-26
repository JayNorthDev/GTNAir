
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MdOutlineHome, MdOutlineGridView, MdOutlinePlayArrow, MdOutlineFavoriteBorder, MdOutlineSettings } from "react-icons/md";
import { GtnLogo } from "../gtn-logo";
import { View } from "@/hooks/useSettings";

type NavRailProps = {
  view: View;
  setView: (view: View) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
};



const navItems = [
  { id: "home", label: "Home", icon: MdOutlineHome },
  { id: "categories", label: "Categories", icon: MdOutlineGridView },
  { id: "player", label: "Live TV", icon: MdOutlinePlayArrow },
  { id: "favorites", label: "Favorites", icon: MdOutlineFavoriteBorder },
];

// Stardust pearl button styles injected once for all nav buttons
const stardustNavStyles = `
  .stardust-nav-btn {
    outline: none;
    cursor: pointer;
    border: 0;
    position: relative;
    border-radius: 50%;
    background-color: #0a1929;
    transition: all 0.3s ease;
    box-shadow:
      inset 0 0.15rem 0.5rem rgba(255, 255, 255, 0.25),
      inset 0 -0.05rem 0.15rem rgba(0, 0, 0, 0.7),
      inset 0 -0.2rem 0.5rem rgba(255, 255, 255, 0.4),
      0 0.5rem 1rem rgba(0, 0, 0, 0.3),
      0 0.25rem 0.5rem -0.15rem rgba(0, 0, 0, 0.6);
  }

  .stardust-nav-btn .stardust-wrap {
    border-radius: inherit;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
    transform: translateZ(0);
  }

  .stardust-nav-btn .stardust-wrap::before,
  .stardust-nav-btn .stardust-wrap::after {
    content: "";
    position: absolute;
    width: 96%;
    height: 96%;
    left: 2%;
    border-radius: 50%;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  /* Bottom Glow */
  .stardust-nav-btn .stardust-wrap::before {
    bottom: 2%;
    background: radial-gradient(circle at center 90%, rgba(64, 180, 255, 0.3) 0%, rgba(64, 180, 255, 0) 50%);
  }

  /* Top Glare */
  .stardust-nav-btn .stardust-wrap::after {
    top: 2%;
    box-shadow: inset 0 4px 6px -4px rgba(129, 216, 255, 0.6);
    background: linear-gradient(
      180deg,
      rgba(64, 180, 255, 0.3) 0%,
      rgba(64, 180, 255, 0.05) 40%,
      rgba(0, 0, 0, 0) 50%
    );
  }

  .stardust-nav-btn:hover {
    box-shadow:
      inset 0 0.15rem 0.3rem rgba(129, 216, 255, 0.35),
      inset 0 -0.05rem 0.15rem rgba(0, 0, 0, 0.7),
      inset 0 -0.2rem 0.5rem rgba(64, 180, 255, 0.5),
      0 0.5rem 1rem rgba(0, 0, 0, 0.3),
      0 0.25rem 0.5rem -0.15rem rgba(0, 0, 0, 0.6);
  }

  .stardust-nav-btn:hover .stardust-wrap::before {
    transform: translateY(-4%);
    background: radial-gradient(circle at center 90%, rgba(64, 180, 255, 0.4) 0%, rgba(64, 180, 255, 0) 55%);
  }

  .stardust-nav-btn:hover .stardust-wrap::after {
    transform: translateY(4%);
    background: linear-gradient(
      180deg,
      rgba(64, 180, 255, 0.4) 0%,
      rgba(64, 180, 255, 0.1) 45%,
      rgba(0, 0, 0, 0) 55%
    );
  }

  .stardust-nav-btn:active {
    transform: translateY(2px);
    box-shadow:
      inset 0 0.15rem 0.3rem rgba(129, 216, 255, 0.45),
      inset 0 -0.05rem 0.15rem rgba(0, 0, 0, 0.8),
      inset 0 -0.2rem 0.5rem rgba(64, 180, 255, 0.35),
      0 0.5rem 1rem rgba(0, 0, 0, 0.3),
      0 0.25rem 0.5rem -0.15rem rgba(0, 0, 0, 0.6);
  }

  /* Active state */
  .stardust-nav-btn.stardust-active {
    border: 1px solid rgba(59, 130, 246, 0.6);
    box-shadow:
      inset 0 0.15rem 0.4rem rgba(129, 216, 255, 0.5),
      inset 0 -0.05rem 0.2rem rgba(0, 0, 0, 0.6),
      inset 0 -0.2rem 0.6rem rgba(64, 180, 255, 0.6),
      0 0 15px rgba(59, 130, 246, 0.5),
      0 0.5rem 1rem rgba(0, 0, 0, 0.3);
  }

  .stardust-nav-btn.stardust-active .stardust-wrap::before {
    background: radial-gradient(circle at center 90%, rgba(64, 180, 255, 0.45) 0%, rgba(64, 180, 255, 0) 60%);
  }

  .stardust-nav-btn.stardust-active .stardust-wrap::after {
    box-shadow: inset 0 6px 8px -4px rgba(129, 216, 255, 0.8);
    background: linear-gradient(
      180deg,
      rgba(64, 180, 255, 0.45) 0%,
      rgba(64, 180, 255, 0.15) 50%,
      rgba(0, 0, 0, 0) 60%
    );
  }

  /* Mobile stardust buttons - smaller */
  .stardust-nav-btn-mobile {
    outline: none;
    cursor: pointer;
    border: 0;
    position: relative;
    border-radius: 50%;
    background-color: #0a1929;
    transition: all 0.3s ease;
    box-shadow:
      inset 0 0.1rem 0.35rem rgba(255, 255, 255, 0.2),
      inset 0 -0.03rem 0.1rem rgba(0, 0, 0, 0.7),
      inset 0 -0.15rem 0.35rem rgba(255, 255, 255, 0.35),
      0 0.3rem 0.6rem rgba(0, 0, 0, 0.25);
  }

  .stardust-nav-btn-mobile .stardust-wrap-mobile {
    border-radius: inherit;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
    transform: translateZ(0);
  }

  .stardust-nav-btn-mobile .stardust-wrap-mobile::before,
  .stardust-nav-btn-mobile .stardust-wrap-mobile::after {
    content: "";
    position: absolute;
    width: 86%;
    height: 86%;
    left: 7%;
    border-radius: 50%;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .stardust-nav-btn-mobile .stardust-wrap-mobile::before {
    bottom: 7%;
    background: radial-gradient(circle at center 90%, rgba(64, 180, 255, 0.25) 0%, rgba(64, 180, 255, 0) 50%);
  }

  .stardust-nav-btn-mobile .stardust-wrap-mobile::after {
    top: 7%;
    box-shadow: inset 0 3px 4px -3px rgba(129, 216, 255, 0.5);
    background: linear-gradient(
      180deg,
      rgba(64, 180, 255, 0.25) 0%,
      rgba(64, 180, 255, 0.05) 40%,
      rgba(0, 0, 0, 0) 50%
    );
  }

  .stardust-nav-btn-mobile.stardust-active {
    border: 1px solid rgba(59, 130, 246, 0.6);
    box-shadow:
      inset 0 0.1rem 0.3rem rgba(129, 216, 255, 0.45),
      inset 0 -0.03rem 0.12rem rgba(0, 0, 0, 0.6),
      inset 0 -0.15rem 0.4rem rgba(64, 180, 255, 0.5),
      0 0 12px rgba(59, 130, 246, 0.5),
      0 0.3rem 0.6rem rgba(0, 0, 0, 0.25);
  }

  .stardust-nav-btn-mobile.stardust-active .stardust-wrap-mobile::before {
    background: radial-gradient(circle at center 90%, rgba(64, 180, 255, 0.35) 0%, rgba(64, 180, 255, 0) 60%);
  }

  .stardust-nav-btn-mobile.stardust-active .stardust-wrap-mobile::after {
    box-shadow: inset 0 4px 5px -3px rgba(129, 216, 255, 0.6);
    background: linear-gradient(
      180deg,
      rgba(64, 180, 255, 0.35) 0%,
      rgba(64, 180, 255, 0.1) 50%,
      rgba(0, 0, 0, 0) 60%
    );
  }

  .stardust-nav-btn-mobile:active {
    transform: translateY(1px);
  }
`;

export function NavRail({ view, setView, isSettingsOpen, setIsSettingsOpen }: NavRailProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty('--mouse-x', `-1000px`);
    e.currentTarget.style.setProperty('--mouse-y', `-1000px`);
  };

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

  // Background Gradients (Centred Top & Bottom) & Grill Pattern
  const spacing = 12;
  const hexSpacing = spacing * 1.732;

  const backgroundGlows = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top Centered Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_top,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />

      {/* Bottom Centered Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_bottom,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />


    </div>
  );

  return (
    <>
      <style>{stardustNavStyles}</style>

      {/* Desktop Nav Rail */}
      <aside
        onClick={handleRailClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hidden md:flex flex-col items-center w-24 bg-[#0a0a0a]/40 backdrop-blur-xl border-r border-white/5 py-6 z-50 relative overflow-hidden group/navrail"
      >
        {backgroundGlows}

        <div className="mb-10 relative z-10">
          <GtnLogo className="w-10 h-10 text-white" />
        </div>

        <div className="flex-1 flex items-center relative z-10">
          <nav
            className="flex flex-col items-center gap-4 bg-[#0a0a0a] shadow-[0_0_20px_rgba(0,0,0,0.5)] p-2 rounded-full border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "stardust-nav-btn w-14 h-14 group",
                    isActive && "stardust-active scale-110"
                  )}
                >
                  <div className="stardust-wrap">
                    {/* Icon with Dynamic Glow */}
                    <span className={cn("flex items-center justify-center transition-transform", (item.id === "player" || item.id === "home") && "scale-[1.25]")}>
                      <item.icon
                        className={cn(
                          "w-7 h-7 transition-all duration-500 z-10 relative",
                          isActive
                            ? "text-[rgba(129,216,255,0.9)] drop-shadow-[0_0_12px_rgba(41,159,255,1)]"
                            : "text-slate-400 group-hover:text-[rgba(129,216,255,0.7)] group-hover:scale-110"
                        )}
                      />
                    </span>
                  </div>

                  {/* Floating Tooltip Label (Desktop only) */}
                  <span className="absolute left-24 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-bold opacity-0 translate-x-[-15px] pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap z-[60]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleSettingsToggle}
            className={cn(
              "stardust-nav-btn w-14 h-14 group",
              isSettingsOpen && "stardust-active scale-110"
            )}
          >
            <div className="stardust-wrap">
              {/* Icon with Dynamic Glow */}
              <MdOutlineSettings
                className={cn(
                  "w-7 h-7 transition-all duration-500 z-10 relative",
                  isSettingsOpen
                    ? "text-[rgba(129,216,255,0.9)] drop-shadow-[0_0_12px_rgba(41,159,255,1)]"
                    : "text-slate-400 group-hover:text-[rgba(129,216,255,0.7)] group-hover:scale-110"
                )}
              />
            </div>

            {/* Floating Tooltip Label (Desktop only) */}
            <span className="absolute left-24 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-bold opacity-0 translate-x-[-15px] pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap z-[60]">
              Settings
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav
        onClick={handleRailClick}
        className="md:hidden fixed bottom-4 inset-x-4 h-16 bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 flex justify-around items-center z-50 rounded-full shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_top,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[40%] bg-[radial-gradient(circle_at_bottom,_rgba(41,159,255,0.2),_rgba(88,28,135,0.12),_transparent_75%)] opacity-90" />
        </div>

        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center h-full w-full cursor-pointer"
            >
              <div
                className={cn(
                  "stardust-nav-btn-mobile w-10 h-10",
                  isActive && "stardust-active"
                )}
              >
                <div className="stardust-wrap-mobile">
                  <span className={cn("flex items-center justify-center transition-transform", (item.id === "player" || item.id === "home") && "scale-[1.25]")}>
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-all duration-500 z-10 relative",
                        isActive ? "text-[rgba(129,216,255,0.9)] drop-shadow-[0_0_8px_rgba(41,159,255,0.8)]" : "text-slate-400"
                      )}
                    />
                  </span>
                </div>
              </div>
              <span className={cn("text-[10px] mt-0.5 transition-all duration-500", isActive ? "text-[rgba(129,216,255,0.9)] font-bold" : "text-slate-400")}>{item.label}</span>
            </div>
          );
        })}

        <div
          onClick={handleSettingsToggle}
          className="relative flex flex-col items-center justify-center h-full w-full cursor-pointer"
        >
          <div
            className={cn(
              "stardust-nav-btn-mobile w-10 h-10",
              isSettingsOpen && "stardust-active"
            )}
          >
            <div className="stardust-wrap-mobile">
              <MdOutlineSettings
                className={cn(
                  "w-5 h-5 transition-all duration-500 z-10 relative",
                  isSettingsOpen ? "text-[rgba(129,216,255,0.9)] drop-shadow-[0_0_8px_rgba(41,159,255,0.8)]" : "text-slate-400"
                )}
              />
            </div>
          </div>
          <span className={cn("text-[10px] mt-0.5 transition-all duration-500", isSettingsOpen ? "text-[rgba(129,216,255,0.9)] font-bold" : "text-slate-400")}>Settings</span>
        </div>
      </nav>
    </>
  );
}
