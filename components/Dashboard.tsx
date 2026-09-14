import React, { useState } from 'react';
import { ScooterStats, ScooterInfo } from '../types';
import { FuturisticNeonGauge } from './FuturisticNeonGauge';
import { RadialGauge } from './RadialGauge';
import { PowerConsumptionChart } from './PowerConsumptionChart';
import { BatteryDischargeChart } from './BatteryDischargeChart';
import {
  Gauge,
  Battery,
  Zap,
  Thermometer,
  Milestone,
  Cpu,
  Flame,
  CheckCircle2,
  Sliders,
  RotateCcw,
  RefreshCw,
  Binary,
  LayoutGrid,
  Radio,
} from 'lucide-react';

interface DashboardProps {
  stats: ScooterStats;
  scooterInfo?: ScooterInfo | null;
  onTuningClick: () => void;
  onOpenFirmware?: () => void;
  onUpdateStats?: (updater: (prev: ScooterStats) => ScooterStats) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  scooterInfo,
  onTuningClick,
  onOpenFirmware,
  onUpdateStats,
}) => {
  const [gaugeMode, setGaugeMode] = useState<'futuristic' | 'dual'>('futuristic');
  const [speedUnit, setSpeedUnit] = useState<'km/h' | 'mph'>('km/h');
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'battery' | 'power'>('both');

  const isVmax =
    scooterInfo?.modelName?.toLowerCase().includes('vmax') ||
    !!scooterInfo?.hardwareVersion?.includes('HW9044');

  const maxSpeedScale = isVmax
    ? 45
    : scooterInfo?.originalSpecs?.topSpeed
    ? Math.max(40, scooterInfo.originalSpecs.topSpeed + 15)
    : 45;

  const maxRange = scooterInfo?.originalSpecs?.range || 60;
  const estimatedRange = ((stats.battery / 100) * maxRange).toFixed(1);
  const tripDistance = (stats.odometer % 100).toFixed(1);

  // Quick throttle test handler
  const handleThrottleChange = (newSpeed: number) => {
    if (onUpdateStats) {
      onUpdateStats((prev) => ({
        ...prev,
        speed: Math.round(newSpeed * 10) / 10,
        current: Number((0.5 + (newSpeed / maxSpeedScale) * 22.0).toFixed(1)),
        battery: Math.max(5, Number((prev.battery - (newSpeed > 30 ? 0.05 : 0.01)).toFixed(1))),
      }));
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed < 1) return '#94a3b8';
    if (speed <= 20) return '#00f0ff';
    if (speed <= 32) return '#38bdf8';
    if (speed <= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getSpeedBadge = (speed: number) => {
    if (speed < 1) return { text: 'IDLE', bg: 'bg-slate-800', textCol: 'text-slate-400' };
    if (speed <= 20) return { text: 'ECO 20', bg: 'bg-cyan-500/20', textCol: 'text-cyan-400' };
    if (speed <= 32) return { text: 'DRIVE 32', bg: 'bg-blue-500/20', textCol: 'text-blue-400' };
    return { text: 'SPORT 35+', bg: 'bg-amber-500/20', textCol: 'text-amber-400' };
  };

  const getBatteryColor = (battery: number) => {
    if (battery >= 60) return '#00f0ff';
    if (battery >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getBatteryBadge = (battery: number) => {
    if (battery >= 60) return { text: 'HEALTHY', bg: 'bg-cyan-500/20', textCol: 'text-cyan-400' };
    if (battery >= 25) return { text: 'MEDIUM', bg: 'bg-amber-500/20', textCol: 'text-amber-400' };
    return { text: 'RECHARGE', bg: 'bg-rose-500/20', textCol: 'text-rose-400' };
  };

  return (
    <div id="scooter-dashboard" className="space-y-5 animate-fadeIn pb-16">
      {/* Scooter Header Banner */}
      {scooterInfo && (
        <div className="glass rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  {scooterInfo.manufacturer || 'Connected Scooter'}
                </p>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {scooterInfo.modelName}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Stock: {scooterInfo.originalSpecs.topSpeed} km/h
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {scooterInfo.originalSpecs.power}W (Peak 1200W)
              </p>
            </div>
          </div>

          {/* Controller & Firmware Hardware Bar */}
          {(scooterInfo.hardwareVersion || isVmax) && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center space-x-2 text-slate-400">
                <Binary className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  HW:{' '}
                  <strong className="text-slate-200">
                    {scooterInfo.hardwareVersion || 'HW9044_V1.29'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  FW:{' '}
                  <strong className="text-cyan-400">
                    {scooterInfo.firmwareVersion || 'B-01.2.29'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Ctrl:{' '}
                  <strong className="text-slate-200">
                    {scooterInfo.controllerCode || '02070163'}
                  </strong>
                </span>
              </div>

              {onOpenFirmware && (
                <button
                  onClick={onOpenFirmware}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-sans font-bold text-[11px] flex items-center space-x-1.5 border border-slate-700 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Firmware Menü</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gauge View Mode Switcher Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
            Digital Cockpit Instrument
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSpeedUnit((u) => (u === 'km/h' ? 'mph' : 'km/h'))}
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 transition"
          >
            {speedUnit.toUpperCase()}
          </button>
          <button
            onClick={() =>
              setGaugeMode((m) => (m === 'futuristic' ? 'dual' : 'futuristic'))
            }
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500/50 transition flex items-center space-x-1"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{gaugeMode === 'futuristic' ? 'Dual Gauge' : 'Futuristic HUD'}</span>
          </button>
        </div>
      </div>

      {/* PRIMARY GAUGE SECTION */}
      {gaugeMode === 'futuristic' ? (
        /* The exact Futuristic Neon Speedometer Gauge from user request link */
        <FuturisticNeonGauge
          id="futuristic-speedometer"
          speed={stats.speed}
          maxSpeed={maxSpeedScale}
          unit={speedUnit}
          battery={stats.battery}
          tripText={`T-${tripDistance}`}
          rangeText={`R-${estimatedRange}`}
        />
      ) : (
        /* Dual radial gauges fallback */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RadialGauge
            id="gauge-speed"
            value={stats.speed}
            min={0}
            max={maxSpeedScale}
            unit={speedUnit}
            title="Live Speed"
            color={getSpeedColor(stats.speed)}
            badge={getSpeedBadge(stats.speed)}
            secondaryText={
              isVmax
                ? `VMAX VX2 Pro: 35 km/h`
                : `Tuning Skala: ${maxSpeedScale} km/h`
            }
            icon={<Gauge className="w-4 h-4 text-cyan-400" />}
            size={190}
          />

          <RadialGauge
            id="gauge-battery"
            value={Math.round(stats.battery)}
            min={0}
            max={100}
            unit="%"
            title="Battery Level"
            color={getBatteryColor(stats.battery)}
            badge={getBatteryBadge(stats.battery)}
            secondaryText={`Est. Range: ~${estimatedRange} km`}
            icon={<Battery className="w-4 h-4 text-cyan-400" />}
            size={190}
          />
        </div>
      )}

      {/* Interactive Throttle & Speed Simulator Slider */}
      {onUpdateStats && (
        <div className="glass rounded-2xl p-4 space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Gashebel Simulator
              </span>
            </div>
            <button
              onClick={() => handleThrottleChange(0)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Stop</span>
            </button>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={maxSpeedScale}
              step={0.5}
              value={stats.speed}
              onChange={(e) => handleThrottleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 {speedUnit} (Stand)</span>
              <span>20 {speedUnit} (Werksdrossel)</span>
              <span>35 {speedUnit} (VMAX Pro Unlock)</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Recharts Telemetry Charts (Power Draw & Battery Discharge) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">
              Live Telemetrie Charts
            </span>
          </div>

          <div className="flex items-center space-x-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setActiveChartTab('battery')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeChartTab === 'battery'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Batterie (15 min)
            </button>
            <button
              onClick={() => setActiveChartTab('power')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeChartTab === 'power'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Leistung (60s)
            </button>
            <button
              onClick={() => setActiveChartTab('both')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeChartTab === 'both'
                  ? 'bg-slate-750 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alle
            </button>
          </div>
        </div>

        {/* Battery Discharge Curve (15 min live window) */}
        {(activeChartTab === 'battery' || activeChartTab === 'both') && (
          <BatteryDischargeChart
            battery={stats.battery}
            voltage={stats.voltage}
          />
        )}

        {/* Power Consumption Fluctuations (60s live window) */}
        {(activeChartTab === 'power' || activeChartTab === 'both') && (
          <PowerConsumptionChart
            current={stats.current}
            voltage={stats.voltage}
            maxRatedPower={scooterInfo?.originalSpecs?.power || 500}
          />
        )}
      </div>

      {/* Secondary Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TelemetryCard
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          label="Current Draw"
          value={`${stats.current.toFixed(1)} A`}
          status={`${(stats.current * stats.voltage).toFixed(0)} W Output`}
        />
        <TelemetryCard
          icon={<Battery className="w-4 h-4 text-cyan-400" />}
          label="Voltage"
          value={`${stats.voltage.toFixed(1)} V`}
          status={stats.voltage > 46 ? '48V System' : '38V Normal'}
        />
        <TelemetryCard
          icon={<Thermometer className="w-4 h-4 text-red-400" />}
          label="ESC Temp"
          value={`${stats.temperature.toFixed(1)}°C`}
          status={stats.temperature < 45 ? 'Safe Range' : 'Warm'}
        />
        <TelemetryCard
          icon={<Milestone className="w-4 h-4 text-purple-400" />}
          label="Odometer"
          value={`${stats.odometer.toFixed(1)} km`}
          status="Total Trip"
        />
      </div>

      {/* Advanced Tuning CTA Button */}
      <button
        id="btn-advanced-tuning"
        onClick={onTuningClick}
        className="w-full btn-neon text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center space-x-3 text-lg transition-transform active:scale-[0.99] shadow-[0_0_25px_rgba(0,240,255,0.3)] bg-cyan-400 hover:bg-cyan-300"
      >
        <Flame className="w-5 h-5 text-slate-950" />
        <span>OPEN ADVANCED TUNING CENTER</span>
      </button>
    </div>
  );
};

const TelemetryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  status: string;
}> = ({ icon, label, value, status }) => (
  <div className="glass p-3.5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-slate-700 transition">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <div>{icon}</div>
    </div>
    <div>
      <p className="text-lg font-black text-white font-mono tracking-tight">{value}</p>
      <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">{status}</p>
    </div>
  </div>
);
