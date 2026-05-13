import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useMemo, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Activity, Flame, Heart, Clock, Zap, Battery, Thermometer, ChevronDown, Upload, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'tennis-sessions';
const STORAGE_VERSION = 1;

interface Session {
  date: string;
  duration: string;
  durationMinutes: number;
  avgHR: number;
  maxHR: number;
  calories: number;
  steps: number;
  bodyBatteryDrain: number;
  tempF: number;
  hrZones?: { zone: string; minutes: number; color: string }[];
  aerobicTE?: number;
  anaerobicTE?: number;
  primaryBenefit?: string;
  trainingLoad?: number;
  sweatLoss?: number;
  startBattery?: number;
  endBattery?: number;
  restingHR?: number;
}

const rawSessions: Session[] = [
  {
    date: '2026-05-11',
    duration: '1h 56m',
    durationMinutes: 116,
    avgHR: 153,
    maxHR: 183,
    calories: 895,
    steps: 5202,
    aerobicTE: 3.8,
    bodyBatteryDrain: -12,
    tempF: 76,
    hrZones: [
      { zone: 'Zone 1', minutes: 0, color: '#94a3b8' },
      { zone: 'Zone 2', minutes: 1, color: '#60a5fa' },
      { zone: 'Zone 3', minutes: 11, color: '#34d399' },
      { zone: 'Zone 4', minutes: 72, color: '#fb923c' },
      { zone: 'Zone 5', minutes: 31, color: '#f87171' },
      { zone: 'Zone 6', minutes: 1, color: '#e11d48' },
    ],
    anaerobicTE: 3.4,
    primaryBenefit: 'Sprint',
    trainingLoad: 278,
    sweatLoss: 1767,
    startBattery: 28,
    endBattery: 16,
    restingHR: 64,
  },
  { date: '2026-05-07', duration: '1h 59m', durationMinutes: 119, avgHR: 134, maxHR: 188, calories: 690, steps: 4418, aerobicTE: 3.1, bodyBatteryDrain: -9, tempF: 72, anaerobicTE: 1.8, trainingLoad: 182 },
  { date: '2026-05-03', duration: '2h 16m', durationMinutes: 136, avgHR: 136, maxHR: 172, calories: 800, steps: 4590, aerobicTE: 3.0, bodyBatteryDrain: -9, tempF: 75, primaryBenefit: 'Tempo' },
  { date: '2026-05-02', duration: '1h 24m', durationMinutes: 84,  avgHR: 158, maxHR: 200, calories: 763, steps: 3834, aerobicTE: 5.0, bodyBatteryDrain: -15, tempF: 85, trainingLoad: 310, restingHR: 62 },
  { date: '2026-04-28', duration: '1h 58m', durationMinutes: 118, avgHR: 144, maxHR: 186, calories: 852, steps: 3802, aerobicTE: 4.1, bodyBatteryDrain: -15, tempF: 71 },
  { date: '2026-04-26', duration: '2h 01m', durationMinutes: 121, avgHR: 148, maxHR: 188, calories: 924, steps: 4436, aerobicTE: 4.4, bodyBatteryDrain: -15, tempF: 73 },
  { date: '2026-04-22', duration: '1h 56m', durationMinutes: 116, avgHR: 137, maxHR: 186, calories: 796, steps: 3988, aerobicTE: 3.5, bodyBatteryDrain: -12, tempF: 67 },
  { date: '2026-04-19', duration: '1h 52m', durationMinutes: 112, avgHR: 136, maxHR: 174, calories: 738, steps: 3458, aerobicTE: 3.2, bodyBatteryDrain: -11, tempF: 64 },
  { date: '2026-04-07', duration: '1h 39m', durationMinutes: 99,  avgHR: 149, maxHR: 189, calories: 841, steps: 4124, aerobicTE: 3.8, bodyBatteryDrain: -12, tempF: 66 },
  { date: '2026-04-05', duration: '2h 05m', durationMinutes: 125, avgHR: 131, maxHR: 168, calories: 744, steps: 4944, aerobicTE: 2.9, bodyBatteryDrain: -9, tempF: 60 },
  { date: '2026-03-31', duration: '1h 39m', durationMinutes: 99,  avgHR: 145, maxHR: 183, calories: 811, steps: 4320, aerobicTE: 3.6, bodyBatteryDrain: -14, tempF: 68 },
  { date: '2026-03-29', duration: '1h 34m', durationMinutes: 94,  avgHR: 139, maxHR: 178, calories: 649, steps: 3520, aerobicTE: 3.2, bodyBatteryDrain: -7, tempF: 66 },
  { date: '2026-03-28', duration: '1h 29m', durationMinutes: 89,  avgHR: 134, maxHR: 170, calories: 620, steps: 3688, aerobicTE: 2.8, bodyBatteryDrain: -7, tempF: 64 },
  { date: '2026-03-27', duration: '0h 51m', durationMinutes: 51,  avgHR: 138, maxHR: 180, calories: 414, steps: 2714, aerobicTE: 2.8, bodyBatteryDrain: -8, tempF: 63 },
];

