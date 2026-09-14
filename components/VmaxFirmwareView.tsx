import React, { useState } from 'react';
import { ChevronLeft, Check, Sparkles, AlertCircle, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';
import { ScooterInfo } from '../types';

interface VmaxFirmwareViewProps {
  scooterInfo: ScooterInfo;
  onBack: () => void;
  onFlash: (versionTitle: string) => void;
}

export const VmaxFirmwareView: React.FC<VmaxFirmwareViewProps> = ({
  scooterInfo,
  onBack,
  onFlash,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<'stock' | 'unlocked'>('unlocked');
  const [currentFw, setCurrentFw] = useState(scooterInfo.firmwareVersion || 'B-01.2.29');
  const [isUpdated, setIsUpdated] = useState(false);

  const model = scooterInfo.hardwareVersion ? 'VMAX_VX2_VT02' : scooterInfo.modelName;
  const hwVersion = scooterInfo.hardwareVersion || 'HW9044_V1.29';
  const controllerCode = scooterInfo.controllerCode || '02070163';

  const handleUpdate = () => {
    const targetTitle =
      selectedVersion === 'unlocked'
        ? 'VMAX VX2 Pro B-01.2.35 (35 km/h Unlock)'
        : 'VMAX VX2 Pro B-01.2.29 (Stock 20 km/h)';

    onFlash(targetTitle);
    setTimeout(() => {
      setCurrentFw(selectedVersion === 'unlocked' ? 'B-01.2.35' : 'B-01.2.29');
      setIsUpdated(true);
    }, 2500);
  };

  return (
    <div className="space-y-5 animate-slideUp">
      {/* Top Header Bar styled matching the UniScooter app */}
      <div className="relative flex items-center justify-between py-2 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center text-slate-300 hover:text-white transition p-1"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-base font-bold text-white text-center flex-1 pr-7">
          Firmware Update
        </h2>
      </div>

      {/* Controller & Model Info Table matching the user's screenshot layout */}
      <div className="space-y-2 text-sm">
        {/* Model Row */}
        <div className="bg-slate-800/60 rounded-lg px-4 py-3.5 flex justify-between items-center border border-white/5">
          <span className="text-slate-300 font-medium">Model</span>
          <span className="text-slate-100 font-mono font-semibold tracking-wide">{model}</span>
        </div>

        {/* Hardware Version Row */}
        <div className="bg-slate-800/60 rounded-lg px-4 py-3.5 flex justify-between items-center border border-white/5">
          <span className="text-slate-300 font-medium">Hardware Version</span>
          <span className="text-slate-100 font-mono font-semibold tracking-wide">{hwVersion}</span>
        </div>

        {/* Firmware Version Row */}
        <div className="bg-slate-800/60 rounded-lg px-4 py-3.5 flex justify-between items-center border border-white/5">
          <span className="text-slate-300 font-medium">Firmware Version</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-100 font-mono font-semibold tracking-wide">
              {currentFw}
            </span>
            {currentFw === 'B-01.2.35' && (
              <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded">
                TUNED
              </span>
            )}
          </div>
        </div>

        {/* Code des Controllers Row */}
        <div className="bg-slate-800/60 rounded-lg px-4 py-3.5 flex justify-between items-center border border-white/5">
          <span className="text-slate-300 font-medium">Code des Controllers</span>
          <span className="text-slate-100 font-mono font-semibold tracking-wide">
            {controllerCode}
          </span>
        </div>

        {/* Verfügbare Version Row */}
        <div className="bg-slate-800/90 rounded-lg px-4 py-3.5 border border-green-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Verfügbare Version</span>
            <span className="text-green-400 font-mono font-bold">B-01.2.35 (US/35 km/h)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setSelectedVersion('unlocked')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold border transition ${
                selectedVersion === 'unlocked'
                  ? 'bg-green-500/15 border-green-500 text-green-400'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>VMAX Tuned</span>
                {selectedVersion === 'unlocked' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[10px] font-normal text-slate-400">
                35 km/h + Zero-Start + 1300W Peak
              </p>
            </button>

            <button
              onClick={() => setSelectedVersion('stock')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold border transition ${
                selectedVersion === 'stock'
                  ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span>Stock CH/DE</span>
                {selectedVersion === 'stock' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-[10px] font-normal text-slate-400">
                20 km/h Original Werkszustand
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Info notice about VMAX VX2 Pro Controller */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start space-x-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-200">UniScooter ZYD Tech Protokoll: </span>
          Der Controller <code className="text-green-400">02070163</code> auf Hardware{' '}
          <code className="text-slate-300">HW9044_V1.29</code> unterstützt direkte Parametrierung via
          Bluetooth Low Energy (BLE).
        </div>
      </div>

      {/* Main Action Button matching screenshot ("Aktualisieren") */}
      <div className="pt-4 flex flex-col items-center">
        <button
          onClick={handleUpdate}
          className="w-4/5 sm:w-2/3 py-3.5 rounded-full bg-slate-600 hover:bg-green-500 hover:text-slate-950 text-white font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aktualisieren</span>
        </button>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          {selectedVersion === 'unlocked'
            ? 'Flash B-01.2.35 auf VMAX_VX2_VT02 Controller'
            : 'Stelle Werksfirmware B-01.2.29 wieder her'}
        </p>
      </div>
    </div>
  );
};
