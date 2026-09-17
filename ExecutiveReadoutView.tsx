import React, { useState } from 'react';
import { EXECUTIVE_READOUT_SLIDES, ExecutiveSlide } from '../data/northbayDatasets';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const ExecutiveReadoutView: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const slides = EXECUTIVE_READOUT_SLIDES;
  const currentSlide = slides[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="executive-readout-view" className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-blue-700 flex items-center justify-center shrink-0">
              <Presentation className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Executive Readout &amp; Decision Memo (Deliverable D7)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-sky-200">
                  Section 09 &amp; 13 · Head of Operations &amp; Finance Lead
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                8-Slide Boardroom Deck &amp; Action Plan · Rupee Impact Led Up Front
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-blue-900 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>Print Executive Memo</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-slate-800">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentSlideIndex === slides.length - 1}
                className="p-1.5 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
              currentSlideIndex === idx
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50'
            }`}
          >
            <div className="text-[10px] font-bold font-mono opacity-80">Slide 0{s.id}</div>
            <div className="text-[11px] font-bold truncate mt-0.5">{s.title.split(':')[0]}</div>
          </button>
        ))}
      </div>

      {/* Main Slide Presentation Canvas */}
      <div className="bg-white border-2 border-sky-200 rounded-3xl p-8 shadow-md min-h-[460px] flex flex-col justify-between space-y-6 relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute -bottom-10 -right-10 text-slate-100 select-none pointer-events-none font-bold text-9xl">
          0{currentSlide.id}
        </div>

        {/* Slide Header */}
        <div className="space-y-1.5 border-b border-sky-100 pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              PROJECT FORESIGHT · NORTHBAY LIVING BOARDROOM READOUT
            </span>
            <span className="text-xs font-mono text-slate-400">
              Slide {currentSlide.id} of {slides.length}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentSlide.title}
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Slide Body: Metrics and Bullets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 my-auto">
          {/* Left Column: Key Highlights or Rupee Card (if available) */}
          <div className={`${currentSlide.keyMetricHighlight || currentSlide.rupeeImpactSummary ? 'lg:col-span-4' : 'hidden'} space-y-4`}>
            {currentSlide.keyMetricHighlight && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white shadow-sm space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  {currentSlide.keyMetricHighlight.label}
                </span>
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {currentSlide.keyMetricHighlight.value}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSlide.keyMetricHighlight.sublabel}
                </p>
              </div>
            )}

            {currentSlide.rupeeImpactSummary && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                  Financial Impact Breakdown:
                </div>
                <div className="text-rose-700 font-semibold font-mono">
                  • {currentSlide.rupeeImpactSummary.salesAtRisk}
                </div>
                <div className="text-indigo-700 font-semibold font-mono">
                  • {currentSlide.rupeeImpactSummary.lockedCapital}
                </div>
                <div className="text-emerald-700 font-bold font-mono border-t border-sky-200 pt-1">
                  • {currentSlide.rupeeImpactSummary.netBenefit}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Bullets & Findings */}
          <div className={`${currentSlide.keyMetricHighlight || currentSlide.rupeeImpactSummary ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Key Analytical Takeaways:
            </span>
            <div className="space-y-2.5">
              {currentSlide.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Footer: Recommendations */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-sky-200 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-blue-950 block">
                Immediate Action Items for Operations &amp; Finance:
              </span>
              <div className="text-xs text-blue-900 font-medium mt-0.5 space-y-0.5">
                {currentSlide.recommendations.map((rec, i) => (
                  <div key={i}>&bull; {rec}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentSlideIndex < slides.length - 1 ? (
              <button
                onClick={handleNext}
                className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Next Slide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Readout Complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
