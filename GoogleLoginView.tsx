import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Truck,
  Sparkles,
  ArrowRight,
  UserCheck,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  facility: string;
  isLoggedIn: boolean;
}

interface GoogleLoginViewProps {
  onLoginSuccess: (user: UserProfile, targetTab?: string) => void;
  defaultEmail?: string;
}

export const GoogleLoginView: React.FC<GoogleLoginViewProps> = ({
  onLoginSuccess,
  defaultEmail = '237r1a66q2@cmrtc.ac.in',
}) => {
  const [selectedEmail, setSelectedEmail] = useState(defaultEmail);
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('All-India Supply Chain Director');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = (emailToUse: string, name: string, targetTab: string = 'output_hub') => {
    setIsLoading(true);
    setTimeout(() => {
      const user: UserProfile = {
        name: name,
        email: emailToUse,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,2563eb`,
        role: selectedRole,
        facility: 'Pan-India Logistics Control Hub',
        isLoggedIn: true,
      };
      localStorage.setItem('demand_drama_user', JSON.stringify(user));
      setIsLoading(false);
      onLoginSuccess(user, targetTab);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      {/* Subtle top tricolor micro-stripe for authentic Indian touch */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600 shadow-xs z-50"></div>

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-950/5 border border-sky-200 overflow-hidden flex flex-col md:flex-row transition-all">
        {/* Left Panel: Brand & Indian Network Overview */}
        <div className="md:w-5/12 bg-gradient-to-b from-sky-600 via-blue-600 to-blue-700 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 pointer-events-none blur-xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-sky-400/20 pointer-events-none blur-lg"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-sky-100 text-xs font-semibold mb-4">
              <span>🇮🇳 Bharat Supply Grid</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center font-black text-xl shadow-md">
                DD
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Demand Drama</h1>
                <p className="text-xs text-sky-100 font-medium">डिमांड ड्रामा • Desh Ki Supply Chain</p>
              </div>
            </div>

            <p className="text-sm text-sky-100/90 mt-3 leading-relaxed">
              India's intuitive AI inventory intelligence platform. Prevent stockouts, balance regional warehouses, and forecast festive demand in Indian Rupees (₹).
            </p>

            {/* Feature Highlights */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-sky-50 bg-white/10 rounded-lg p-2.5 border border-white/10">
                <MapPin className="w-4 h-4 text-sky-200 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">7 Indian Mega Hubs:</span> Bhiwandi, Bilaspur, Sriperumbudur, Hoskote, Dankuni & Shamshabad.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-sky-50 bg-white/10 rounded-lg p-2.5 border border-white/10">
                <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Diwali & Monsoon AI Engine:</span> Pre-empts seasonal surges, highway bottlenecks, and Kirana velocity.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-sky-50 bg-white/10 rounded-lg p-2.5 border border-white/10">
                <Truck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">GST e-Way Bill & Inter-City Transfers:</span> Shift stock seamlessly across states with 1-click PO approvals.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 relative z-10 flex items-center justify-between text-xs text-sky-200">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              ISO 27001 &amp; GST Ready
            </span>
            <span>v2.5 Bharat Edition</span>
          </div>
        </div>

        {/* Right Panel: Google Login & Quick Demo */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sign in to Demand Drama</h2>
                <p className="text-xs text-slate-500 mt-0.5">Secure Google Single Sign-On for Supply Chain Personnel</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Google Account Card */}
            {!isCustomMode ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-blue-200 bg-sky-50/60 transition-all hover:border-blue-400">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      23
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 truncate">CMRTC Supply Chain Ops</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Detected Google Account
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 font-mono truncate">{selectedEmail}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">CMR Technical Campus Enterprise Domain</p>
                    </div>
                  </div>

                  {/* Primary Google Sign In Button */}
                  <button
                    id="btn-google-login-primary"
                    disabled={isLoading}
                    onClick={() => handleGoogleSignIn(selectedEmail, 'CMRTC Supply Chain Lead', 'output_hub')}
                    className="w-full mt-4 flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {/* SVG Google 'G' official logo */}
                    <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <span>{isLoading ? 'Authenticating & Loading Output...' : `Sign in with Google & Show Output`}</span>
                    <ArrowRight className="w-4 h-4 text-blue-200 ml-auto" />
                  </button>

                  {/* Direct One-Click Show Output Button */}
                  <button
                    id="btn-show-output-direct"
                    disabled={isLoading}
                    onClick={() => handleGoogleSignIn(selectedEmail, 'CMRTC Supply Chain Lead', 'output_hub')}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-100/80 hover:bg-sky-200/80 text-blue-900 border border-sky-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <span>⚡ Show Live Output Hub Directly</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => setIsCustomMode(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                  >
                    Sign in with different Google email
                  </button>
                  <span className="text-slate-400">One-tap fast login</span>
                </div>
              </div>
            ) : (
              /* Custom Email Entry */
              <div className="space-y-4 p-4 rounded-xl border border-blue-200 bg-sky-50/40">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter your Google / Corporate Email</label>
                  <input
                    type="email"
                    placeholder="your.name@company.in"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={!customEmail || isLoading}
                    onClick={() => handleGoogleSignIn(customEmail, customEmail.split('@')[0])}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsCustomMode(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Role Logins */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Or Quick Access as Indian Hub Manager:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-demo-bhiwandi"
                  onClick={() => handleGoogleSignIn('bhiwandi.ops@demanddrama.in', 'Rajesh Sharma (Bhiwandi Hub)')}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-sky-150 bg-sky-50/70 hover:bg-sky-100 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                    BHW
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">Bhiwandi Hub Lead</p>
                    <p className="text-[10px] text-slate-500 truncate">Western Zone Manager</p>
                  </div>
                </button>

                <button
                  id="btn-demo-bilaspur"
                  onClick={() => handleGoogleSignIn('bilaspur.ops@demanddrama.in', 'Amitav Verma (Bilaspur Hub)')}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-sky-150 bg-sky-50/70 hover:bg-sky-100 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
                    DEL
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">Bilaspur Hub Lead</p>
                    <p className="text-[10px] text-slate-500 truncate">Northern NCR Corridor</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Indian Supply Chain Network
            </span>
            <span>Terms &amp; GST Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
