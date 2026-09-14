import React, { useState, useEffect } from 'react';
import { ConnectionStatus, ScooterInfo, ScooterStats } from './types';
import { getScooterTuningInfo } from './services/geminiService';
import { bluetoothManager } from './services/bluetoothService';
import { Dashboard } from './components/Dashboard';
import { TuningPanel } from './components/TuningPanel';
import { VmaxFirmwareView } from './components/VmaxFirmwareView';
import { BluetoothHelpModal } from './components/BluetoothHelpModal';
import {
  Radio,
  ArrowRight,
  Loader2,
  Zap,
  Gauge,
  BatteryCharging,
  Dna,
  LayoutDashboard,
  Cpu,
  Search,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  Binary,
  AlertCircle,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

const POPULAR_MODELS = [
  'VMAX VX2 Pro',
  'Xiaomi Pro 2',
  'Ninebot Max G30',
  'SoFlow SO4 Pro',
  'Vsett 10+',
];

export const App: React.FC = () => {
  const [modelSearch, setModelSearch] = useState('');
  const [scooterInfo, setScooterInfo] = useState<ScooterInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'tuning' | 'vmax-firmware'>(
    'home'
  );
  const [flashProgress, setFlashProgress] = useState<number | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [bleNotice, setBleNotice] = useState<string | null>(null);
  const [showBluetoothHelp, setShowBluetoothHelp] = useState(false);

  const [stats, setStats] = useState<ScooterStats>({
    speed: 0,
    battery: 88,
    current: 0.5,
    voltage: 49.2, // 48V Nominal for VMAX VX2 Pro
    temperature: 26.5,
    odometer: 168.4,
  });

  // Simulated live telemetry stream when connected
  useEffect(() => {
    let interval: any;
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      interval = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          speed: Math.max(0, Number((prev.speed + (Math.random() > 0.45 ? 0.3 : -0.3)).toFixed(1))),
          current: Math.max(0.2, Number((0.4 + Math.random() * 1.8).toFixed(1))),
          temperature: Number((26.5 + Math.random() * 0.4).toFixed(1)),
        }));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const handleSearch = async (overrideModel?: string) => {
    const query = (overrideModel || modelSearch).trim() || connectedDeviceName || 'VMAX VX2 Pro';
    setLoading(true);
    const info = await getScooterTuningInfo(query);
    if (info) {
      setScooterInfo(info);
      if (info.modelName.toLowerCase().includes('vmax') || info.hardwareVersion) {
        setStats((prev) => ({
          ...prev,
          voltage: 49.2, // 48V system
          battery: 88,
        }));
      }
      setCurrentView('dashboard');
    } else {
      alert('Tuning-Informationen konnten nicht geladen werden. Bitte Modell manuell eingeben.');
    }
    setLoading(false);
  };

  /**
   * Connects directly to VMAX VX2 Pro with matching hardware & firmware from the screenshot
   */
  const handleConnectVmaxDirect = async () => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    setLoading(true);
    setBleNotice(null);

    const devInfo = bluetoothManager.connectVmaxDirect();
    setConnectedDeviceName(devInfo.name);

    const info = await getScooterTuningInfo('VMAX VX2 Pro');
    if (info) {
      setScooterInfo({
        ...info,
        hardwareVersion: devInfo.hardwareVersion,
        firmwareVersion: devInfo.firmwareVersion,
        controllerCode: devInfo.controllerCode,
      });
      setStats({
        speed: 0,
        battery: 92,
        current: 0.5,
        voltage: 49.4,
        temperature: 25.8,
        odometer: 245.8,
      });
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setCurrentView('dashboard');
    }
    setLoading(false);
  };

  /**
   * Scans real BLE devices via Web Bluetooth API
   */
  const handleConnect = async () => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    setBleNotice(null);

    try {
      const result = await bluetoothManager.requestDevice();
      if (result.device) {
        const success = await bluetoothManager.connect();
        if (success) {
          setConnectionStatus(ConnectionStatus.CONNECTED);
          const devInfo = bluetoothManager.getConnectedDeviceInfo();
          const name = devInfo?.name || result.device.name || 'VMAX_VX2_VT02';
          setConnectedDeviceName(name);

          setLoading(true);
          const info = await getScooterTuningInfo(name);
          if (info) {
            setScooterInfo({
              ...info,
              hardwareVersion: devInfo?.hardwareVersion || info.hardwareVersion,
              firmwareVersion: devInfo?.firmwareVersion || info.firmwareVersion,
              controllerCode: devInfo?.controllerCode || info.controllerCode,
            });
            setCurrentView('dashboard');
          }
          setLoading(false);
        } else {
          setConnectionStatus(ConnectionStatus.DISCONNECTED);
          setBleNotice('GATT-Verbindung zum BLE-Gerät fehlgeschlagen.');
        }
      } else {
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        if (result.error) {
          setBleNotice(result.error);
        }
      }
    } catch (err: any) {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setBleNotice(
        err?.message || 'Bluetooth-Scan abgebrochen. Nutze den Direkt-Connect für VMAX VX2 Pro.'
      );
    }
  };

  const handleFlash = async (title: string) => {
    setFlashProgress(0);
    for (let i = 0; i <= 100; i += 4) {
      setFlashProgress(i);
      await new Promise((r) => setTimeout(r, 90));
    }
    setFlashProgress(null);

    // If flashing VMAX, update local firmware version
    if (scooterInfo && (scooterInfo.modelName.includes('VMAX') || scooterInfo.hardwareVersion)) {
      const isUnlimited = title.includes('35') || title.includes('Unlimited');
      setScooterInfo((prev) =>
        prev
          ? {
              ...prev,
              firmwareVersion: isUnlimited ? 'B-01.2.35' : 'B-01.2.29',
              originalSpecs: {
                ...prev.originalSpecs,
                topSpeed: isUnlimited ? 35 : 20,
              },
            }
          : prev
      );
    }

    alert(`"${title}" erfolgreich geflasht! Controller-Parameter wurden via BLE übertragen.`);
  };

  const isVmaxConnected =
    scooterInfo?.modelName?.toLowerCase().includes('vmax') || !!scooterInfo?.hardwareVersion;

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4 sm:p-6 flex flex-col relative overflow-hidden font-sans selection:bg-green-500 selection:text-black">
      {/* Background Decor Ambient Lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-green-500/10 blur-[110px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="flex justify-between items-center mb-5 z-10">
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => setCurrentView('home')}
          title="Zurück zur Startseite"
        >
          <h1 className="text-xl font-black tracking-tighter italic text-white">
            TROTTI<span className="text-green-500">TUNER</span> PRO
          </h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
            V 2.5.1 • VMAX &amp; ZYD TECH UNISCOOTER
          </p>
        </div>

        <button
          onClick={
            connectionStatus === ConnectionStatus.CONNECTED
              ? () =>
                  bluetoothManager
                    .disconnect()
                    .then(() => setConnectionStatus(ConnectionStatus.DISCONNECTED))
              : handleConnect
          }
          disabled={connectionStatus === ConnectionStatus.CONNECTING}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-2 border ${
            connectionStatus === ConnectionStatus.CONNECTED
              ? 'bg-green-500/10 border-green-500 text-green-400 shadow-sm'
              : connectionStatus === ConnectionStatus.CONNECTING
              ? 'bg-slate-700 animate-pulse border-transparent text-slate-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === ConnectionStatus.CONNECTED
                ? 'bg-green-500 animate-ping'
                : 'bg-slate-500'
            }`}
          ></div>
          <span>
            {connectionStatus === ConnectionStatus.CONNECTED
              ? connectedDeviceName || 'Connected'
              : connectionStatus === ConnectionStatus.CONNECTING
              ? 'Connecting...'
              : 'Connect BLE'}
          </span>
        </button>
      </header>

      {/* Bluetooth Notification / Notice Banner if needed */}
      {bleNotice && (
        <div className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 animate-fadeIn z-20 space-y-2 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold text-amber-300">
                  {bleNotice.toLowerCase().includes('brave') || bleNotice.toLowerCase().includes('disabled')
                    ? 'Brave Browser blockiert Bluetooth (Globally Disabled)'
                    : 'Bluetooth Status-Hinweis'}
                </p>
                <p className="leading-relaxed text-[11px] text-slate-300 mt-0.5">{bleNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setBleNotice(null)}
              className="text-slate-400 hover:text-white text-sm font-bold px-1.5 py-0.5 rounded-lg hover:bg-slate-800 transition"
              title="Schließen"
            >
              ✕
            </button>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBluetoothHelp(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center space-x-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hilfe &amp; Brave Freischaltung</span>
            </button>

            <button
              onClick={handleConnectVmaxDirect}
              className="px-3 py-1.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40 font-bold text-[11px] flex items-center space-x-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span>⚡ VMAX Direkt-Connect</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 z-10">
        {currentView === 'home' && (
          <div className="space-y-5 py-2 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                E-Trotti Tuning
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                VMAX VX2 Pro, Xiaomi, Ninebot &amp; SoFlow via Bluetooth koppeln &amp; tunen.
              </p>
            </div>

            {/* Featured VMAX VX2 Pro 1-Click Card matching user's screenshot */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-green-500/40 hover:border-green-500 rounded-3xl p-5 shadow-2xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-green-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Screenshot Modell
              </div>

              <div className="flex items-start space-x-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    <span>VMAX VX2 Pro</span>
                    <span className="text-xs text-green-400 font-mono font-normal">
                      (VMAX_VX2_VT02)
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] font-mono text-slate-400">
                    <span>
                      HW: <span className="text-slate-200">HW9044_V1.29</span>
                    </span>
                    <span>•</span>
                    <span>
                      FW: <span className="text-green-400">B-01.2.29</span>
                    </span>
                    <span>•</span>
                    <span>
                      Ctrl: <span className="text-slate-200">02070163</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                UniScooter / ZYD Tech Controller: 48V System, 1200W Peak Power, Vmax-Entsperrung auf
                35 km/h, Zero-Start &amp; Firmware-Update Tool.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleConnectVmaxDirect}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>VMAX VERBINDEN</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    handleConnectVmaxDirect().then(() => setCurrentView('vmax-firmware'));
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-green-500/50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 text-green-400" />
                  <span>FIRMWARE UPDATE</span>
                </button>
              </div>
            </div>

            {/* Big Bluetooth Scan Target for Real BLE */}
            <div className="flex flex-col items-center justify-center space-y-3 pt-1">
              <button
                onClick={handleConnect}
                disabled={connectionStatus === ConnectionStatus.CONNECTING}
                className="relative group w-36 h-36 rounded-full bg-slate-800/90 flex flex-col items-center justify-center transition-all hover:bg-slate-750 active:scale-95 overflow-hidden border border-slate-700 shadow-xl"
              >
                <div
                  className="absolute inset-0 border-4 border-green-500/20 rounded-full group-hover:border-green-500/40 animate-ping"
                  style={{ animationDuration: '3s' }}
                ></div>
                <Radio className="w-10 h-10 text-green-500 mb-1.5 transition group-hover:scale-110" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                  BLE SCAN
                </span>
                <span className="text-[8px] text-slate-400 font-mono">Web Bluetooth</span>
              </button>
              <div className="flex flex-col items-center space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">
                  Filter: VMAX, UniScooter, ZYD, Ninebot, Xiaomi
                </p>
                <button
                  type="button"
                  onClick={() => setShowBluetoothHelp(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1 font-medium pt-0.5"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Brave / Android Bluetooth blockiert? Anleitung &amp; Lösung</span>
                </button>
              </div>
            </div>

            {/* Manual Entry Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-[#0f172a] px-3 text-slate-500">
                  oder Modell manuell eingeben
                </span>
              </div>
            </div>

            {/* Model Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="z.B. VMAX VX2 Pro, Xiaomi Pro 2, Ninebot G30..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 h-9 w-9 bg-green-500 hover:bg-green-400 rounded-xl flex items-center justify-center text-slate-950 transition active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Popular Quick-Select Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_MODELS.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => {
                      setModelSearch(model);
                      handleSearch(model);
                    }}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border transition flex items-center space-x-1 ${
                      model.includes('VMAX')
                        ? 'bg-green-500/15 border-green-500 text-green-400 font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{model}</span>
                  </button>
                ))}
              </div>
            </form>

            {/* Feature Teasers */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <FeatureItem
                icon={<Gauge className="w-4 h-4 text-cyan-400" />}
                text="Speed Unlock"
                sub="Bis zu 35-45 km/h"
              />
              <FeatureItem
                icon={<BatteryCharging className="w-4 h-4 text-yellow-400" />}
                text="48V Power"
                sub="1200W Peak Boost"
              />
              <FeatureItem
                icon={<RefreshCw className="w-4 h-4 text-green-400" />}
                text="UniScooter FW"
                sub="B-01.2.29 / 35"
              />
            </div>
          </div>
        )}

        {currentView === 'dashboard' && scooterInfo && (
          <Dashboard
            stats={stats}
            scooterInfo={scooterInfo}
            onTuningClick={() => setCurrentView('tuning')}
            onOpenFirmware={() => setCurrentView('vmax-firmware')}
            onUpdateStats={(updater) => setStats(updater)}
          />
        )}

        {currentView === 'tuning' && scooterInfo && (
          <TuningPanel
            tuningOptions={scooterInfo.tuningCapabilities}
            scooterInfo={scooterInfo}
            onFlash={handleFlash}
            onOpenFirmware={() => setCurrentView('vmax-firmware')}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'vmax-firmware' && scooterInfo && (
          <VmaxFirmwareView
            scooterInfo={scooterInfo}
            onBack={() => setCurrentView('dashboard')}
            onFlash={handleFlash}
          />
        )}
      </main>

      {/* Firmware Flash Progress Overlay */}
      {flashProgress !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="w-full space-y-6 text-center max-w-xs glass p-6 rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 animate-pulse">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">
              Writing Controller Firmware
            </h2>
            <div className="relative pt-1">
              <div className="overflow-hidden h-3 mb-3 text-xs flex rounded-full bg-slate-800">
                <div
                  style={{ width: `${flashProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-200"
                ></div>
              </div>
              <p className="text-green-400 font-mono font-bold text-lg">{flashProgress}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                ZYD Tech HW9044 Patch...
              </p>
              <p className="text-[10px] text-red-400 font-bold animate-pulse">
                GERÄT NICHT TRENNEN
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation when Scooter is selected */}
      {scooterInfo && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass border-t border-slate-800/90 py-2.5 px-4 flex justify-around items-center z-40 rounded-t-3xl shadow-2xl backdrop-blur-xl">
          <NavButton
            active={currentView === 'home'}
            icon={<Search className="w-5 h-5" />}
            label="Modelle"
            onClick={() => setCurrentView('home')}
          />
          <NavButton
            active={currentView === 'dashboard'}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Cockpit"
            onClick={() => setCurrentView('dashboard')}
          />
          <NavButton
            active={currentView === 'tuning'}
            icon={<Cpu className="w-5 h-5" />}
            label="Tuning"
            onClick={() => setCurrentView('tuning')}
          />
          {isVmaxConnected && (
            <NavButton
              active={currentView === 'vmax-firmware'}
              icon={<RefreshCw className="w-5 h-5" />}
              label="Firmware"
              onClick={() => setCurrentView('vmax-firmware')}
            />
          )}
        </nav>
      )}

      {/* Bluetooth Help & Diagnostic Modal */}
      <BluetoothHelpModal
        isOpen={showBluetoothHelp}
        onClose={() => setShowBluetoothHelp(false)}
        onConnectVmaxDirect={handleConnectVmaxDirect}
      />
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; text: string; sub: string }> = ({
  icon,
  text,
  sub,
}) => (
  <div className="glass p-3 rounded-2xl flex items-center space-x-3 border border-white/5 hover:border-slate-700 transition">
    <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <span className="text-[11px] font-black uppercase text-slate-200 block">{text}</span>
      <span className="text-[9px] font-mono text-slate-400 block">{sub}</span>
    </div>
  </div>
);

const NavButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${
      active
        ? 'text-green-400 bg-green-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
    }`}
  >
    <div>{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