function cloneSessions(sessions: Session[]): Session[] {
  return JSON.parse(JSON.stringify(sessions)) as Session[];
}

interface StoredSessions {
  version: number;
  importedAt: string;
  sessions: Session[];
}

function loadStoredSessions(): StoredSessions | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSessions>;
    if (
      !parsed ||
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.sessions) ||
      typeof parsed.importedAt !== 'string'
    ) {
      return null;
    }
    return { version: parsed.version, importedAt: parsed.importedAt, sessions: parsed.sessions };
  } catch {
    return null;
  }
}

function saveStoredSessions(sessions: Session[]): string {
  const importedAt = new Date().toISOString();
  if (typeof window === 'undefined' || !window.localStorage) return importedAt;
  try {
    const payload: StoredSessions = { version: STORAGE_VERSION, importedAt, sessions };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private-mode failures — UI still reflects the in-memory state
  }
  return importedAt;
}

function clearStoredSessions(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function formatImportedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeCsvRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/^\ufeff/, '').trim();
    out[key] = v === null || v === undefined ? '' : String(v).trim();
  }
  return out;
}

function csvCell(row: Record<string, string>, ...names: string[]): string {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

/** Parse "H:MM:SS" or "MM:SS" into total minutes (rounded). */
function parseHmsToDurationMinutes(time: string): number {
  const cleaned = time.trim();
  if (!cleaned) return 0;
  const parts = cleaned.split(':').map((p) => parseInt(/-?\d+/.exec(p)?.[0] ?? '0', 10) || 0);
  if (parts.length >= 3) {
    const [h, m, s] = parts;
    return Math.round(h * 60 + m + s / 60);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return Math.round(m + s / 60);
  }
  if (parts.length === 1) return parts[0] || 0;
  return 0;
}

function parseGarminDateToIso(dateStr: string): string | null {
  const t = dateStr.trim();
  if (!t) return null;
  const isoStart = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoStart) {
    return `${isoStart[1]}-${isoStart[2].padStart(2, '0')}-${isoStart[3].padStart(2, '0')}`;
  }
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseNumLoose(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Garmin drain is shown as a loss — store as a negative number. */
function parseBodyBatteryDrain(s: string): number {
  const n = parseFloat(String(s).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return 0;
  if (n > 0) return -Math.abs(n);
  return n;
}

function avg(arr: number[]) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function parseTennisSessionsFromGarminCsv(text: string): { sessions: Session[]; errors: string[] } {
  const errors: string[] = [];
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  });
  for (const e of parsed.errors.slice(0, 5)) {
    if (e.message) errors.push(e.message);
  }
  const rows = parsed.data ?? [];
  const out: Session[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    if (!raw || typeof raw !== 'object') continue;
    const row = normalizeCsvRow(raw);
    const activityType = csvCell(row, 'Activity Type').trim();
    if (activityType !== 'Tennis' && activityType.toLowerCase() !== 'tennis') continue;

    const dateIso = parseGarminDateToIso(csvCell(row, 'Date'));
    if (!dateIso) {
      errors.push(`Skipped row ${i + 2}: could not parse date "${csvCell(row, 'Date')}"`);
      continue;
    }

    const timeStr = csvCell(row, 'Time');
    const durationMinutes = parseHmsToDurationMinutes(timeStr);
    const duration = formatMinutes(durationMinutes);

    const calories = Math.round(parseNumLoose(csvCell(row, 'Calories')));
    const avgHR = Math.round(parseNumLoose(csvCell(row, 'Avg HR', 'Average HR')));
    const maxHR = Math.round(parseNumLoose(csvCell(row, 'Max HR')));
    const aerobicRaw = csvCell(row, 'Aerobic TE');
    const aerobicTE = aerobicRaw === '' ? undefined : parseNumLoose(aerobicRaw);
    const steps = Math.round(parseNumLoose(csvCell(row, 'Steps')));
    const bodyBatteryDrain = parseBodyBatteryDrain(csvCell(row, 'Body Battery Drain'));

    out.push({
      date: dateIso,
      duration,
      durationMinutes,
      avgHR,
      maxHR,
      calories,
      steps,
      aerobicTE,
      bodyBatteryDrain,
      tempF: 0,
    });
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { sessions: out, errors };
}

function teBadge(te: number | undefined) {
  if (te === undefined) return { color: 'bg-zinc-600/40 text-zinc-400 border border-zinc-600/40' };
  if (te >= 5)   return { color: 'bg-red-500/20 text-red-400 border border-red-500/30' };
  if (te >= 4)   return { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' };
  if (te >= 3)   return { color: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' };
  return { color: 'bg-zinc-600/40 text-zinc-400 border border-zinc-600/40' };
}

function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const yy = String(d.getFullYear()).slice(-2);
  return `${month} ${day} '${yy}`;
}

function formatDateFull(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Least-squares regression y = slope * x + intercept for paired (x, y) samples. */
function leastSquaresLine(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  const n = xs.length;
  if (n < 2 || xs.length !== ys.length) return null;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) {
    return { slope: 0, intercept: sumY / n };
  }
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

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

interface ScatterTooltipPayload {
  tempF: number;
  avgHR: number;
  date: string;
}

function TempHrScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ScatterTooltipPayload }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!p?.date) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-zinc-300 font-medium mb-1.5">{formatDateFull(p.date)}</p>
      <p className="text-sky-400">
        <span className="text-zinc-500">Temp </span>
        <span className="font-bold tabular-nums">{p.tempF}°F</span>
      </p>
      <p className="text-red-400 mt-0.5">
        <span className="text-zinc-500">Avg HR </span>
        <span className="font-bold tabular-nums">{p.avgHR} bpm</span>
      </p>
    </div>
  );
}

