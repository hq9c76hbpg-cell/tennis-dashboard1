import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Flame, Heart, Clock, Zap, Battery } from 'lucide-react';

interface Session {
  date: string;
  duration: string;
  durationMinutes: number;
  avgHR: number;
  maxHR: number;
  calories: number;
  steps: number;
  aerobicTE: number;
  bodyBatteryDrain: number;
}

const rawSessions: Session[] = [
  { date: '2026-05-11', duration: '1h 56m', durationMinutes: 116, avgHR: 153, maxHR: 183, calories: 895, steps: 5202, aerobicTE: 3.8, bodyBatteryDrain: -12 },
  { date: '2026-05-07', duration: '1h 59m', durationMinutes: 119, avgHR: 134, maxHR: 188, calories: 690, steps: 4418, aerobicTE: 3.1, bodyBatteryDrain: -9 },
  { date: '2026-05-03', duration: '2h 16m', durationMinutes: 136, avgHR: 136, maxHR: 172, calories: 800, steps: 4590, aerobicTE: 3.0, bodyBatteryDrain: -9 },
  { date: '2026-05-02', duration: '1h 24m', durationMinutes: 84,  avgHR: 158, maxHR: 200, calories: 763, steps: 3834, aerobicTE: 5.0, bodyBatteryDrain: -15 },
  { date: '2026-04-28', duration: '1h 58m', durationMinutes: 118, avgHR: 144, maxHR: 186, calories: 852, steps: 3802, aerobicTE: 4.1, bodyBatteryDrain: -15 },
  { date: '2026-04-26', duration: '2h 01m', durationMinutes: 121, avgHR: 148, maxHR: 188, calories: 924, steps: 4436, aerobicTE: 4.4, bodyBatteryDrain: -15 },
  { date: '2026-04-22', duration: '1h 56m', durationMinutes: 116, avgHR: 137, maxHR: 186, calories: 796, steps: 3988, aerobicTE: 3.5, bodyBatteryDrain: -12 },
  { date: '2026-04-19', duration: '1h 52m', durationMinutes: 112, avgHR: 136, maxHR: 174, calories: 738, steps: 3458, aerobicTE: 3.2, bodyBatteryDrain: -11 },
  { date: '2026-04-07', duration: '1h 39m', durationMinutes: 99,  avgHR: 149, maxHR: 189, calories: 841, steps: 4124, aerobicTE: 3.8, bodyBatteryDrain: -12 },
  { date: '2026-04-05', duration: '2h 05m', durationMinutes: 125, avgHR: 131, maxHR: 168, calories: 744, steps: 4944, aerobicTE: 2.9, bodyBatteryDrain: -9 },
  { date: '2026-03-31', duration: '1h 39m', durationMinutes: 99,  avgHR: 145, maxHR: 183, calories: 811, steps: 4320, aerobicTE: 3.6, bodyBatteryDrain: -14 },
  { date: '2026-03-29', duration: '1h 34m', durationMinutes: 94,  avgHR: 139, maxHR: 178, calories: 649, steps: 3520, aerobicTE: 3.2, bodyBatteryDrain: -7 },
  { date: '2026-03-28', duration: '1h 29m', durationMinutes: 89,  avgHR: 134, maxHR: 170, calories: 620, steps: 3688, aerobicTE: 2.8, bodyBatteryDrain: -7 },
  { date: '2026-03-27', duration: '0h 51m', durationMinutes: 51,  avgHR: 138, maxHR: 180, calories: 414, steps: 2714, aerobicTE: 2.8, bodyBatteryDrain: -8 },
];

const chartSessions = [...rawSessions].reverse();

