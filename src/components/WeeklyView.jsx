import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { auth, db } from '../firebase';
import { calculateNutritionTargets } from '../utils/nutritionMath';
import InsightsCard from './InsightsCard';

// Helper to format Date as YYYY-MM-DD in local time
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function WeeklyView() {
  const [logs90Days, setLogs90Days] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Insights state
  const [insights, setInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(7);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Start of 90 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    startDate.setHours(0, 0, 0, 0);

    // 1. Meal Logs Listener
    const mealQuery = query(
      collection(db, 'daily_logs'),
      where('user_id', '==', uid),
      where('timestamp', '>=', startDate.toISOString()),
      orderBy('timestamp', 'asc')
    );

    const unsubMeals = onSnapshot(
      mealQuery,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
        setLogs90Days(logs);
        setIsLoading(false);
      },
      (error) => {
        console.error('WeeklyView Firestore meal error:', error);
        setIsLoading(false);
      }
    );

    // 2. Water Logs Listener
    const waterQuery = query(
      collection(db, 'water_logs'),
      where('user_id', '==', uid)
    );

    const unsubWater = onSnapshot(
      waterQuery,
      (snapshot) => {
        const wLogs = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
        setWaterLogs(wLogs);
      },
      (error) => {
        console.error('WeeklyView Firestore water error:', error);
      }
    );

    // 3. Weight Logs Listener
    const weightQuery = query(
      collection(db, 'weight_logs'),
      where('user_id', '==', uid)
    );

    const unsubWeight = onSnapshot(
      weightQuery,
      (snapshot) => {
        const wtLogs = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
        setWeightLogs(wtLogs);
      },
      (error) => {
        console.error('WeeklyView Firestore weight error:', error);
      }
    );

    // 4. User Profile Listener (for AI goals and targets)
    const profileRef = doc(db, 'user_profiles', uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setUserProfile(null);
        }
      },
      (error) => {
        console.error('WeeklyView Firestore profile error:', error);
      }
    );

    return () => {
      unsubMeals();
      unsubWater();
      unsubWeight();
      unsubProfile();
    };
  }, []);

  // Aggregate meal logs by YYYY-MM-DD
  const dailyTotalsMap = useMemo(() => {
    const map = {};
    for (const log of logs90Days) {
      if (!log.timestamp) continue;
      const dateKey = formatLocalDate(new Date(log.timestamp));
      if (!map[dateKey]) {
        map[dateKey] = {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0,
        };
      }
      map[dateKey].calories += Number(log.calories) || 0;
      map[dateKey].protein_g += Number(log.protein_g) || 0;
      map[dateKey].carbs_g += Number(log.carbs_g) || 0;
      map[dateKey].fat_g += Number(log.fat_g) || 0;
      map[dateKey].fiber_g += Number(log.fiber_g) || 0;
    }
    return map;
  }, [logs90Days]);

  // Aggregate water logs by YYYY-MM-DD
  const dailyWaterMap = useMemo(() => {
    const map = {};
    for (const w of waterLogs) {
      if (!w.date) continue;
      map[w.date] = Number(w.total_ml) || 0;
    }
    return map;
  }, [waterLogs]);

  // Aggregate weight logs by YYYY-MM-DD
  const dailyWeightMap = useMemo(() => {
    const map = {};
    for (const wt of weightLogs) {
      if (!wt.date) continue;
      map[wt.date] = wt.weight_kg !== undefined && wt.weight_kg !== null ? Number(wt.weight_kg) : null;
    }
    return map;
  }, [weightLogs]);

  // Last 7 days dataset for charts and averages
  const {
    last7DaysData,
    sevenDayProteinAverage,
    sevenDayCalorieAverage,
    sevenDayWaterAverage,
  } = useMemo(() => {
    const data = [];
    let proteinSum = 0;
    let calorieSum = 0;
    let waterSum = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = formatLocalDate(d);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

      const dayData = dailyTotalsMap[dateKey] || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
      const waterMl = dailyWaterMap[dateKey] || 0;
      const weightVal = dailyWeightMap[dateKey] ?? null;

      proteinSum += dayData.protein_g;
      calorieSum += dayData.calories;
      waterSum += waterMl;

      data.push({
        date: dateKey,
        day: dayLabel,
        calories: dayData.calories,
        protein_g: dayData.protein_g,
        carbs_g: dayData.carbs_g,
        fat_g: dayData.fat_g,
        water_ml: waterMl,
        water_l: Number((waterMl / 1000).toFixed(2)),
        weight_kg: weightVal,
      });
    }

    return {
      last7DaysData: data,
      sevenDayProteinAverage: Math.round(proteinSum / 7),
      sevenDayCalorieAverage: Math.round(calorieSum / 7),
      sevenDayWaterAverage: (waterSum / 7 / 1000).toFixed(1),
    };
  }, [dailyTotalsMap, dailyWaterMap, dailyWeightMap]);

  // 90-day consistency heatmap dataset
  const activityData = useMemo(() => {
    const calendarDays = [];
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = formatLocalDate(d);
      const dayTotals = dailyTotalsMap[dateKey];
      const protein = dayTotals ? dayTotals.protein_g : 0;

      // Level 2 (high/dark green) if > 120g, Level 1 (low/light green) if > 0g, Level 0 if 0g
      let level = 0;
      if (protein > 120) {
        level = 2;
      } else if (protein > 0) {
        level = 1;
      }

      calendarDays.push({
        date: dateKey,
        count: protein,
        level: level,
      });
    }

    return calendarDays;
  }, [dailyTotalsMap]);

  const totalTrackedProtein = activityData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const calendarTheme = {
    dark: ['#1e1e1e', '#86efac', '#15803d'],
  };

  // Helper to get aggregated daily logs for any timeframe (7, 14, 30 days)
  const getAggregatedLogsForTimeframe = (daysCount) => {
    const list = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = formatLocalDate(d);
      const totals = dailyTotalsMap[dateKey] || {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
      };

      list.push({
        date: dateKey,
        calories: totals.calories,
        protein_g: totals.protein_g,
        carbs_g: totals.carbs_g,
        fat_g: totals.fat_g,
        fiber_g: totals.fiber_g,
      });
    }
    return list;
  };

  // Timeframe change handler - resets insights as required
  const handleTimeframeChange = (newDays) => {
    const parsed = Number(newDays);
    setTimeframe(parsed);
    setInsights(null);
    setError(null);
  };

  // Handle AI analysis request
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const targets = calculateNutritionTargets(userProfile || {});
      const profilePayload = {
        goal: userProfile?.goal || 'maintain',
        targetCalories: targets.targetCalories,
        targetMacros: targets.targetMacros,
        bmr: targets.bmr,
        tdee: targets.tdee,
        current_weight_kg: userProfile?.current_weight_kg || userProfile?.baseline_weight_kg,
        height_cm: userProfile?.height_cm,
        age: userProfile?.age,
        gender: userProfile?.gender,
        activity_level: userProfile?.activity_level,
      };

      const logsPayload = getAggregatedLogsForTimeframe(timeframe);

      const res = await fetch('/api/analyzeLogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profilePayload,
          timeframe_days: timeframe,
          logs: logsPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setInsights(data);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      setError(err.message || 'Failed to analyze nutrition logs. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recharts custom tooltip style matching DESIGN.md
  const tooltipContentStyle = {
    backgroundColor: '#1a1c22',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#f3f4f6',
    fontSize: '12px',
    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
    padding: '8px 12px',
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-28">
      {/* 7-Day Averages Summary Grid — always 3 cols */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Protein Card */}
        <section className="bg-[#121316] rounded-2xl p-3 sm:p-5 border border-white/[0.08] border-t-2 border-t-[#22c55e] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] transition-all hover:border-white/[0.15]">
          <p className="text-[#9ca3af] text-[9px] sm:text-xs font-semibold uppercase tracking-wider mb-1 truncate">
            Protein Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
            <span className="text-xl sm:text-3xl font-extrabold text-[#22c55e] font-stat-mono leading-none tracking-tight">
              {sevenDayProteinAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6b7280] font-stat-mono font-medium">g/d</span>
          </div>
          <p className="text-[9px] sm:text-[11px] text-[#6b7280] mt-1 truncate font-mono">&gt;120g target</p>
        </section>

        {/* Calories Card */}
        <section className="bg-[#121316] rounded-2xl p-3 sm:p-5 border border-white/[0.08] border-t-2 border-t-[#facc15] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] transition-all hover:border-white/[0.15]">
          <p className="text-[#9ca3af] text-[9px] sm:text-xs font-semibold uppercase tracking-wider mb-1 truncate">
            Calories Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
            <span className="text-xl sm:text-3xl font-extrabold text-[#facc15] font-stat-mono leading-none tracking-tight">
              {sevenDayCalorieAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6b7280] font-stat-mono font-medium">kcal</span>
          </div>
          <p className="text-[9px] sm:text-[11px] text-[#6b7280] mt-1 truncate font-mono">7-Day Mean</p>
        </section>

        {/* Water Card */}
        <section className="bg-[#121316] rounded-2xl p-3 sm:p-5 border border-white/[0.08] border-t-2 border-t-[#38bdf8] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] transition-all hover:border-white/[0.15]">
          <p className="text-[#9ca3af] text-[9px] sm:text-xs font-semibold uppercase tracking-wider mb-1 truncate">
            Water Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
            <span className="text-xl sm:text-3xl font-extrabold text-[#38bdf8] font-stat-mono leading-none tracking-tight">
              {sevenDayWaterAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6b7280] font-stat-mono font-medium">L/d</span>
          </div>
          <p className="text-[9px] sm:text-[11px] text-[#6b7280] mt-1 truncate font-mono">Hydration</p>
        </section>
      </div>


      {/* AI Nutrition Coach Section */}
      <section className="bg-[#121316] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#f3f4f6] tracking-tight">
                AI Nutrition Coach
              </h3>
              <p className="text-xs text-[#9ca3af]">
                Personalized nutritional insights & actionable coaching
              </p>
            </div>
          </div>

          {/* Timeframe selector dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="timeframe-select" className="text-xs text-[#9ca3af] font-medium whitespace-nowrap font-mono">
              Timeframe:
            </label>
            <select
              id="timeframe-select"
              aria-label="Timeframe selector"
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-[#1a1c22] text-[#f3f4f6] text-xs font-semibold rounded-xl px-3 py-2 border border-white/[0.08] outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all cursor-pointer"
            >
              <option value={7} className="bg-[#121316]">Last 7 Days</option>
              <option value={14} className="bg-[#121316]">Last 14 Days</option>
              <option value={30} className="bg-[#121316]">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        {isAnalyzing ? (
          <button
            id="analyze-data-btn"
            type="button"
            disabled
            className="w-full bg-[#1a1c22] border border-white/[0.08] text-[#9ca3af] font-medium text-xs sm:text-sm rounded-xl py-3 px-4 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[#22c55e]" />
            <span>Analyzing {timeframe} Days of Nutrition...</span>
          </button>
        ) : insights ? (
          <button
            id="analyze-data-btn"
            type="button"
            onClick={handleAnalyze}
            className="w-full border border-teal-500/40 hover:border-teal-500/70 bg-teal-950/30 hover:bg-teal-950/50 text-teal-300 font-bold text-xs sm:text-sm rounded-xl py-3 px-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>↻ Refresh Analysis ({timeframe} Days)</span>
          </button>
        ) : (
          <button
            id="analyze-data-btn"
            type="button"
            onClick={handleAnalyze}
            className="w-full bg-[#22c55e] hover:bg-emerald-400 text-[#090a0c] font-bold text-xs sm:text-sm rounded-xl py-3 px-4 shadow-[0_0_16px_rgba(34,197,94,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ Analyze My Data ({timeframe} Days)</span>
          </button>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Render InsightsCard when analysis is available */}
        {insights && (
          <div className="pt-2">
            <InsightsCard data={insights} days={timeframe} />
          </div>
        )}
      </section>

      {/* 2x2 Responsive Charts Grid on Desktop / Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Chart 1: Daily Protein Bar Chart (Neon Green #22c55e) */}
        <section className="bg-[#121316] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f3f4f6] tracking-tight">
                Daily Protein (Last 7 Days)
              </h3>
              <p className="text-[11px] text-[#6b7280]">Track daily muscle recovery goals</p>
            </div>
            <span className="text-xs text-[#22c55e] font-bold font-stat-mono">Grams</span>
          </div>
          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(val) => [`${val}g`, 'Protein']}
                  labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
                />
                <Bar dataKey="protein_g" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Daily Calories Line Chart (Neon Amber/Gold #facc15) */}
        <section className="bg-[#121316] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f3f4f6] tracking-tight">
                Daily Calories (Last 7 Days)
              </h3>
              <p className="text-[11px] text-[#6b7280]">Energy intake trend</p>
            </div>
            <span className="text-xs text-[#facc15] font-bold font-stat-mono">Kcal</span>
          </div>
          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(val) => [`${val} kcal`, 'Calories']}
                  labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ fill: '#facc15', r: 4 }}
                  activeDot={{ r: 6, fill: '#f3f4f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 3: Daily Water Intake Bar Chart (Neon Sky Blue #38bdf8) */}
        <section className="bg-[#121316] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f3f4f6] tracking-tight">
                Daily Water Intake (Last 7 Days)
              </h3>
              <p className="text-[11px] text-[#6b7280]">Hydration volume</p>
            </div>
            <span className="text-xs text-[#38bdf8] font-bold font-stat-mono">Liters</span>
          </div>
          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(val) => [`${val} L (${Number((val * 1000).toFixed(0))} ml)`, 'Water']}
                  labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
                />
                <Bar dataKey="water_l" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 4: Daily Body Weight Line Chart (Neon Pink #f472b6) */}
        <section className="bg-[#121316] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f3f4f6] tracking-tight">
                Body Weight (Last 7 Days)
              </h3>
              <p className="text-[11px] text-[#6b7280]">Body weight trend</p>
            </div>
            <span className="text-xs text-[#f472b6] font-bold font-stat-mono">Kilograms</span>
          </div>
          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(val) => [val !== null && val !== undefined ? `${val} kg` : 'No entry', 'Weight']}
                  labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
                />
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="#f472b6"
                  strokeWidth={3}
                  connectNulls
                  dot={{ fill: '#f472b6', r: 4 }}
                  activeDot={{ r: 6, fill: '#f3f4f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 90-Day Consistency Heatmap */}
      <section className="bg-[#121316] rounded-2xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)] overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#f3f4f6] tracking-tight">
              90-Day Protein Consistency
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Dark green indicates &gt;120g target achieved
            </p>
          </div>
          <span className="text-xs text-[#22c55e] font-bold font-stat-mono whitespace-nowrap">
            {totalTrackedProtein}g Tracked
          </span>
        </div>

        {/* Heatmap display — centered with bleed scroll on narrow viewports */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 flex justify-center">
          {isLoading ? (
            <div className="text-[#6b7280] text-xs py-6 font-mono">Loading consistency data...</div>
          ) : (
            <ActivityCalendar
              data={activityData}
              theme={calendarTheme}
              colorScheme="dark"
              maxLevel={2}
              blockSize={13}
              blockMargin={3.5}
              fontSize={11}
              showWeekdayLabels
              hideColorLegend
              hideTotalCount
              labels={{
                months: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
              }}
            />
          )}
        </div>

        {/* Threshold legend — centered and aligned */}
        <div className="flex items-center justify-center gap-5 sm:gap-8 text-[11px] sm:text-xs text-[#6b7280] pt-3 border-t border-white/[0.06] mt-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-[#1e1e1e] inline-block border border-zinc-700" />
            <span>0g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-[#86efac] inline-block" />
            <span>1–120g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-[#15803d] inline-block" />
            <span>&gt;120g</span>
          </div>
        </div>
      </section>


    </div>
  );
}