interface Highlight {
  emoji: string;
  label: string;
  value: string;
  subtext?: string;
}

function HighlightCard({ emoji, label, value, subtext }: Highlight) {
  return (
    <div className="shrink-0 w-[240px] md:w-auto snap-start bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col">
      <div className="text-3xl leading-none mb-2.5" aria-hidden>{emoji}</div>
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-extrabold text-zinc-100 leading-tight tabular-nums break-words">{value}</p>
      {subtext && <p className="text-[11px] text-zinc-500 mt-1.5 leading-snug">{subtext}</p>}
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-zinc-100 tabular-nums leading-tight">{value}</p>
    </div>
  );
}

function SessionDetailPanel({ session: s }: { session: Session }) {
  const zones = s.hrZones;
  const zoneTotal = zones?.reduce((acc, z) => acc + z.minutes, 0) ?? 0;
  const hasZoneBar = zones && zones.length > 0 && zoneTotal > 0;

  return (
    <div className="border-t border-zinc-800/90 px-5 pb-5 pt-4 space-y-5 bg-zinc-950/30">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Heart rate zones</p>
        {hasZoneBar ? (
          <>
            <div className="flex h-4 w-full min-w-0 rounded-lg overflow-hidden ring-1 ring-zinc-800">
              {zones!.map((z) =>
                z.minutes > 0 ? (
                  <div
                    key={z.zone}
                    className="min-w-[3px] transition-[flex-grow] duration-300"
                    style={{ flexGrow: z.minutes, flexBasis: 0, backgroundColor: z.color }}
                    title={`${z.zone}: ${z.minutes} min`}
                  />
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
              {zones!.map((z) => (
                <div key={z.zone} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-zinc-700/80" style={{ backgroundColor: z.color }} />
                  <span className="text-zinc-400">{z.zone}</span>
                  <span className="tabular-nums text-zinc-200 font-medium">{z.minutes}m</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500 leading-relaxed bg-zinc-950/50 border border-zinc-800 rounded-xl px-3.5 py-3">
            Detailed zone data not available — export FIT file from Garmin Connect to unlock
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Training effect & load</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <DetailStat
            label="Aerobic TE"
            value={typeof s.aerobicTE === 'number' ? s.aerobicTE.toFixed(1) : '—'}
          />
          <DetailStat
            label="Anaerobic TE"
            value={typeof s.anaerobicTE === 'number' ? s.anaerobicTE.toFixed(1) : '—'}
          />
          <div className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 px-3 py-2.5 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Primary benefit</p>
            {s.primaryBenefit ? (
              <span className="inline-flex items-center rounded-full border border-violet-500/35 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
                {s.primaryBenefit}
              </span>
            ) : (
              <p className="text-sm font-semibold text-zinc-500">—</p>
            )}
          </div>
          <DetailStat label="Training load" value={typeof s.trainingLoad === 'number' ? String(s.trainingLoad) : '—'} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Fluids & recovery</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <DetailStat label="Sweat loss" value={typeof s.sweatLoss === 'number' ? `${s.sweatLoss} ml` : '—'} />
          <DetailStat label="Start battery" value={typeof s.startBattery === 'number' ? String(s.startBattery) : '—'} />
          <DetailStat label="End battery" value={typeof s.endBattery === 'number' ? String(s.endBattery) : '—'} />
          <DetailStat label="Resting HR" value={typeof s.restingHR === 'number' ? `${s.restingHR} bpm` : '—'} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initialStored = useMemo(() => loadStoredSessions(), []);
  const [sessions, setSessions] = useState<Session[]>(() =>
    initialStored ? initialStored.sessions : cloneSessions(rawSessions),
  );
  const [usingFallbackData, setUsingFallbackData] = useState(() => initialStored == null);
  const [lastImportedAt, setLastImportedAt] = useState<string | null>(() => initialStored?.importedAt ?? null);
  const [expandedSessionKey, setExpandedSessionKey] = useState<string | null>(null);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chartSessions = useMemo(() => [...sessions].reverse(), [sessions]);
  const chartData = useMemo(
    () =>
      chartSessions.map((s) => ({
        date: formatDateShort(s.date),
        avgHR: s.avgHR,
        calories: s.calories,
      })),
    [chartSessions],
  );
  /** Recharts `interval`: show tick every (interval+1) points — skip labels when crowded. */
  const chartDateAxisInterval = useMemo(() => {
    const n = chartData.length;
    if (n <= 8) return 0;
    const targetVisible = 7;
    const step = Math.max(2, Math.ceil(n / targetVisible));
    return step - 1;
  }, [chartData.length]);
  const tempHrScatterData = useMemo(
    () =>
      sessions.map((s) => ({
        tempF: s.tempF,
        avgHR: s.avgHR,
        date: s.date,
      })),
    [sessions],
  );
  const tempHrRegression = useMemo(() => {
    const xs = tempHrScatterData.map((d) => d.tempF);
    const ys = tempHrScatterData.map((d) => d.avgHR);
    return leastSquaresLine(xs, ys);
  }, [tempHrScatterData]);
  const tempHrTrendLineData = useMemo(() => {
    if (tempHrScatterData.length === 0) return [];
    const xs = tempHrScatterData.map((d) => d.tempF);
    const pad = 2;
    const xMin = Math.min(...xs) - pad;
    const xMax = Math.max(...xs) + pad;
    if (tempHrRegression == null) return [];
    return [
      { tempF: xMin, avgHR: tempHrRegression.slope * xMin + tempHrRegression.intercept },
      { tempF: xMax, avgHR: tempHrRegression.slope * xMax + tempHrRegression.intercept },
    ];
  }, [tempHrScatterData, tempHrRegression]);

  // Garmin sometimes records sessions that weren't manually stopped — drop anything
  // longer than 5 hours when computing duration-based stats so a single outlier
  // doesn't dominate "Longest Session", "Total Hours on Court", or "Avg Duration".
  const MAX_SANE_DURATION_MINUTES = 180;
  const saneDurationSessions = useMemo(
    () => sessions.filter((s) => s.durationMinutes <= MAX_SANE_DURATION_MINUTES),
    [sessions],
  );

  const totalSessions = sessions.length;
  const avgCalories = avg(sessions.map((s) => s.calories));
  const avgHR = avg(sessions.map((s) => s.avgHR));
  const avgDuration = avg(saneDurationSessions.map((s) => s.durationMinutes));

  const highlights = useMemo<Highlight[]>(() => {
    if (sessions.length === 0) return [];

    const durationPool = sessions.filter((s) => s.durationMinutes <= MAX_SANE_DURATION_MINUTES);
    const longest = durationPool.length > 0
      ? durationPool.reduce((a, b) => (b.durationMinutes > a.durationMinutes ? b : a))
      : null;
    const highestHR = sessions.reduce((a, b) => (b.avgHR > a.avgHR ? b : a));
    const mostCal = sessions.reduce((a, b) => (b.calories > a.calories ? b : a));
    const lowestBattery = sessions.reduce((a, b) => (b.bodyBatteryDrain < a.bodyBatteryDrain ? b : a));

    let peakTE: Session | null = null;
    for (const s of sessions) {
      if (typeof s.aerobicTE !== 'number') continue;
      if (peakTE == null || s.aerobicTE > (peakTE.aerobicTE ?? -Infinity)) peakTE = s;
    }

    const dayCounts = new Map<string, number>();
    for (const s of sessions) {
      const d = new Date(s.date + 'T00:00:00');
      if (Number.isNaN(d.getTime())) continue;
      const name = d.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts.set(name, (dayCounts.get(name) ?? 0) + 1);
    }
    let favoriteDay: { day: string; count: number } | null = null;
    for (const [day, count] of dayCounts) {
      if (!favoriteDay || count > favoriteDay.count) favoriteDay = { day, count };
    }

    const totalMinutes = durationPool.reduce((acc, s) => acc + s.durationMinutes, 0);

    const cards: Highlight[] = [
      { emoji: '🔥', label: 'Highest Avg HR', value: `${highestHR.avgHR} bpm`, subtext: formatDateFull(highestHR.date) },
      { emoji: '⚡', label: 'Most Calories', value: `${mostCal.calories} kcal`, subtext: formatDateFull(mostCal.date) },
    ];
    if (longest) {
      cards.unshift({
        emoji: '🏆',
        label: 'Longest Session',
        value: longest.duration,
        subtext: formatDateFull(longest.date),
      });
    }
    if (peakTE && typeof peakTE.aerobicTE === 'number') {
      cards.push({
        emoji: '💪',
        label: 'Peak Training Effect',
        value: peakTE.aerobicTE.toFixed(1),
        subtext: `Peak Performance · ${formatDateFull(peakTE.date)}`,
      });
    }
    cards.push({
      emoji: '🔋',
      label: 'Lowest Body Battery Played On',
      value: String(lowestBattery.bodyBatteryDrain),
      subtext: formatDateFull(lowestBattery.date),
    });
    if (favoriteDay) {
      cards.push({
        emoji: '📅',
        label: 'Favorite Day',
        value: favoriteDay.day,
        subtext: `${favoriteDay.count} session${favoriteDay.count === 1 ? '' : 's'} on ${favoriteDay.day}s`,
      });
    }
    // Time-of-Day Vibe is skipped — Session.date carries no hour data right now.
    cards.push({
      emoji: '📈',
      label: 'Total Hours on Court',
      value: formatMinutes(totalMinutes),
      subtext: `Across ${durationPool.length} session${durationPool.length === 1 ? '' : 's'}`,
    });

    return cards;
  }, [sessions]);

  useEffect(() => {
    if (!csvSuccessMessage) return;
    const t = window.setTimeout(() => setCsvSuccessMessage(null), 6500);
    return () => window.clearTimeout(t);
  }, [csvSuccessMessage]);

  const processCsvText = (text: string) => {
    setCsvErrorMessage(null);
    setCsvSuccessMessage(null);
    const { sessions: imported, errors } = parseTennisSessionsFromGarminCsv(text);
    if (imported.length === 0) {
      setCsvErrorMessage(
        errors[0] ??
          'No Tennis activities found. Export your activities CSV from Garmin Connect and ensure the Activity Type column includes "Tennis".',
      );
      return;
    }
    const importedAt = saveStoredSessions(imported);
    setSessions(imported);
    setUsingFallbackData(false);
    setLastImportedAt(importedAt);
    setExpandedSessionKey(null);
    setCsvSuccessMessage(`Imported ${imported.length} tennis session${imported.length === 1 ? '' : 's'} from CSV.`);
  };

  const handleResetToSample = () => {
    clearStoredSessions();
    setSessions(cloneSessions(rawSessions));
    setUsingFallbackData(true);
    setLastImportedAt(null);
    setExpandedSessionKey(null);
    setCsvErrorMessage(null);
    setCsvSuccessMessage('Cleared imported data — showing sample sessions.');
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvErrorMessage('Please choose a .csv file.');
      setCsvSuccessMessage(null);
      return;
    }
    file.text().then(processCsvText).catch(() => {
      setCsvErrorMessage('Could not read that file.');
      setCsvSuccessMessage(null);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            <span className="mr-2">🎾</span>Shaunak's Personalized Tennis Dashboard
          </h1>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-zinc-500 text-sm">{totalSessions} sessions recorded</p>
            {usingFallbackData && (
              <span className="text-[11px] text-zinc-600 font-medium tracking-wide">· using sample data</span>
            )}
          </div>
        </header>

        {/* CSV import */}
        <div className="mb-8 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              handleFile(f);
            }}
            className={`group w-full rounded-xl border border-dashed px-4 py-5 text-center transition-colors duration-200 cursor-pointer select-none
              ${dragActive ? 'border-sky-500/60 bg-sky-500/5' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/70'}
            `}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-500 group-hover:text-zinc-400 transition-colors" aria-hidden />
            <p className="text-sm font-medium text-zinc-300">Drop your Garmin Activities CSV here</p>
            <p className="text-[11px] text-zinc-600 mt-1">or click to browse · Tennis activities only</p>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-1">
            <p className="text-[11px] text-zinc-500 tabular-nums">
              {lastImportedAt
                ? <>Last imported: <span className="text-zinc-400">{formatImportedAt(lastImportedAt)}</span></>
                : <span className="text-zinc-600">No CSV imported yet</span>}
            </p>
            {!usingFallbackData && (
              <button
                type="button"
                onClick={handleResetToSample}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
                title="Clear imported data and revert to sample sessions"
              >
                <RotateCcw className="w-3 h-3" aria-hidden />
                Clear data
              </button>
            )}
          </div>
          {csvSuccessMessage && (
            <p className="text-xs font-medium text-emerald-400/90 pl-1" role="status">
              {csvSuccessMessage}
            </p>
          )}
          {csvErrorMessage && (
            <p className="text-xs font-medium text-amber-400/90 pl-1" role="alert">
              {csvErrorMessage}
            </p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Activity className="w-4 h-4" />} label="Total Sessions" value={String(totalSessions)} unit="sessions" accent="lime" />
          <StatCard icon={<Flame className="w-4 h-4" />} label="Avg Calories" value={String(avgCalories)} unit="kcal" accent="amber" />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Avg Heart Rate" value={String(avgHR)} unit="bpm" accent="red" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Avg Duration" value={formatMinutes(avgDuration)} unit="" accent="sky" />
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Highlights</h2>
              <button
                type="button"
                onClick={() => setHighlightsOpen((o) => !o)}
                aria-expanded={highlightsOpen}
                aria-controls="highlights-panel"
                className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
              >
                {highlightsOpen ? 'Hide highlights' : 'Show highlights'}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-300 ${highlightsOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
            </div>
            <div
              id="highlights-panel"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                highlightsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div
                className={`overflow-hidden min-h-0 ${!highlightsOpen ? 'pointer-events-none' : ''}`}
                aria-hidden={!highlightsOpen}
              >
                <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory pb-2 pt-1">
                  {highlights.map((h) => (
                    <HighlightCard key={h.label} {...h} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <ChartCard icon={<Heart className="w-4 h-4 text-red-400" />} title="Avg HR Trend">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -14, bottom: 28 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  interval={chartDateAxisInterval}
                  minTickGap={8}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  angle={-32}
                  textAnchor="end"
                  height={44}
                  axisLine={false}
                  tickLine={false}
                />
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
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -14, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="date"
                  interval={chartDateAxisInterval}
                  minTickGap={8}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  angle={-32}
                  textAnchor="end"
                  height={44}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CalTooltip />} />
                <Bar dataKey="calories" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mb-8">
          <ChartCard icon={<Thermometer className="w-4 h-4 text-sky-400" />} title="Temperature vs Avg HR">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart margin={{ top: 5, right: 16, left: 4, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  dataKey="tempF"
                  name="Temperature"
                  unit=" °F"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Temperature (°F)', position: 'insideBottom', offset: -18, fill: '#71717a', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="avgHR"
                  name="Avg HR"
                  unit=" bpm"
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Avg HR (bpm)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11, offset: 8 }}
                />
                <Tooltip content={<TempHrScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#52525b' }} />
                <Line
                  type="linear"
                  data={tempHrTrendLineData}
                  dataKey="avgHR"
                  stroke="#9bd4e8"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  isAnimationActive={false}
                />
                <Scatter name="Sessions" data={tempHrScatterData} fill="#38bdf8" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Session Log */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Session Log</h2>
          <div className="flex flex-col gap-2.5">
            {sessions.map((s, idx) => {
              const badge = teBadge(s.aerobicTE);
              const rowKey = `${idx}-${s.date}`;
              const isOpen = expandedSessionKey === rowKey;
              return (
                <div
                  key={rowKey}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-[box-shadow] duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSessionKey(isOpen ? null : rowKey)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-100 font-semibold text-sm leading-tight">{formatDateFull(s.date)}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" /> {s.duration}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${badge.color}`}>
                        TE {typeof s.aerobicTE === 'number' ? s.aerobicTE.toFixed(1) : '—'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <Metric icon={<Heart className="w-3.5 h-3.5 text-red-400" />} label="Avg HR" value={`${s.avgHR}`} unit=" bpm" />
                        <Metric icon={<Heart className="w-3.5 h-3.5 text-rose-300" />} label="Max HR" value={`${s.maxHR}`} unit=" bpm" />
                        <Metric icon={<Flame className="w-3.5 h-3.5 text-amber-400" />} label="Cal" value={`${s.calories}`} unit=" kcal" />
                        <Metric icon={<Zap className="w-3.5 h-3.5 text-lime-400" />} label="Steps" value={s.steps.toLocaleString()} unit="" />
                        <Metric icon={<Battery className="w-3.5 h-3.5 text-sky-400" />} label="Battery" value={`${s.bodyBatteryDrain}`} unit="" highlight="sky" />
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-zinc-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div
                      className={`overflow-hidden min-h-0 ${!isOpen ? 'pointer-events-none' : ''}`}
                      aria-hidden={!isOpen}
                    >
                      <SessionDetailPanel session={s} />
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
