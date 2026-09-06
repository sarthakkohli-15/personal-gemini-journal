import React from "react";
import { BookOpen, LogOut, ShieldCheck, Sparkles, Compass, Globe } from "lucide-react";
import type { UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile;
  onSignOut: () => void;
  syncing?: boolean;
  activeView: "journal" | "growth" | "inspiration";
  onSelectView: (view: "journal" | "growth" | "inspiration") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onSignOut, 
  syncing = false,
  activeView,
  onSelectView
}) => {
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base sm:text-lg tracking-tight text-stone-100 flex items-center gap-1.5">
                Journal & Reflections
              </h1>
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Gemini Powered
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">Private, end-to-end user isolated notes & personal growth</p>
          </div>
        </div>

        {/* View Switcher: Journal vs Growth vs Inspiration */}
        <div className="flex items-center bg-[#171513] p-1 rounded-xl border border-stone-800 ml-1 sm:ml-4">
          <button
            id="nav-btn-journal"
            onClick={() => onSelectView("journal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === "journal"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal</span>
          </button>
          <button
            id="nav-btn-growth"
            onClick={() => onSelectView("growth")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === "growth"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Growth</span>
          </button>
          <button
            id="nav-btn-inspiration"
            onClick={() => onSelectView("inspiration")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === "inspiration"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
            }`}
            title="Sanctuary of shared milestones and reflections"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Inspiration</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {syncing ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Syncing...
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded-md border border-stone-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Isolated in Firestore
          </div>
        )}

        <div className="flex items-center gap-3 pl-2 border-l border-stone-800">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User avatar"}
              className="w-8 h-8 rounded-full border border-stone-700 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 font-medium text-xs">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
          )}

          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-stone-200 truncate max-w-[140px]">
              {user.displayName || "Journaler"}
            </div>
            <div className="text-[11px] text-stone-400 truncate max-w-[140px]">
              {user.email || ""}
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors border border-transparent hover:border-stone-700"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
