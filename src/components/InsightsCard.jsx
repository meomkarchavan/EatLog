import React from 'react';
import { CheckCircle, AlertTriangle, Target, Sparkles } from 'lucide-react';

export default function InsightsCard({ data, days = 7 }) {
  if (!data) return null;

  const {
    summary,
    strengths = [],
    areas_for_improvement = [],
    actionable_tips = [],
  } = data;

  return (
    <div
      data-testid="insights-card"
      className="bg-surface-2 rounded-2xl p-4 sm:p-5 border border-surface-3 space-y-5 shadow-xl relative overflow-hidden transition-all duration-300"
    >
      {/* Subtle ambient accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-surface-3/80 pb-3.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Your {days}-Day Analysis
          </h3>
          <p className="text-[11px] text-zinc-400">Nutritional Intelligence & Goal Progress</p>
        </div>
      </div>

      {/* Section 1: The Verdict */}
      {summary && (
        <section className="bg-surface-3/40 rounded-xl p-3.5 sm:p-4 border border-surface-3/80">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            The Verdict
          </h4>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
            {summary}
          </p>
        </section>
      )}

      {/* Section 2: Wins */}
      {strengths.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Wins</span>
          </div>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div
                key={`strength-${index}`}
                className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed transition-colors hover:bg-white/[0.04]"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{strength}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Keep an Eye On */}
      {areas_for_improvement.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Keep an Eye On</span>
          </div>
          <div className="space-y-2">
            {areas_for_improvement.map((area, index) => (
              <div
                key={`improvement-${index}`}
                className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed transition-colors hover:bg-white/[0.04]"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{area}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Gameplan */}
      {actionable_tips.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Gameplan</span>
          </div>
          <div className="space-y-2">
            {actionable_tips.map((tip, index) => (
              <div
                key={`tip-${index}`}
                className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed transition-colors hover:bg-white/[0.04]"
              >
                <Target className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
