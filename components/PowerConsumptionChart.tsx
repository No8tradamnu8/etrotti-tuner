import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Zap, Activity, TrendingUp, Cpu } from 'lucide-react';

interface PowerDataPoint {
  time: string;
  timestamp: number;
  power: number;
  current: number;
  voltage: number;
}

interface PowerConsumptionChartProps {
  current: number;
  voltage: number;
  maxRatedPower?: number;
}

export const PowerConsumptionChart: React.FC<PowerConsumptionChartProps> = ({
  current,
  voltage,
  maxRatedPower = 500,
}) => {
  // Pre-seed 60 seconds of baseline history so the user sees real-time trend immediately
  const [history, setHistory] = useState<PowerDataPoint[]>(() => {
    const now = Date.now();
    const initialPoints: PowerDataPoint[] = [];
    const basePower = Math.max(10, Math.round(current * voltage));

    for (let i = 59; i >= 0; i--) {
      const ts = now - i * 1000;
      const date = new Date(ts);
      const timeStr = date.toTimeString().split(' ')[0].slice(3); // "mm:ss"
      // slight realistic drift around initial value
      const jitter = (Math.sin(i / 4) * 0.15 + (Math.random() - 0.5) * 0.05) * basePower;
      const pointPower = Math.max(0, Math.round(basePower + jitter));

      initialPoints.push({
        time: timeStr,
        timestamp: ts,
        power: pointPower,
        current: Number((pointPower / (voltage || 48)).toFixed(1)),
        voltage: Number(voltage.toFixed(1)),
      });
    }
    return initialPoints;
  });

  const latestRef = useRef({ current, voltage });
  useEffect(() => {
    latestRef.current = { current, voltage };
  }, [current, voltage]);

  // Append a live data point every second and keep strict 60s sliding window
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const date = new Date(now);
      const timeStr = date.toTimeString().split(' ')[0].slice(3); // "mm:ss"
      const cur = latestRef.current.current;
      const volt = latestRef.current.voltage;
      const livePower = Math.max(0, Math.round(cur * volt));

      setHistory((prev) => {
        const newPoint: PowerDataPoint = {
          time: timeStr,
          timestamp: now,
          power: livePower,
          current: Number(cur.toFixed(1)),
          voltage: Number(volt.toFixed(1)),
        };

        const cutoff = now - 60000; // strictly last 60 seconds
        const filtered = prev.filter((p) => p.timestamp >= cutoff);
        return [...filtered, newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute live statistics over the 60-second buffer
  const stats = useMemo(() => {
    if (!history.length) {
      return { currentPower: 0, peakPower: 0, avgPower: 0, minPower: 0 };
    }
    const currentPower = Math.round(current * voltage);
    let peak = 0;
    let sum = 0;
    let min = Infinity;

    for (const p of history) {
      if (p.power > peak) peak = p.power;
      if (p.power < min) min = p.power;
      sum += p.power;
    }

    const avg = Math.round(sum / history.length);
    return {
      currentPower,
      peakPower: Math.max(peak, currentPower),
      avgPower: avg,
      minPower: min === Infinity ? 0 : min,
    };
  }, [history, current, voltage]);

  return (
    <div
      id="power-consumption-chart"
      className="glass rounded-2xl p-4 sm:p-5 border border-cyan-500/20 bg-gradient-to-b from-[#0b1329]/90 to-[#070d1e]/90 shadow-[0_0_30px_rgba(0,240,255,0.06)] space-y-4"
    >
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Leistungsaufnahme (Power Draw)
              </h3>
              <span className="flex items-center space-x-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>60s Live</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Echtzeit-Ermittlung: P = I ({current.toFixed(1)} A) × U ({voltage.toFixed(1)} V)
            </p>
          </div>
        </div>

        {/* Mini stats counters */}
        <div className="grid grid-cols-3 gap-2 text-right">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center sm:text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
              Aktuell
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-cyan-400">
              {stats.currentPower} <span className="text-[10px] font-normal text-slate-400">W</span>
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center sm:text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
              Ø 60 Sek
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-amber-400">
              {stats.avgPower} <span className="text-[10px] font-normal text-slate-400">W</span>
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center sm:text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
              Peak (60s)
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-rose-400">
              {stats.peakPower} <span className="text-[10px] font-normal text-slate-400">W</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-52 sm:h-56 relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="powerLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.7} />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#475569"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              minTickGap={25}
            />

            <YAxis
              stroke="#475569"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              domain={[0, (dataMax: number) => Math.max(Math.ceil((dataMax + 100) / 100) * 100, maxRatedPower + 100)]}
              unit="W"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PowerDataPoint;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs">
                      <div className="flex items-center justify-between space-x-3 mb-1">
                        <span className="text-slate-400 text-[10px] font-mono">{data.time}</span>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">Live Sensor</span>
                      </div>
                      <p className="text-cyan-300 font-extrabold text-base font-mono">
                        {data.power} <span className="text-xs text-slate-300">Watt</span>
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex space-x-2">
                        <span>Strom: <strong className="text-amber-300">{data.current}A</strong></span>
                        <span>Spannung: <strong className="text-slate-200">{data.voltage}V</strong></span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference line indicating rated nominal power */}
            {maxRatedPower > 0 && (
              <ReferenceLine
                y={maxRatedPower}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: `Nennleistung ${maxRatedPower}W`,
                  fill: '#f59e0b',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="power"
              stroke="url(#powerLineGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#00f0ff',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span className="flex items-center space-x-1.5">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>Sliding Window: 60 Sekunden (1 Sek. Abtastrate)</span>
        </span>
        <span className="flex items-center space-x-1.5 text-slate-500">
          <TrendingUp className="w-3 h-3 text-amber-400" />
          <span>Dynamische Lastkurve bei Beschleunigung &amp; Rekuperation</span>
        </span>
      </div>
    </div>
  );
};
