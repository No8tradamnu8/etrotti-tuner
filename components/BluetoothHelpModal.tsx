import React, { useState } from 'react';
import {
  Bluetooth,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Zap,
  HelpCircle,
  X,
  Compass,
  Layers,
  Sparkles,
  MapPin,
  Smartphone,
  Radio,
} from 'lucide-react';

interface BluetoothHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectVmaxDirect: () => void;
  onScanAll?: () => void;
  onScanFiltered?: () => void;
}

export const BluetoothHelpModal: React.FC<BluetoothHelpModalProps> = ({
  isOpen,
  onClose,
  onConnectVmaxDirect,
  onScanAll,
  onScanFiltered,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'troubleshoot' | 'chrome' | 'brave' | 'direct'>(
    'troubleshoot'
  );

  if (!isOpen) return null;

  const standaloneUrl = window.location.origin.includes('aistudio')
    ? 'https://ais-pre-pjhqmjvso5u63752tczup6-268442342541.europe-west2.run.app'
    : window.location.href;

  const copyUrl = () => {
    navigator.clipboard?.writeText(standaloneUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBraveFlag = () => {
    navigator.clipboard?.writeText('brave://flags/#enable-web-bluetooth');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1329] border border-cyan-500/30 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Scooter &amp; BLE Hilfe</span>
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Android / Chrome / Brave
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Warum werden keine Bluetooth-Geräte gefunden?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 my-3 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              activeTab === 'troubleshoot'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            0 Geräte?
          </button>
          <button
            onClick={() => setActiveTab('chrome')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              activeTab === 'chrome'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chrome
          </button>
          <button
            onClick={() => setActiveTab('brave')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              activeTab === 'brave'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Brave
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              activeTab === 'direct'
                ? 'bg-green-500/20 text-green-300 border border-green-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direkt-Start
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-300">
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1 text-amber-200">
                <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Häufigste Gründe für eine leere Geräteliste:</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Bluetooth Low Energy (BLE) unter Android hat strenge Sicherheitsvorgaben. Bitte prüfe diese 4 Punkte:
                </p>
              </div>

              {/* Step 1: Android GPS / Location */}
              <div className="p-3.5 bg-slate-900/90 border border-cyan-500/20 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                  <MapPin className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>1. Android-Standort (GPS) muss EINGESCHALTET sein!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                  <strong className="text-amber-300">Wichtigster Android-Grund:</strong> Google Android
                  erlaubt Browsern BLE-Scans nur, wenn der <strong>Standortdienst (GPS)</strong> aktiv ist.
                  Wenn GPS aus ist, bleibt die Liste immer komplett leer (0 Geräte).
                </p>
                <div className="pl-6 text-[10px] text-slate-400 font-mono">
                  ➔ Wische vom oberen Bildschirmrand nach unten und tippe auf &quot;Standort&quot; (aktivieren).
                </div>
              </div>

              {/* Step 2: Official VMAX App running */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>2. Offizielle VMAX- / Scooter-App beenden</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                  E-Scooter können nur mit <strong>einem einzigen Gerät oder einer App</strong> zur gleichen Zeit
                  gekoppelt sein. Wenn die offizielle VMAX-App, UniScooter-App oder Mi Home im Hintergrund läuft,
                  ist der Scooter für den Browser unsichtbar.
                </p>
                <div className="pl-6 text-[10px] text-slate-400 font-mono">
                  ➔ Öffne den App-Umschalter auf deinem Handy und wische die VMAX-App nach oben weg.
                </div>
              </div>

              {/* Step 3: Use All Devices scan */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-green-400 font-bold text-xs">
                  <Radio className="w-4 h-4 shrink-0 text-green-400" />
                  <span>3. Offenen Scan ohne Filter starten</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                  Manche VMAX-Scooter senden nicht den Namen &quot;VMAX&quot;, sondern nur eine Kennung wie
                  &quot;UniScooter&quot;, &quot;VT02&quot; oder ihre MAC-Adresse. Der offene Scan zeigt ausnahmslos
                  jedes Bluetooth-Signal im Umkreis:
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onScanAll?.();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Offenen Scan (Alle Geräte) starten</span>
                  </button>
                </div>
              </div>

              {/* Step 4: Direct Mode */}
              <div className="p-3.5 bg-slate-900/90 border border-green-500/20 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 text-green-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4 shrink-0 text-green-400" />
                  <span>4. Sofort-Tuning ohne BLE-Hardware-Koppelung</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                  Du kannst die VX2 Pro Controller-Parameter, das Sci-Fi HUD und die Geschwindigkeitsstufen
                  direkt laden:
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      onConnectVmaxDirect();
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>⚡ VMAX VX2 Pro Direkt-Connect</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chrome' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-slate-900/90 border border-cyan-500/20 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                  <Compass className="w-4 h-4" />
                  <span>Öffne die Web-App in Google Chrome</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Google Chrome auf Android unterstützt Web Bluetooth ab Werk und fragt dich beim
                  Tippen auf &quot;BLE SCAN&quot; direkt nach der Scooter-Auswahl.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={standaloneUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 btn-neon py-2.5 px-3 rounded-xl text-slate-950 font-bold text-center flex items-center justify-center space-x-2 bg-cyan-400 hover:bg-cyan-300 transition"
                  >
                    <span>In neuem Tab / Chrome öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={copyUrl}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopiert!' : 'Link kopieren'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <strong className="text-slate-200 block">Tipp für Android:</strong>
                Kopiere den Link, öffne die normale <strong>Chrome</strong>-App auf deinem Smartphone
                und füge ihn dort ein.
              </div>
            </div>
          )}

          {activeTab === 'brave' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Web Bluetooth in Brave freischalten</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-300">
                  <li className="leading-relaxed">
                    Öffne einen neuen Tab in Brave und tippe folgende interne Adresse ein:
                    <div className="mt-1 flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-cyan-300">
                      <span className="truncate">brave://flags/#enable-web-bluetooth</span>
                      <button
                        onClick={copyBraveFlag}
                        className="ml-2 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                      >
                        {copied ? 'Kopiert' : 'Kopieren'}
                      </button>
                    </div>
                  </li>
                  <li>
                    Stelle den Wert bei <strong>Web Bluetooth API</strong> von <em>Default</em> auf{' '}
                    <strong className="text-green-400">Enabled</strong>.
                  </li>
                  <li>
                    Tippe unten rechts auf <strong>&quot;Relaunch&quot; (Neu starten)</strong>.
                  </li>
                  <li>Lade diese App neu – der BLE-Scan funktioniert sofort!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'direct' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-gradient-to-br from-slate-900 to-green-950/40 border border-green-500/30 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-green-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Sofort-Verbindung VMAX VX2 Pro</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Du kannst die App, den neuen Sci-Fi Neon-Tachometer, die Motorleistungsstufen
                  und das Firmware-Tool sofort mit dem Profil aus deinem Screenshot testen – ganz
                  ohne dass dein Browser Bluetooth freigeben muss.
                </p>

                <button
                  onClick={() => {
                    onConnectVmaxDirect();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-black flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>⚡ VMAX VX2 PRO JETZT VERBINDEN</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            E-Trotti Tuner Pro v2.5.1
          </span>
          <button
            onClick={() => {
              onConnectVmaxDirect();
              onClose();
            }}
            className="text-green-400 hover:text-green-300 font-bold flex items-center gap-1"
          >
            <span>VMAX Direkt-Connect starten →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
