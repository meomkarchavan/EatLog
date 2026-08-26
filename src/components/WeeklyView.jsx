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

  return (
    <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-28">
      {/* 7-Day Averages Summary Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Protein Card */}
        <section className="bg-surface-2 rounded-2xl p-2.5 sm:p-4 border border-surface-3">
          <p className="text-zinc-500 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-1 truncate">
            Protein Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-xl sm:text-3xl font-black text-emerald-400 tabular-nums">
              {sevenDayProteinAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">g/d</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-1 truncate">Target: &gt;120g</p>
        </section>

        {/* Calories Card */}
        <section className="bg-surface-2 rounded-2xl p-2.5 sm:p-4 border border-surface-3">
          <p className="text-zinc-500 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-1 truncate">
            Calories Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-xl sm:text-3xl font-black text-amber-400 tabular-nums">
              {sevenDayCalorieAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">kcal</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-1 truncate">7-Day Mean</p>
        </section>

        {/* Water Card */}
        <section className="bg-surface-2 rounded-2xl p-2.5 sm:p-4 border border-surface-3">
          <p className="text-zinc-500 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-1 truncate">
            Water Avg
          </p>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-xl sm:text-3xl font-black text-cyan-400 tabular-nums">
              {sevenDayWaterAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">L/d</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-1 truncate">Hydration</p>
        </section>
      </div>

      {/* AI Nutrition Coach Section */}
      <section className="bg-surface-2 rounded-2xl p-4 sm:p-5 border border-surface-3 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                AI Nutrition Coach
              </h3>
              <p className="text-[11px] text-zinc-400">
                Personalized nutritional insights & actionable coaching
              </p>
            </div>
          </div>

          {/* Timeframe selector dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="timeframe-select" className="text-xs text-zinc-400 font-medium whitespace-nowrap">
              Timeframe:
            </label>
            <select
              id="timeframe-select"
              aria-label="Timeframe selector"
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-surface-3 text-white text-xs font-semibold rounded-xl px-3 py-2 border border-zinc-700/60 outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        {isAnalyzing ? (
          <button
            id="analyze-data-btn"
            type="button"
            disabled
            className="w-full bg-surface-3 border border-zinc-700/50 text-zinc-300 font-medium text-xs rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Analyzing {timeframe} Days of Nutrition...</span>
          </button>
        ) : insights ? (
          <button
            id="analyze-data-btn"
            type="button"
            onClick={handleAnalyze}
            className="w-full border border-teal-500/40 hover:border-teal-500/70 bg-teal-950/20 hover:bg-teal-950/40 text-teal-400 font-semibold text-xs rounded-xl py-2.5 px-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>↻ Refresh Analysis ({timeframe} Days)</span>
          </button>
        ) : (
          <button
            id="analyze-data-btn"
            type="button"
            onClick={handleAnalyze}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm rounded-xl py-3 px-4 shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ Analyze My Data ({timeframe} Days)</span>
          </button>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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

      {/* Chart 1: Daily Protein Bar Chart */}
      <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Daily Protein (Last 7 Days)
            </h3>
            <p className="text-[11px] text-zinc-500">Track daily muscle recovery goals</p>
          </div>
          <span className="text-xs text-emerald-400 font-medium font-mono">Grams</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val}g`, 'Protein']}
                labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
              />
              <Bar dataKey="protein_g" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Daily Calories Line Chart */}
      <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Daily Calories (Last 7 Days)
            </h3>
            <p className="text-[11px] text-zinc-500">Energy intake trend</p>
          </div>
          <span className="text-xs text-amber-400 font-medium font-mono">Kcal</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val} kcal`, 'Calories']}
                labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 3: Daily Water Intake Bar Chart */}
      <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Daily Water Intake (Last 7 Days)
            </h3>
            <p className="text-[11px] text-zinc-500">Hydration volume</p>
          </div>
          <span className="text-xs text-cyan-400 font-medium font-mono">Liters</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val} L (${val * 1000} ml)`, 'Water']}
                labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
              />
              <Bar dataKey="water_l" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 4: Daily Body Weight Line Chart */}
      <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Body Weight (Last 7 Days)
            </h3>
            <p className="text-[11px] text-zinc-500">Body weight trend</p>
          </div>
          <span className="text-xs text-purple-400 font-medium font-mono">Kilograms</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [val !== null && val !== undefined ? `${val} kg` : 'No entry', 'Weight']}
                labelFormatter={(label, items) => items?.[0]?.payload?.date || label}
              />
              <Line
                type="monotone"
                dataKey="weight_kg"
                stroke="#c084fc"
                strokeWidth={3}
                connectNulls
                dot={{ fill: '#c084fc', r: 4 }}
                activeDot={{ r: 6, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 90-Day Consistency Heatmap */}
      <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              90-Day Protein Consistency
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Dark green indicates &gt;120g target achieved
            </p>
          </div>
        </div>

        <div className="overflow-x-auto py-2 flex justify-center">
          {isLoading ? (
            <div className="text-zinc-600 text-xs py-6">Loading consistency data...</div>
          ) : (
            <ActivityCalendar
              data={activityData}
              theme={calendarTheme}
              colorScheme="dark"
              maxLevel={2}
              blockSize={12}
              blockMargin={3}
              fontSize={11}
              showWeekdayLabels
              labels={{
                legend: {
                  less: '0g',
                  more: '>120g',
                },
                months: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ],
                totalCount: '{{count}}g protein tracked in 90 days',
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-surface-3 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#1e1e1e] inline-block border border-zinc-700" />
            <span>0g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#86efac] inline-block" />
            <span>1–120g</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#15803d] inline-block" />
            <span>&gt;120g</span>
          </div>
        </div>
      </section>
    </div>
  );
}
