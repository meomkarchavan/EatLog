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
      className="bg-surface-1 rounded-2xl p-4 sm:p-6 border border-border/80 space-y-4 shadow-xl relative overflow-hidden transition-all duration-300"
    >
      {/* Subtle ambient accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-macro-protein/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/70 pb-4">
        <div className="w-9 h-9 rounded-xl bg-macro-protein/15 border border-macro-protein/30 flex items-center justify-center text-macro-protein shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
            Your {days}-Day Analysis
          </h3>
          <p className="text-[11px] text-text-muted">Nutritional Intelligence & Goal Progress</p>
        </div>
      </div>

      {/* Section 1: The Verdict */}
      {summary && (
        <section className="bg-surface-2 rounded-xl p-4 border border-border/60">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 font-mono">
            The Verdict
          </h4>
          <p className="text-xs sm:text-sm text-text-primary leading-relaxed font-normal">
            {summary}
          </p>
        </section>
      )}

      {/* Section 2: Wins */}
      {strengths.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-macro-protein uppercase tracking-wider font-mono">
            <CheckCircle className="w-4 h-4 text-macro-protein" />
            <span>Wins</span>
          </div>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div
                key={`strength-${index}`}
                className="flex items-start gap-3 bg-surface-2 border border-border/60 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-text-primary leading-relaxed transition-colors hover:border-border"
              >
                <CheckCircle className="w-4 h-4 text-macro-protein shrink-0 mt-0.5" />
                <span className="leading-relaxed">{strength}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Keep an Eye On */}
      {areas_for_improvement.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-macro-calories uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-macro-calories" />
            <span>Keep an Eye On</span>
          </div>
          <div className="space-y-2">
            {areas_for_improvement.map((area, index) => (
              <div
                key={`improvement-${index}`}
                className="flex items-start gap-3 bg-surface-2 border border-border/60 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-text-primary leading-relaxed transition-colors hover:border-border"
              >
                <AlertTriangle className="w-4 h-4 text-macro-calories shrink-0 mt-0.5" />
                <span className="leading-relaxed">{area}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Gameplan */}
      {actionable_tips.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-macro-water uppercase tracking-wider font-mono">
            <Target className="w-4 h-4 text-macro-water" />
            <span>Gameplan</span>
          </div>
          <div className="space-y-2">
            {actionable_tips.map((tip, index) => (
              <div
                key={`tip-${index}`}
                className="flex items-start gap-3 bg-surface-2 border border-border/60 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-text-primary leading-relaxed transition-colors hover:border-border"
              >
                <Target className="w-4 h-4 text-macro-water shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
