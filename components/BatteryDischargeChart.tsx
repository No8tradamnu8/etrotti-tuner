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
import { Battery, BatteryCharging, TrendingDown, Clock, ShieldCheck, Zap } from 'lucide-react';

interface BatteryDataPoint {
  time: string;
  timestamp: number;
  battery: number;
  voltage: number;
}

interface BatteryDischargeChartProps {
  battery: number;
  voltage: number;
}

export const BatteryDischargeChart: React.FC<BatteryDischargeChartProps> = ({
  battery,
  voltage,
}) => {
  const [metricMode, setMetricMode] = useState<'both' | 'battery' | 'voltage'>('both');

  // Pre-seed 15 minutes of realistic discharge telemetry (sampled every 15s = 60 points)
  const [history, setHistory] = useState<BatteryDataPoint[]>(() => {
    const now = Date.now();
    const points: BatteryDataPoint[] = [];
    const totalPoints = 60; // 60 points * 15s = 900s = 15 minutes
    const stepMs = 15000;

    // Simulate natural discharge slope over 15 minutes prior to current value
    // e.g. 15 minutes ago battery was ~2.5% higher and voltage ~0.8V higher
    const historicalDropPercent = 2.4;
    const historicalDropVoltage = 0.6;

    for (let i = totalPoints - 1; i >= 0; i--) {
      const ts = now - i * stepMs;
      const date = new Date(ts);
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      const progress = (totalPoints - 1 - i) / (totalPoints - 1); // 0 at -15m, 1 now
      const baseBat = battery + (1 - progress) * historicalDropPercent;
      const baseVolt = voltage + (1 - progress) * historicalDropVoltage;

      // Small realistic chemical impedance jitter
      const batJitter = (Math.sin(i / 3) * 0.08);
      const voltJitter = (Math.cos(i / 2) * 0.05);

      points.push({
        time: timeStr,
        timestamp: ts,
        battery: Number(Math.min(100, Math.max(0, baseBat + batJitter)).toFixed(1)),
        voltage: Number(Math.max(30, baseVolt + voltJitter).toFixed(1)),
      });
    }
    return points;
  });

  const latestRef = useRef({ battery, voltage });
  useEffect(() => {
    latestRef.current = { battery, voltage };
  }, [battery, voltage]);

  // Live updates: append new data point every 15 seconds, maintain strict 15-min rolling window
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const date = new Date(now);
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      const curBat = latestRef.current.battery;
      const curVolt = latestRef.current.voltage;

      setHistory((prev) => {
        const newPoint: BatteryDataPoint = {
          time: timeStr,
          timestamp: now,
          battery: Number(curBat.toFixed(1)),
          voltage: Number(curVolt.toFixed(1)),
        };

        const cutoff = now - 15 * 60 * 1000; // strictly last 15 minutes
        const filtered = prev.filter((p) => p.timestamp >= cutoff);
        return [...filtered, newPoint];
      });
    }, 15000); // 15 second intervals

    return () => clearInterval(interval);
  }, []);

  // Compute 15-minute telemetry analytics
  const analytics = useMemo(() => {
    if (!history.length) {
      return { startBattery: battery, drop: 0, dropRate: '0.0%/h', minVolt: voltage, maxVolt: voltage };
    }
    const startPoint = history[0];
    const endPoint = history[history.length - 1];
    const drop = Number((startPoint.battery - endPoint.battery).toFixed(1));
    const voltDrop = Number((startPoint.voltage - endPoint.voltage).toFixed(1));

    // Extrapolate drop rate per hour
    const ratePerHour = Math.max(0, drop * 4).toFixed(1);

    return {
      startBattery: startPoint.battery,
      drop,
      voltDrop,
      dropRate: `${ratePerHour}%/h`,
      minVolt: Math.min(...history.map((h) => h.voltage)),
      maxVolt: Math.max(...history.map((h) => h.voltage)),
    };
  }, [history, battery, voltage]);

  const minBatDomain = Math.max(0, Math.floor((battery - 8) / 5) * 5);
  const maxBatDomain = Math.min(100, Math.ceil((battery + 8) / 5) * 5);

  return (
    <div
      id="battery-discharge-chart"
      className="glass rounded-2xl p-4 sm:p-5 border border-emerald-500/25 bg-gradient-to-b from-[#061e1a]/85 via-[#081523]/90 to-[#070d1e]/90 shadow-[0_0_30px_rgba(16,185,129,0.08)] space-y-4"
    >
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Batterie-Entladekurve (Discharge)
              </h3>
              <span className="flex items-center space-x-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>15 Min Fenster</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live-Entladeverlauf &amp; Spannungsabfall der letzten 15 Minuten
            </p>
          </div>
        </div>

        {/* View toggle (Battery % vs Voltage vs Both) */}
        <div className="flex items-center space-x-1 self-end sm:self-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-[11px] font-bold">
          <button
            onClick={() => setMetricMode('both')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'both'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Beide
          </button>
          <button
            onClick={() => setMetricMode('battery')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'battery'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SoC %
          </button>
          <button
            onClick={() => setMetricMode('voltage')}
            className={`px-2.5 py-1 rounded-lg transition ${
              metricMode === 'voltage'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volt (V)
          </button>
        </div>
      </div>

      {/* Stats counter strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Aktueller SoC
          </span>
          <span className="text-base font-black font-mono text-emerald-400">
            {battery.toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Pack-Spannung
          </span>
          <span className="text-base font-black font-mono text-amber-400">
            {voltage.toFixed(1)} <span className="text-xs font-normal text-slate-400">V</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Verbrauch (15m)
          </span>
          <span className="text-base font-black font-mono text-cyan-300">
            -{analytics.drop}%{' '}
            <span className="text-[10px] text-slate-400 font-normal">({analytics.voltDrop}V)</span>
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
            Entladerate
          </span>
          <span className="text-base font-black font-mono text-slate-200">
            ~{analytics.dropRate}
          </span>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-52 sm:h-60 relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 10, right: metricMode === 'both' ? 12 : 5, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="batteryGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity={1} />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="voltGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
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
              minTickGap={35}
            />

            {/* Left Y-Axis for Battery Percentage */}
            {(metricMode === 'both' || metricMode === 'battery') && (
              <YAxis
                yAxisId="batAxis"
                stroke="#10b981"
                tick={{ fontSize: 10, fill: '#10b981' }}
                tickLine={false}
                domain={[minBatDomain, maxBatDomain]}
                unit="%"
              />
            )}

            {/* Right Y-Axis for Voltage */}
            {(metricMode === 'both' || metricMode === 'voltage') && (
              <YAxis
                yAxisId="voltAxis"
                orientation={metricMode === 'both' ? 'right' : 'left'}
                stroke="#f59e0b"
                tick={{ fontSize: 10, fill: '#f59e0b' }}
                tickLine={false}
                domain={[
                  (dataMin: number) => Math.max(30, Math.floor(dataMin - 1)),
                  (dataMax: number) => Math.ceil(dataMax + 1),
                ]}
                unit="V"
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as BatteryDataPoint;
                  return (
                    <div className="bg-slate-900/95 border border-emerald-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs">
                      <div className="flex items-center justify-between space-x-4 mb-1">
                        <span className="text-slate-400 text-[10px] font-mono">{data.time} Uhr</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">15m Telemetrie</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-emerald-400 font-extrabold text-sm font-mono flex items-center justify-between">
                          <span>Ladestand:</span>
                          <span>{data.battery}%</span>
                        </p>
                        <p className="text-amber-400 font-bold text-xs font-mono flex items-center justify-between">
                          <span>Zellspannung:</span>
                          <span>{data.voltage} V</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* 20% Critical Warning Line */}
            <ReferenceLine
              yAxisId="batAxis"
              y={20}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: '20% Reserve',
                fill: '#ef4444',
                fontSize: 9,
                position: 'insideBottomRight',
              }}
            />

            {(metricMode === 'both' || metricMode === 'battery') && (
              <Line
                yAxisId="batAxis"
                type="monotone"
                dataKey="battery"
                name="Batterie (%)"
                stroke="url(#batteryGrad)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#10b981',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}

            {(metricMode === 'both' || metricMode === 'voltage') && (
              <Line
                yAxisId="voltAxis"
                type="monotone"
                dataKey="voltage"
                name="Spannung (V)"
                stroke="url(#voltGrad)"
                strokeWidth={2}
                strokeDasharray={metricMode === 'both' ? '4 3' : undefined}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#f59e0b',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span className="flex items-center space-x-1.5">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>Zeitachse: Letzte 15 Minuten (Abtastung alle 15 Sek.)</span>
        </span>
        <span className="flex items-center space-x-1.5 text-slate-500">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          <span>BMS Entladekurve &amp; Spannungsstabilität aktiv überwacht</span>
        </span>
      </div>
    </div>
  );
};
