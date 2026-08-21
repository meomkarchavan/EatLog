import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
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
import { auth, db } from '../firebase';

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
  const [isLoading, setIsLoading] = useState(true);

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

    return () => {
      unsubMeals();
      unsubWater();
      unsubWeight();
    };
  }, []);

  // Aggregate meal logs by YYYY-MM-DD
  const dailyTotalsMap = useMemo(() => {
    const map = {};
    for (const log of logs90Days) {
      if (!log.timestamp) continue;
      const dateKey = formatLocalDate(new Date(log.timestamp));
      if (!map[dateKey]) {
        map[dateKey] = { calories: 0, protein_g: 0 };
      }
      map[dateKey].calories += Number(log.calories) || 0;
      map[dateKey].protein_g += Number(log.protein_g) || 0;
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

      const dayData = dailyTotalsMap[dateKey] || { calories: 0, protein_g: 0 };
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

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-28">
      {/* 7-Day Averages Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein Card */}
        <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Protein Avg
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-400 tabular-nums">
              {sevenDayProteinAverage}
            </span>
            <span className="text-xs text-zinc-500 font-medium">g/d</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Target: &gt;120g</p>
        </section>

        {/* Calories Card */}
        <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Calories Avg
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-amber-400 tabular-nums">
              {sevenDayCalorieAverage}
            </span>
            <span className="text-xs text-zinc-500 font-medium">kcal</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">7-Day Mean</p>
        </section>

        {/* Water Card */}
        <section className="bg-surface-2 rounded-2xl p-4 border border-surface-3">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">
            Water Avg
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-cyan-400 tabular-nums">
              {sevenDayWaterAverage}
            </span>
            <span className="text-xs text-zinc-500 font-medium">L/d</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Hydration</p>
        </section>
      </div>

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
            <p className="text-[11px] text-zinc-500">Morning weigh-in trend</p>
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
