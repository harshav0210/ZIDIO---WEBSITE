import React, { useState } from 'react';
import { Location } from '../types/inventory';
import { UserProfile } from './GoogleLoginView';
import {
  MapPin,
  Bot,
  SlidersHorizontal,
  FileSpreadsheet,
  PlusCircle,
  LogOut,
  ChevronDown,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  locations: Location[];
  selectedLocationId: string;
  onSelectLocation: (locId: string) => void;
  onOpenCopilot: () => void;
  onOpenSandbox: () => void;
  onOpenNewPO: () => void;
  onExportData: () => void;
  onOpenOutput?: () => void;
  stockoutCount: number;
  unresolvedAlertsCount: number;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onOpenCopilot,
  onOpenSandbox,
  onOpenNewPO,
  onExportData,
  onOpenOutput,
  stockoutCount,
  unresolvedAlertsCount,
  currentUser,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header id="main-header" className="bg-white/95 backdrop-blur-xs border-b border-sky-200 sticky top-0 z-30 shadow-xs">
      {/* Authentic micro tricolor band across top */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-sky-200 to-emerald-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand: Demand Drama | Project FORESIGHT */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-sky-500 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-blue-500/20 tracking-wider">
              DD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  Demand Drama
                  <span className="text-xs font-semibold text-blue-700 hidden sm:inline">| Project FORESIGHT</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-blue-700 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  🇮🇳 Bharat Supply Grid Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Weekly Forecasting · WAPE Backtesting · Risk Decisioning Grid (₹ INR)
              </p>
            </div>
          </div>

          {/* Right Controls: Facility Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Indian Facility / Hub Selector */}
            <div className="flex items-center gap-1.5 bg-sky-50/70 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <select
                id="facility-selector"
                value={selectedLocationId}
                onChange={(e) => onSelectLocation(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Output Interface Shortcut Button */}
            {onOpenOutput && (
              <button
                id="btn-open-output-interface"
                onClick={onOpenOutput}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-400 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-900 transition-all shadow-xs cursor-pointer ring-1 ring-blue-300"
                title="Open Model Output & Forecast Results Hub"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
                <span>Output Hub (परिणाम)</span>
              </button>
            )}

            {/* What-If Sandbox Button */}
            <button
              id="btn-open-sandbox"
              onClick={onOpenSandbox}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Test festive sales lifts, monsoon delays, and fuel price changes"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>What-If Sandbox</span>
            </button>

            {/* Quick PO Button */}
            <button
              id="btn-quick-po"
              onClick={onOpenNewPO}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white" />
              <span>Create PO (₹)</span>
            </button>

            {/* AI Copilot Button */}
            <button
              id="btn-open-copilot"
              onClick={onOpenCopilot}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white transition-colors shadow-2xs cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Copilot</span>
              {stockoutCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
              )}
            </button>

            {/* Google Account Profile Button & Dropdown */}
            {currentUser && (
              <div className="relative ml-1">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50/50 hover:bg-sky-100 transition-colors cursor-pointer"
                  title="Google Account details"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'G'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[11px] font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[9px] text-blue-700 font-mono truncate max-w-[130px]">
                      {currentUser.email}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-sky-200 shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {currentUser.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-blue-700 font-mono truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="py-2 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Role:</span>
                        <span className="font-semibold text-slate-700">{currentUser.role}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Auth Method:</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Google SSO
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Switch Account / Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
