import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  TrendingUp,
  Droplets,
  ArrowRight,
  CheckCircle2,
  Check,
  ChevronRight,
  Calculator,
  Pin,
  Clock,
  Star,
  Activity,
  Heart,
  Target
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onSignIn, user, onOpenDashboard }) {
  // Interactive Hero Preview state
  const [selectedMealPreset, setSelectedMealPreset] = useState('post-workout');
  
  // Interactive Macro Calculator state
  const [calcWeight, setCalcWeight] = useState(78);
  const [calcGoal, setCalcGoal] = useState('gain'); // 'lose', 'maintain', 'gain'
  const [calcActivity, setCalcActivity] = useState('moderate');

  // Meal presets for the interactive demo in the hero
  const mealPresets = {
    'post-workout': {
      label: 'Post-Workout Shake & Oats',
      input: '2 scoops whey isolate, 100g rolled oats, 1 banana, 300ml almond milk, 15g peanut butter',
      calories: 685,
      protein: 62,
      carbs: 78,
      fat: 14,
      fiber: 9,
    },
    'lunch-ribeye': {
      label: 'Ribeye & Jasmine Rice',
      input: '250g grilled ribeye steak with 2 cups jasmine rice and steamed asparagus',
      calories: 890,
      protein: 68,
      carbs: 86,
      fat: 26,
      fiber: 4,
    },
    'high-protein-breakfast': {
      label: 'Egg Whites & Toast',
      input: '4 whole eggs, 150g egg whites, 2 slices sourdough toast, 1/2 avocado',
      calories: 540,
      protein: 46,
      carbs: 34,
      fat: 22,
      fiber: 6,
    },
  };

  const currentPreset = mealPresets[selectedMealPreset];

  // Calculate live targets for the interactive calculator
  const targetProtein = Math.round(calcWeight * 2.2);
  const bmr = Math.round(10 * calcWeight + 6.25 * 178 - 5 * 26 + 5); // Assuming 178cm, 26yo male base
  const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, heavy: 1.725 };
  const tdee = Math.round(bmr * (activityMultipliers[calcActivity] || 1.55));
  const goalAdjustment = calcGoal === 'lose' ? -350 : calcGoal === 'gain' ? 300 : 0;
  const targetCalories = tdee + goalAdjustment;
  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const targetCarbs = Math.max(0, Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4));

  return (
    <div className="min-h-[100dvh] bg-[#090a0c] text-[#f3f4f6] font-sans antialiased selection:bg-[#22c55e]/20 selection:text-[#22c55e] overflow-x-hidden">
      {/* Ambient background glow layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#22c55e]/10 via-[#38bdf8]/5 to-transparent blur-[120px] rounded-full opacity-70" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-[#facc15]/5 via-emerald-500/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-[#38bdf8]/5 to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090a0c]/85 border-b border-white/[0.07] transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22c55e] to-emerald-400 p-[1px] shadow-[0_0_16px_rgba(34,197,94,0.3)]">
              <div className="w-full h-full bg-[#121316] rounded-[11px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#22c55e]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#f3f4f6]">EatLog</span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#9ca3af]">
            <a href="#features" className="hover:text-[#f3f4f6] transition-colors">Features</a>
            <a href="#coach" className="hover:text-[#f3f4f6] transition-colors">AI Coach</a>
            <a href="#calculator" className="hover:text-[#f3f4f6] transition-colors">Macro Calculator</a>
            <a href="#social-proof" className="hover:text-[#f3f4f6] transition-colors">Why EatLog</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                id="landing-open-dashboard-btn"
                type="button"
                onClick={onOpenDashboard || onGetStarted}
                className="bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_16px_rgba(34,197,94,0.35)] hover:shadow-[0_0_24px_rgba(34,197,94,0.5)] active:scale-95 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  id="landing-signin-btn"
                  type="button"
                  onClick={onSignIn || onGetStarted}
                  className="text-xs font-semibold text-[#9ca3af] hover:text-[#f3f4f6] px-3.5 py-2 rounded-xl transition-colors hover:bg-white/[0.04]"
                >
                  Sign In
                </button>
                <button
                  id="landing-cta-nav"
                  type="button"
                  onClick={onGetStarted}
                  className="bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_16px_rgba(34,197,94,0.35)] hover:shadow-[0_0_24px_rgba(34,197,94,0.5)] active:scale-95"
                >
                  Start Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* =========================================================================
            1. HERO SECTION (Editorial, High Contrast, Asymmetric)
        ========================================================================= */}
        <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Bold Typography & Conversion Trigger */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge Pill */}
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316] border border-white/[0.08] text-xs text-[#f3f4f6] shadow-inner">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
                <span className="font-mono text-[11px] text-[#22c55e] font-semibold">HYPER-PRECISE MACRO TRACKING</span>
                <span className="text-[#6b7280] hidden sm:inline">•</span>
                <span className="text-[#9ca3af] text-[11px]">Built For Strength & Hypertrophy</span>
              </div>

              {/* Massive Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-[#f3f4f6]">
                Track Every Gram.{' '}
                <span className="bg-gradient-to-r from-[#22c55e] via-emerald-300 to-[#38bdf8] bg-clip-text text-transparent">
                  Fuel Every Rep.
                </span>{' '}
                Build Real Strength.
              </h1>

              {/* Subheadline with high contrast */}
              <p className="text-base sm:text-lg text-[#9ca3af] max-w-2xl leading-relaxed">
                No dropdown searching or barcode scanning friction. Type or paste your whole meal in plain English. Our sub-second AI calculates exact protein targets, caloric surplus, and recovery metrics instantly.
              </p>

              {/* CTA Group with Neon Glowing Magnetic Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  id="hero-start-tracking-btn"
                  type="button"
                  onClick={onGetStarted}
                  className="group relative px-7 py-3.5 rounded-xl bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_24px_rgba(34,197,94,0.4)] hover:shadow-[0_0_36px_rgba(34,197,94,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  <span>Start Tracking Free</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href="#calculator"
                  className="px-6 py-3.5 rounded-xl bg-[#121316] hover:bg-[#1a1c22] text-[#f3f4f6] font-bold text-sm sm:text-base border border-white/[0.08] hover:border-white/[0.16] flex items-center justify-center gap-2 transition-all"
                >
                  <Calculator className="w-4 h-4 text-[#38bdf8]" />
                  <span>Estimate Macro Target</span>
                </a>
              </div>

              {/* Trust & Proof Line */}
              <div className="pt-4 flex items-center gap-4 text-xs text-[#9ca3af]">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-950 border-2 border-[#090a0c] flex items-center justify-center text-[10px] font-bold text-emerald-300">KC</div>
                  <div className="w-7 h-7 rounded-full bg-sky-950 border-2 border-[#090a0c] flex items-center justify-center text-[10px] font-bold text-sky-300">MR</div>
                  <div className="w-7 h-7 rounded-full bg-amber-950 border-2 border-[#090a0c] flex items-center justify-center text-[10px] font-bold text-amber-300">DL</div>
                  <div className="w-7 h-7 rounded-full bg-purple-950 border-2 border-[#090a0c] flex items-center justify-center text-[10px] font-bold text-purple-300">+</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {'★★★★★'}
                    <span className="text-[#f3f4f6] font-semibold ml-1">4.9/5</span>
                  </div>
                  <p className="text-[11px] text-[#6b7280]">94% of lifters hit their daily protein within 14 days</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Mockup HUD (Asymmetric Card Stacking) */}
            <div className="lg:col-span-5 relative">
              {/* Glowing aura frame behind card */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#22c55e]/30 via-[#38bdf8]/20 to-[#facc15]/20 rounded-2xl blur-lg opacity-60 pointer-events-none" />

              <div className="relative bg-[#121316] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)] space-y-4">
                {/* Header of Mock App */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono font-bold text-[#9ca3af]">LIVE APP HUD</span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#22c55e]/15 text-[#22c55e] px-2 py-0.5 rounded-md border border-[#22c55e]/30">
                    SYNCHRONIZED
                  </span>
                </div>

                {/* Primary Hero Cards: Calories & Protein */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Calories Hero Card */}
                  <div className="bg-[#1a1c22] rounded-xl p-3.5 border border-white/[0.07] border-t-[3px] border-t-[#facc15] relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] text-[#9ca3af] uppercase font-mono mb-1">
                      <span>Calories</span>
                      <Flame className="w-3.5 h-3.5 text-[#facc15]" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        data-testid="hero-mock-calories"
                        className="text-3xl font-extrabold text-[#facc15] font-stat-mono tracking-tight leading-none"
                      >
                        {2150 + currentPreset.calories}
                      </span>
                      <span className="text-[11px] text-[#6b7280] font-stat-mono">kcal</span>
                    </div>
                    <div className="mt-2.5 w-full bg-[#121316] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#facc15] h-full rounded-full transition-all duration-500" style={{ width: '84%' }} />
                    </div>
                    <p className="text-[10px] text-[#6b7280] mt-1.5 font-stat-mono">Goal: 2,750 kcal (+300 surplus)</p>
                  </div>

                  {/* Protein Hero Card */}
                  <div className="bg-[#1a1c22] rounded-xl p-3.5 border border-white/[0.07] border-t-[3px] border-t-[#22c55e] relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] text-[#9ca3af] uppercase font-mono mb-1">
                      <span>Protein</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        data-testid="hero-mock-protein"
                        className="text-3xl font-extrabold text-[#22c55e] font-stat-mono tracking-tight leading-none"
                      >
                        {120 + currentPreset.protein}
                      </span>
                      <span className="text-[11px] text-[#6b7280] font-stat-mono">g</span>
                    </div>
                    <div className="mt-2.5 w-full bg-[#121316] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#22c55e] h-full rounded-full transition-all duration-500" style={{ width: '96%' }} />
                    </div>
                    <p className="text-[10px] text-[#6b7280] mt-1.5 font-stat-mono">Goal: 180g (2.2g/kg)</p>
                  </div>
                </div>

                {/* Secondary Macro Strip */}
                <div className="bg-[#1a1c22] rounded-xl px-3.5 py-2.5 border border-white/[0.07] flex items-center justify-between text-xs font-stat-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#38bdf8] font-bold">{240 + currentPreset.carbs}g</span>
                    <span className="text-[#6b7280] text-[11px]">Carbs</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/[0.08]" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#fb923c] font-bold">{58 + currentPreset.fat}g</span>
                    <span className="text-[#6b7280] text-[11px]">Fat</span>
                  </div>
                  <div className="w-px h-3.5 bg-white/[0.08]" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#a78bfa] font-bold">{28 + currentPreset.fiber}g</span>
                    <span className="text-[#6b7280] text-[11px]">Fiber</span>
                  </div>
                </div>

                {/* Interactive Preset Tester */}
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] font-mono text-[#9ca3af] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>Try Instant Natural Language Parsing:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {Object.entries(mealPresets).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedMealPreset(key)}
                        className={`text-[11px] py-2 sm:py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                          selectedMealPreset === key
                            ? 'bg-[#22c55e] text-[#090a0c] font-bold shadow-sm'
                            : 'bg-[#1a1c22] text-[#9ca3af] hover:text-[#f3f4f6] border border-white/[0.07]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#121316] rounded-xl p-3 border border-white/[0.08] text-xs font-mono text-[#f3f4f6] space-y-1">
                    <div className="text-[10px] text-[#6b7280] uppercase">Input Prompt</div>
                    <div className="text-[#9ca3af] leading-relaxed italic">"{currentPreset.input}"</div>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-[#22c55e]">
                      <span>✓ Parsed in 420ms</span>
                      <span className="text-[#facc15]">+{currentPreset.calories} kcal • +{currentPreset.protein}g Protein</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. ASYMMETRIC BENTO FEATURE GRID (Modern, High Variance)
        ========================================================================= */}
        <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-white/[0.07]">
          <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121316] border border-white/[0.08] text-xs text-[#38bdf8] font-mono font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>ENGINEERED FOR SPEED</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f3f4f6] tracking-tight">
              Everything Serious Lifters Need.{' '}
              <span className="text-[#22c55e]">Zero Clutter.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed">
              Every feature is built around the single constraint of zero workout disruption. Log your entire day in under 30 seconds.
            </p>
          </div>

          {/* Asymmetrical Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Bento 1: Natural Language Omni-Input (Span 8) */}
            <div className="md:col-span-8 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 relative overflow-hidden group hover:border-white/[0.16] transition-all duration-300 shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="max-w-md space-y-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#f3f4f6] tracking-tight">
                  Natural Language Omni-Input
                </h3>
                <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                  Forget searching individual ingredients across messy databases. Type full meals with quantities or slang, and let multi-model AI resolve macros in milliseconds.
                </p>
              </div>

              {/* Visual Demo Card */}
              <div className="bg-[#1a1c22] border border-white/[0.07] rounded-xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs text-[#9ca3af] font-mono">
                  <span>Log Input</span>
                  <span className="text-[#22c55e] font-semibold">Gemini 2.5 Flash</span>
                </div>
                <div className="p-3 bg-[#121316] rounded-lg text-xs font-mono text-[#f3f4f6] border border-white/[0.06]">
                  "300g chicken breast, 1.5 cups jasmine rice, 1 tbsp olive oil"
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="bg-[#121316] p-2 rounded-lg text-center border border-white/[0.06]">
                    <span className="text-[10px] text-[#6b7280] block font-mono">Calories</span>
                    <span className="text-sm font-bold text-[#facc15] font-stat-mono">715</span>
                  </div>
                  <div className="bg-[#121316] p-2 rounded-lg text-center border border-white/[0.06]">
                    <span className="text-[10px] text-[#6b7280] block font-mono">Protein</span>
                    <span className="text-sm font-bold text-[#22c55e] font-stat-mono">94g</span>
                  </div>
                  <div className="bg-[#121316] p-2 rounded-lg text-center border border-white/[0.06]">
                    <span className="text-[10px] text-[#6b7280] block font-mono">Carbs</span>
                    <span className="text-sm font-bold text-[#38bdf8] font-stat-mono">68g</span>
                  </div>
                  <div className="bg-[#121316] p-2 rounded-lg text-center border border-white/[0.06]">
                    <span className="text-[10px] text-[#6b7280] block font-mono">Fat</span>
                    <span className="text-sm font-bold text-[#fb923c] font-stat-mono">16g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Dynamic Bodyweight Macro Targets (Span 4) */}
            <div className="md:col-span-4 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-white/[0.16] transition-all duration-300 shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#facc15]/15 border border-[#facc15]/30 flex items-center justify-center text-[#facc15]">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#f3f4f6] tracking-tight">
                  Dynamic Targets
                </h3>
                <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                  Targets scale in real time as your morning weigh-ins fluctuate. Calculates optimal 2.2g/kg protein and custom surplus deficits.
                </p>
              </div>

              <div className="mt-6 bg-[#1a1c22] border border-white/[0.07] rounded-xl p-4 space-y-2.5 font-stat-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9ca3af]">Formula</span>
                  <span className="text-[#f3f4f6] font-semibold">Mifflin-St Jeor</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9ca3af]">Protein Ratio</span>
                  <span className="text-[#22c55e] font-bold">2.2 g / kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#facc15] font-bold">+300 kcal Bulk</span>
                  <span className="text-[#9ca3af]">Active Phase</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Quick Hydration Logger (Span 4) */}
            <div className="md:col-span-4 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-white/[0.16] transition-all duration-300 shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                  <Droplets className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#f3f4f6] tracking-tight">
                  1-Tap Hydration
                </h3>
                <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                  Log +250ml or +500ml shaker bottles in a single tap without opening menus. Visual radial gauges track daily performance.
                </p>
              </div>

              <div className="mt-6 bg-[#1a1c22] border border-white/[0.07] rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#9ca3af]">Hydration Today</span>
                  <span className="text-lg font-bold text-[#38bdf8] font-stat-mono">3,250 / 3,500 ml</span>
                </div>
                <div className="w-full bg-[#121316] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#38bdf8] h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            {/* Bento 4: Staples & Meal Pinning (Span 4) */}
            <div className="md:col-span-4 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-white/[0.16] transition-all duration-300 shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#a78bfa]">
                  <Pin className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#f3f4f6] tracking-tight">
                  Pinned Staples
                </h3>
                <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                  Pin your signature protein shakes, pre-workout snacks, and go-to dinners to the top of your feed for recurring 1-click logs.
                </p>
              </div>

              <div className="mt-6 bg-[#1a1c22] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#a78bfa]">📌</span>
                  <span className="text-[#f3f4f6] font-medium truncate">Triple Whey Shake</span>
                </div>
                <span className="text-[#22c55e] font-bold font-stat-mono">+75g Pro</span>
              </div>
            </div>

            {/* Bento 5: 90-Day Consistency Heatmap (Span 4) */}
            <div className="md:col-span-4 bg-[#121316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-white/[0.16] transition-all duration-300 shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-[#fb7185]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#f3f4f6] tracking-tight">
                  Weekly Trends
                </h3>
                <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                  High-contrast neon graphs and 90-day GitHub-style consistency heatmaps reveal weekly averages and macro compliance.
                </p>
              </div>

              <div className="mt-6 bg-[#1a1c22] border border-white/[0.07] rounded-xl p-3 flex items-center justify-around">
                <div className="w-4 h-4 rounded bg-[#22c55e]" title="100% Target Met" />
                <div className="w-4 h-4 rounded bg-[#22c55e]" />
                <div className="w-4 h-4 rounded bg-[#22c55e]/70" />
                <div className="w-4 h-4 rounded bg-[#22c55e]" />
                <div className="w-4 h-4 rounded bg-[#22c55e]" />
                <div className="w-4 h-4 rounded bg-[#22c55e]/40" />
                <div className="w-4 h-4 rounded bg-[#22c55e]" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. AI NUTRITION COACH & SOCIAL PROOF SECTION
        ========================================================================= */}
        <section id="coach" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-white/[0.07]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Coach Concept & Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121316] border border-white/[0.08] text-xs text-[#22c55e] font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTELLIGENT RECOVERY COACH</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f3f4f6] tracking-tight leading-tight">
                An AI Coach That Understands{' '}
                <span className="text-[#38bdf8]">Hypertrophy Nutrition.</span>
              </h2>

              <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed">
                Generic trackers yell at you for eating too much. EatLog's AI Coach audits your 7, 14, and 30-day nutritional trends to ensure you hit sufficient caloric surpluses and optimal leucine thresholds for maximum muscle protein synthesis.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#f3f4f6]">Weekly Verdicts & Recovery Audits</h4>
                    <p className="text-xs text-[#9ca3af]">Instant breakdowns of your 7-day caloric surplus consistency and hydration depth.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#f3f4f6]">Adaptive Micronutrient & Fiber Warnings</h4>
                    <p className="text-xs text-[#9ca3af]">Flags low fiber intake or dehydration spikes that harm training recovery.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#f3f4f6]">Actionable Pre-Workout Gameplans</h4>
                    <p className="text-xs text-[#9ca3af]">Provides specific carb and hydration adjustments before heavy training sessions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actual InsightsCard Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-[#121316] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.7)] space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/[0.07] pb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#f3f4f6]">Your 7-Day Performance Verdict</h3>
                    <p className="text-[11px] text-[#9ca3af]">Generated with EatLog AI Engine</p>
                  </div>
                </div>

                {/* The Verdict */}
                <div className="bg-[#1a1c22] rounded-xl p-3.5 border border-white/[0.07]">
                  <h4 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1.5 font-mono">The Verdict</h4>
                  <p className="text-xs text-[#f3f4f6] leading-relaxed">
                    "Exceptional protein adherence across all 7 days (averaging 186g/day). You maintained a steady +280 kcal caloric surplus optimal for hypertrophy without excessive fat accumulation."
                  </p>
                </div>

                {/* Wins */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#22c55e] uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>Key Wins</span>
                  </div>
                  <div className="bg-[#1a1c22] border border-white/[0.07] rounded-xl p-3 text-xs text-[#f3f4f6]">
                    Hit daily protein threshold (&gt;175g) 7/7 consecutive days.
                  </div>
                </div>

                {/* Gameplan */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono">
                    <Target className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Actionable Gameplan</span>
                  </div>
                  <div className="bg-[#1a1c22] border border-white/[0.07] rounded-xl p-3 text-xs text-[#f3f4f6]">
                    Add 40g intra-workout carbohydrates on heavy lower-body days to maximize glycogen replenishment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. INTERACTIVE MACRO TARGET ESTIMATOR (High Conversion Magnet)
        ========================================================================= */}
        <section id="calculator" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-white/[0.07]">
          <div className="bg-gradient-to-b from-[#121316] to-[#090a0c] border border-white/[0.08] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_12px_48px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1c22] border border-white/[0.08] text-xs text-[#facc15] font-mono font-semibold">
                <Calculator className="w-3.5 h-3.5" />
                <span>INTERACTIVE ESTIMATOR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#f3f4f6] tracking-tight">
                Calculate Your Custom Macro Blueprint
              </h2>
              <p className="text-xs sm:text-sm text-[#9ca3af]">
                See how EatLog dynamically configures your optimal muscle-building nutrition targets.
              </p>
            </div>

            {/* Interactive Form Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
              <div className="lg:col-span-6 space-y-5">
                {/* Weight Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-[#9ca3af] font-semibold">Body Weight</label>
                    <span className="text-lg font-bold text-[#f3f4f6] font-stat-mono">{calcWeight} kg <span className="text-xs text-[#6b7280]">({Math.round(calcWeight * 2.20462)} lbs)</span></span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="140"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full h-2 bg-[#1a1c22] rounded-lg appearance-none cursor-pointer accent-[#22c55e]"
                  />
                  <div className="flex justify-between text-[10px] text-[#6b7280] font-mono">
                    <span>45 kg</span>
                    <span>90 kg</span>
                    <span>140 kg</span>
                  </div>
                </div>

                {/* Goal Selector */}
                <div className="space-y-2">
                  <label className="text-[#9ca3af] text-xs font-semibold block">Primary Goal</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcGoal('lose')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        calcGoal === 'lose'
                          ? 'bg-[#f3f4f6] text-[#090a0c] border-white shadow-sm'
                          : 'bg-[#1a1c22] text-[#9ca3af] border-white/[0.07] hover:text-[#f3f4f6]'
                      }`}
                    >
                      Cut (-350)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcGoal('maintain')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        calcGoal === 'maintain'
                          ? 'bg-[#f3f4f6] text-[#090a0c] border-white shadow-sm'
                          : 'bg-[#1a1c22] text-[#9ca3af] border-white/[0.07] hover:text-[#f3f4f6]'
                      }`}
                    >
                      Maintain
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcGoal('gain')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        calcGoal === 'gain'
                          ? 'bg-[#22c55e] text-[#090a0c] font-bold border-[#22c55e] shadow-sm'
                          : 'bg-[#1a1c22] text-[#9ca3af] border-white/[0.07] hover:text-[#f3f4f6]'
                      }`}
                    >
                      Bulk (+300)
                    </button>
                  </div>
                </div>

                {/* Training Activity */}
                <div className="space-y-2">
                  <label className="text-[#9ca3af] text-xs font-semibold block">Training Frequency</label>
                  <select
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(e.target.value)}
                    className="w-full bg-[#1a1c22] text-[#f3f4f6] rounded-xl px-3.5 py-2.5 text-xs outline-none border border-white/[0.08] focus:border-[#38bdf8] font-sans"
                  >
                    <option value="light" className="bg-[#121316]">3 days/week lifting (1.375x)</option>
                    <option value="moderate" className="bg-[#121316]">4-5 days/week lifting (1.55x)</option>
                    <option value="heavy" className="bg-[#121316]">6+ days/week intense lifting (1.725x)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Target Results Box */}
              <div className="lg:col-span-6 bg-[#1a1c22] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="text-xs font-mono font-bold text-[#9ca3af] uppercase tracking-wider pb-2 border-b border-white/[0.07]">
                  Your Recommended Blueprint
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#121316] p-4 rounded-xl border border-white/[0.07] border-t-[3px] border-t-[#facc15]">
                    <span className="text-[10px] text-[#9ca3af] font-mono uppercase block mb-1">Target Calories</span>
                    <span className="text-3xl font-extrabold text-[#facc15] font-stat-mono">{targetCalories}</span>
                    <span className="text-xs text-[#6b7280] font-stat-mono ml-1">kcal</span>
                  </div>

                  <div className="bg-[#121316] p-4 rounded-xl border border-white/[0.07] border-t-[3px] border-t-[#22c55e]">
                    <span className="text-[10px] text-[#9ca3af] font-mono uppercase block mb-1">Target Protein</span>
                    <span className="text-3xl font-extrabold text-[#22c55e] font-stat-mono">{targetProtein}</span>
                    <span className="text-xs text-[#6b7280] font-stat-mono ml-1">g/day</span>
                  </div>
                </div>

                <div className="bg-[#121316] p-3 rounded-xl border border-white/[0.07] flex items-center justify-between text-xs font-stat-mono">
                  <span className="text-[#38bdf8]">{targetCarbs}g Carbs</span>
                  <span className="text-[#fb923c]">{targetFat}g Fat</span>
                  <span className="text-[#a78bfa]">35g Fiber</span>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full py-3 bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-bold rounded-xl text-xs transition-all shadow-[0_0_16px_rgba(34,197,94,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Apply This Blueprint in EatLog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. SOCIAL PROOF & TESTIMONIALS
        ========================================================================= */}
        <section id="social-proof" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto border-t border-white/[0.07]">
          <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#f3f4f6] tracking-tight">
              Built for Athletes Who Demand Results
            </h2>
            <p className="text-sm text-[#9ca3af]">
              See why lifters, coaches, and physique athletes made EatLog their daily standard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#121316] border border-white/[0.08] rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="text-amber-400 text-sm">★★★★★</div>
                <p className="text-xs sm:text-sm text-[#f3f4f6] leading-relaxed">
                  "Logging meals used to feel like doing taxes between sets. With EatLog, I just paste my post-workout shake and rice bowl in plain English and it parses in less than a second."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.07] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-[#22c55e] font-bold text-xs flex items-center justify-center border border-emerald-800/40">
                  MS
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f3f4f6]">Marcus S.</div>
                  <div className="text-[10px] text-[#6b7280]">Competitive Powerlifter</div>
                </div>
              </div>
            </div>

            <div className="bg-[#121316] border border-white/[0.08] rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="text-amber-400 text-sm">★★★★★</div>
                <p className="text-xs sm:text-sm text-[#f3f4f6] leading-relaxed">
                  "The dark-mode HUD with big numbers for Calories and Protein is so clean. The 2.2g/kg dynamic target keeps me accountable throughout my entire 16-week hypertrophy block."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.07] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-950 text-[#38bdf8] font-bold text-xs flex items-center justify-center border border-sky-800/40">
                  DR
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f3f4f6]">Devon R.</div>
                  <div className="text-[10px] text-[#6b7280]">Physique Coach & Trainer</div>
                </div>
              </div>
            </div>

            <div className="bg-[#121316] border border-white/[0.08] rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="text-amber-400 text-sm">★★★★★</div>
                <p className="text-xs sm:text-sm text-[#f3f4f6] leading-relaxed">
                  "Finally an app that doesn't push generic starvation diets. The weekly AI coach insights actually helped me fix my intra-workout hydration and bump my calories for recovery."
                </p>
              </div>
              <div className="pt-3 border-t border-white/[0.07] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-950 text-[#facc15] font-bold text-xs flex items-center justify-center border border-amber-800/40">
                  KL
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f3f4f6]">Kara L.</div>
                  <div className="text-[10px] text-[#6b7280]">CrossFit & Hybrid Athlete</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. FINAL CALL TO ACTION BANNER
        ========================================================================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#121316] to-[#121316] border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-[0_0_64px_rgba(34,197,94,0.15)]">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#f3f4f6] tracking-tight">
                Stop Guessing Your Macros. Start Building Today.
              </h2>
              <p className="text-sm sm:text-base text-[#9ca3af]">
                Join thousands of athletes tracking with zero friction. Free forever with Google and Email sign-in.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="bottom-cta-btn"
                type="button"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-extrabold text-base transition-all duration-300 shadow-[0_0_24px_rgba(34,197,94,0.5)] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          7. MINIMALIST DARK FOOTER
      ========================================================================= */}
      <footer className="border-t border-white/[0.07] bg-[#090a0c] py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[#f3f4f6]">EatLog</span>
            </div>
            <span className="text-xs text-[#6b7280] text-center sm:text-left">© {new Date().getFullYear()} EatLog. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#9ca3af] justify-center">
            <a href="#features" className="hover:text-[#f3f4f6] transition-colors">Features</a>
            <a href="#coach" className="hover:text-[#f3f4f6] transition-colors">AI Coach</a>
            <a href="#calculator" className="hover:text-[#f3f4f6] transition-colors">Calculator</a>
            {user ? (
              <button
                type="button"
                onClick={onOpenDashboard || onGetStarted}
                className="text-[#22c55e] hover:underline font-semibold"
              >
                Open Dashboard →
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn || onGetStarted}
                className="hover:text-[#f3f4f6] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6b7280]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
