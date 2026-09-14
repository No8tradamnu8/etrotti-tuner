import React, { useState } from 'react';
import { TuningOption, ScooterInfo } from '../types';
import {
  ArrowLeft,
  AlertTriangle,
  Cpu,
  Sliders,
  RefreshCw,
  Zap,
  CheckCircle2,
  Binary,
} from 'lucide-react';

interface TuningPanelProps {
  tuningOptions: TuningOption[];
  scooterInfo?: ScooterInfo | null;
  onFlash: (title: string) => void;
  onOpenFirmware?: () => void;
  onBack: () => void;
}

export const TuningPanel: React.FC<TuningPanelProps> = ({
  tuningOptions,
  scooterInfo,
  onFlash,
  onOpenFirmware,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'options' | 'parameters'>('options');
  const isVmax =
    scooterInfo?.modelName?.toLowerCase().includes('vmax') || !!scooterInfo?.hardwareVersion;

  return (
    <div className="space-y-5 animate-slideUp pb-16">
      <div className="flex items-center space-x-4 mb-2">
        <button
          onClick={onBack}
          className="glass p-3 rounded-full hover:bg-slate-700 transition flex items-center justify-center text-slate-300 hover:text-white"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
            Tuning Center
          </h2>
          <p className="text-[11px] text-slate-400">
            {scooterInfo?.modelName || 'E-Scooter'} • Firmware Patches &amp; Parameter
          </p>
        </div>
      </div>

      {/* VMAX Specific UniScooter Firmware Banner if VMAX detected */}
      {isVmax && onOpenFirmware && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  UniScooter Firmware Tool
                </span>
                <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded">
                  {scooterInfo?.hardwareVersion || 'HW9044_V1.29'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Model: {scooterInfo?.hardwareVersion ? 'VMAX_VX2_VT02' : 'VMAX VX2 Pro'} • FW:{' '}
                {scooterInfo?.firmwareVersion || 'B-01.2.29'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFirmware}
            className="px-3 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-black text-xs uppercase tracking-wider transition whitespace-nowrap active:scale-95 shadow"
          >
            ÖFFNEN
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-800/80 rounded-xl p-1 mb-4 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('options')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
            activeTab === 'options'
              ? 'bg-green-500 text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>PRESETS &amp; HACKS</span>
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
            activeTab === 'parameters'
              ? 'bg-green-500 text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>PARAM EDIT</span>
        </button>
      </div>

      {activeTab === 'options' ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {tuningOptions.map((option, idx) => (
            <div
              key={idx}
              className="glass p-5 rounded-2xl border-l-4 border-green-500 hover:border-green-400 transition cursor-pointer group hover:bg-slate-800/60"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-black text-base text-white group-hover:text-green-400 transition">
                  {option.title}
                </h3>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${
                    option.riskLevel === 'Low'
                      ? 'bg-green-500/20 text-green-400'
                      : option.riskLevel === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {option.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{option.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                <span className="text-xs font-mono text-green-400">
                  <span className="text-slate-500 mr-1">Effekt:</span>
                  {option.possibleGains}
                </span>
                <button
                  onClick={() => onFlash(option.title)}
                  className="bg-slate-800 hover:bg-green-500 hover:text-slate-950 border border-slate-700 hover:border-green-500 px-4 py-2 rounded-xl text-xs font-black transition uppercase tracking-wider"
                >
                  FLASHEN
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5 glass p-5 rounded-2xl border border-white/5">
          <ParameterSlider
            label="Max Speed (Sport Mode)"
            unit="km/h"
            min={15}
            max={isVmax ? 35 : 45}
            defaultValue={isVmax ? 35 : 32}
          />
          <ParameterSlider
            label="Motor Peak Power (48V)"
            unit="W"
            min={250}
            max={isVmax ? 1300 : 1200}
            defaultValue={isVmax ? 1200 : 850}
          />
          <ParameterSlider
            label="Battery Phase Current"
            unit="A"
            min={15}
            max={45}
            defaultValue={isVmax ? 30 : 28}
          />
          <ParameterSlider
            label="KERS / Rekuperation"
            unit="%"
            min={0}
            max={100}
            defaultValue={35}
          />
          <ParameterSlider
            label="Zero-Start (Direktanfahrt ohne Treten)"
            unit="Aktiv"
            min={0}
            max={1}
            defaultValue={1}
            isToggle
          />
          <ParameterSlider
            label="Tempomat (Cruise Control)"
            unit="Aktiv"
            min={0}
            max={1}
            defaultValue={1}
            isToggle
          />

          <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-400 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <p className="leading-relaxed">
              Beim VMAX VX2 Pro (ZYD Tech HW9044 Controller) bleiben thermische Schutzschaltungen
              aktiv. Parameter werden direkt über BLE in den Speicher geschrieben.
            </p>
          </div>

          <button
            onClick={() => onFlash('Custom VMAX VX2 Controller Configuration')}
            className="w-full btn-neon py-3.5 rounded-xl text-slate-950 font-black uppercase tracking-wider text-sm transition"
          >
            WRITE CONFIG TO SCOOTER
          </button>
        </div>
      )}
    </div>
  );
};

const ParameterSlider: React.FC<{
  label: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  isToggle?: boolean;
}> = ({ label, unit, min, max, defaultValue, isToggle }) => {
  const [val, setVal] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="text-green-400 font-mono">
          {isToggle ? (val ? 'AN (Enabled)' : 'AUS (Disabled)') : `${val} ${unit}`}
        </span>
      </div>
      {isToggle ? (
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setVal(val ? 0 : 1)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              val ? 'bg-green-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                val ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {val ? 'Freigeschaltet' : 'Gesperrt'}
          </span>
        </div>
      ) : (
        <input
          type="range"
          min={min}
          max={max}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
      )}
    </div>
  );
};