function avg(arr: number[]) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function teBadge(te: number) {
  if (te >= 5)   return { color: 'bg-red-500/20 text-red-400 border border-red-500/30' };
  if (te >= 4)   return { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' };
  if (te >= 3)   return { color: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' };
  return { color: 'bg-zinc-600/40 text-zinc-400 border border-zinc-600/40' };
}

function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const chartData = chartSessions.map(s => ({
  date: formatDateShort(s.date),
  avgHR: s.avgHR,
  calories: s.calories,
}));

const totalSessions = rawSessions.length;
const avgCalories = avg(rawSessions.map(s => s.calories));
const avgHR = avg(rawSessions.map(s => s.avgHR));
const avgDuration = avg(rawSessions.map(s => s.durationMinutes));

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function HRTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-red-400 font-bold">{payload[0].value} bpm</p>
    </div>
  );
}

function CalTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-amber-400 font-bold">{payload[0].value} kcal</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            <span className="mr-2">🎾</span>My Tennis Dashboard
          </h1>
          <p className="text-zinc-500 text-sm">{totalSessions} sessions recorded</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Activity className="w-4 h-4" />} label="Total Sessions" value={String(totalSessions)} unit="sessions" accent="lime" />
          <StatCard icon={<Flame className="w-4 h-4" />} label="Avg Calories" value={String(avgCalories)} unit="kcal" accent="amber" />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Avg Heart Rate" value={String(avgHR)} unit="bpm" accent="red" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Avg Duration" value={formatMinutes(avgDuration)} unit="" accent="sky" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <ChartCard icon={<Heart className="w-4 h-4 text-red-400" />} title="Avg HR Trend">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<HRTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgHR"
                  stroke="#f87171"
                  strokeWidth={2.5}
                  dot={{ fill: '#f87171', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fca5a5', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard icon={<Flame className="w-4 h-4 text-amber-400" />} title="Calories per Session">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CalTooltip />} />
                <Bar dataKey="calories" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Session Log */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Session Log</h2>
          <div className="flex flex-col gap-2.5">
            {rawSessions.map((s) => {
              const badge = teBadge(s.aerobicTE);
              return (
                <div
                  key={s.date}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-5 py-4 transition-all duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-100 font-semibold text-sm leading-tight">{formatDateFull(s.date)}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.duration}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${badge.color}`}>
                        TE {s.aerobicTE.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <Metric icon={<Heart className="w-3.5 h-3.5 text-red-400" />} label="Avg HR" value={`${s.avgHR}`} unit=" bpm" />
                      <Metric icon={<Heart className="w-3.5 h-3.5 text-rose-300" />} label="Max HR" value={`${s.maxHR}`} unit=" bpm" />
                      <Metric icon={<Flame className="w-3.5 h-3.5 text-amber-400" />} label="Cal" value={`${s.calories}`} unit=" kcal" />
                      <Metric icon={<Zap className="w-3.5 h-3.5 text-lime-400" />} label="Steps" value={s.steps.toLocaleString()} unit="" />
                      <Metric icon={<Battery className="w-3.5 h-3.5 text-sky-400" />} label="Battery" value={`${s.bodyBatteryDrain}`} unit="" highlight="sky" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-center text-zinc-700 text-xs mt-10 pb-4">Data from Garmin Connect</p>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, unit, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: 'lime' | 'amber' | 'red' | 'sky';
}) {
  const styles = {
    lime:  { icon: 'text-lime-400 bg-lime-500/10 border-lime-500/20',  bar: 'bg-lime-500' },
    amber: { icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500' },
    red:   { icon: 'text-red-400 bg-red-500/10 border-red-500/20',     bar: 'bg-red-500' },
    sky:   { icon: 'text-sky-400 bg-sky-500/10 border-sky-500/20',     bar: 'bg-sky-500' },
  }[accent];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${styles.bar} opacity-40`} />
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border mb-3 ${styles.icon}`}>
        {icon}
      </div>
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-zinc-100 leading-none tabular-nums">
        {value}
        {unit && <span className="text-sm font-normal text-zinc-500 ml-1.5">{unit}</span>}
      </p>
    </div>
  );
}

function ChartCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Metric({
  icon, label, value, unit, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  highlight?: string;
}) {
  const valColor = highlight === 'sky' ? 'text-sky-300' : 'text-zinc-200';
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className={`font-semibold text-xs tabular-nums ${valColor}`}>{value}{unit}</span>
    </div>
  );
}
