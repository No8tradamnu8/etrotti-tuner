import React, { useState, useEffect } from 'react';

interface FuturisticNeonGaugeProps {
  id?: string;
  speed: number;
  maxSpeed?: number;
  unit?: string;
  battery?: number;
  tripText?: string;
  rangeText?: string;
  title?: string;
}

export const FuturisticNeonGauge: React.FC<FuturisticNeonGaugeProps> = ({
  id = 'futuristic-neon-gauge',
  speed,
  maxSpeed = 45,
  unit = 'km/h',
  battery = 88,
  tripText = 'T-7.8',
  rangeText = 'R-6.5',
}) => {
  const [leftBlinker, setLeftBlinker] = useState(false);
  const [rightBlinker, setRightBlinker] = useState(false);
  const [timeStr, setTimeStr] = useState('14:43');
  const [dateStr, setDateStr] = useState('MONDAY 19 2026');

  // Update clock & date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);

      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const year = now.getFullYear();
      setDateStr(`${dayName} ${dayNum} ${year}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Blinkers interval
  const [blinkState, setBlinkState] = useState(true);
  useEffect(() => {
    if (!leftBlinker && !rightBlinker) return;
    const interval = setInterval(() => {
      setBlinkState((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, [leftBlinker, rightBlinker]);

  // Dimensions
  const size = 520;
  const center = size / 2; // 260
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle; // 270 degrees

  const clampedSpeed = Math.max(0, Math.min(maxSpeed, speed));
  const progressRatio = clampedSpeed / maxSpeed;
  const currentNeedleAngle = startAngle + progressRatio * totalAngle;

  // Segmented Outer LED Blocks
  const totalSegments = 46;
  const outerRadius = 210;
  const segmentLength = 12;
  const innerRadius = outerRadius - segmentLength;

  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const fraction = i / (totalSegments - 1);
    const angleDeg = startAngle + fraction * totalAngle;
    const angleRad = (angleDeg * Math.PI) / 180;
    const isActive = fraction <= progressRatio;
    const isRedline = fraction >= 0.82; // Top 18% speed in red/orange

    const x1 = center + innerRadius * Math.cos(angleRad);
    const y1 = center + innerRadius * Math.sin(angleRad);
    const x2 = center + outerRadius * Math.cos(angleRad);
    const y2 = center + outerRadius * Math.sin(angleRad);

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      angleDeg,
      isActive,
      isRedline,
    };
  });

  // Gauge Scale Ticks & Numbers
  const numSteps = 5; // e.g. 0, 10, 20, 30, 40, (50)
  const ticks = [];
  const tickRadiusOuter = 186;
  const tickRadiusInner = 172;
  const labelRadius = 154;

  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    const angleDeg = startAngle + fraction * totalAngle;
    const angleRad = (angleDeg * Math.PI) / 180;
    const val = Math.round(fraction * maxSpeed);

    const x1 = center + tickRadiusInner * Math.cos(angleRad);
    const y1 = center + tickRadiusInner * Math.sin(angleRad);
    const x2 = center + tickRadiusOuter * Math.cos(angleRad);
    const y2 = center + tickRadiusOuter * Math.sin(angleRad);

    const lx = center + labelRadius * Math.cos(angleRad);
    const ly = center + labelRadius * Math.sin(angleRad);

    ticks.push({
      val,
      x1,
      y1,
      x2,
      y2,
      lx,
      ly,
      isRedline: fraction >= 0.8,
    });
  }

  // Minor ticks
  const minorTicks = [];
  const minorSteps = numSteps * 4;
  for (let i = 0; i <= minorSteps; i++) {
    if (i % 4 === 0) continue; // skip major
    const fraction = i / minorSteps;
    const angleDeg = startAngle + fraction * totalAngle;
    const angleRad = (angleDeg * Math.PI) / 180;

    const x1 = center + (tickRadiusInner + 5) * Math.cos(angleRad);
    const y1 = center + (tickRadiusInner + 5) * Math.sin(angleRad);
    const x2 = center + tickRadiusOuter * Math.cos(angleRad);
    const y2 = center + tickRadiusOuter * Math.sin(angleRad);

    minorTicks.push({ x1, y1, x2, y2 });
  }

  // Needle path pointing up (0 deg), will be rotated by currentNeedleAngle
  // Need to point from center (0,0) towards top (radius ~178)
  const needleLength = 175;
  const needleBaseWidth = 7;

  return (
    <div
      id={id}
      className="relative w-full max-w-[500px] mx-auto select-none flex flex-col items-center bg-[#070e1e] rounded-3xl p-3 sm:p-5 border border-cyan-500/20 shadow-[0_0_40px_rgba(0,240,255,0.08)] overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,240,255,0.12),transparent_70%)] pointer-events-none"></div>

      {/* SVG Instrument Dial */}
      <div className="w-full relative aspect-square max-w-[460px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          <defs>
            {/* Neon Cyan Glow Filter */}
            <filter id="neon-cyan-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Neon Orange Glow Filter for Needle & Turn Arrows */}
            <filter id="neon-orange-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle Arc Base Glow */}
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Needle Gradient */}
            <linearGradient id="needle-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ff5500" />
              <stop offset="70%" stopColor="#ff9f00" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* Redline LED Gradient */}
            <linearGradient id="redline-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7b00" />
              <stop offset="100%" stopColor="#ff0055" />
            </linearGradient>
          </defs>

          {/* Sci-Fi Outer Corner Brackets (at ~2, 4, 8, 10 o'clock) */}
          <g stroke="#00f0ff" strokeWidth="2.5" fill="none" opacity="0.75" filter="url(#neon-cyan-glow)">
            {/* Top-Left Bracket */}
            <path d="M 60 110 L 40 130 L 40 80 L 90 40 L 140 40 L 120 60" />
            <line x1="35" y1="150" x2="35" y2="175" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Top-Right Bracket */}
            <path d="M 460 110 L 480 130 L 480 80 L 430 40 L 380 40 L 400 60" />
            <line x1="485" y1="150" x2="485" y2="175" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Bottom-Left Bracket */}
            <path d="M 40 370 L 40 430 L 90 470 L 130 470" />

            {/* Bottom-Right Bracket */}
            <path d="M 480 370 L 480 430 L 430 470 L 390 470" />
          </g>

          {/* Outermost Thin Guide Arc */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius + 8}
            stroke="#00f0ff"
            strokeWidth="1"
            strokeOpacity="0.2"
            fill="none"
          />

          {/* Background Track Arc */}
          <circle
            cx={center}
            cy={center}
            r={(innerRadius + outerRadius) / 2}
            stroke="#0e223d"
            strokeWidth={segmentLength + 4}
            fill="none"
            strokeDasharray="990"
            strokeDashoffset="247"
            transform={`rotate(135 ${center} ${center})`}
            strokeLinecap="round"
          />

          {/* Segmented LED Blocks */}
          <g>
            {segments.map((seg) => (
              <line
                key={seg.id}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={
                  seg.isActive
                    ? seg.isRedline
                      ? 'url(#redline-grad)'
                      : '#00f0ff'
                    : '#12253d'
                }
                strokeWidth={seg.isActive ? 4 : 2.5}
                strokeLinecap="round"
                filter={seg.isActive ? 'url(#neon-cyan-glow)' : undefined}
                className="transition-colors duration-150"
              />
            ))}
          </g>

          {/* Inner Continuous Arc */}
          <circle
            cx={center}
            cy={center}
            r={tickRadiusInner}
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            fill="none"
          />

          {/* Major and Minor Ticks */}
          <g stroke="#00f0ff" opacity="0.6">
            {minorTicks.map((tick, i) => (
              <line
                key={`minor-${i}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />
            ))}
          </g>

          <g>
            {ticks.map((tick, i) => (
              <g key={`major-${i}`}>
                <line
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={tick.isRedline ? '#ff5500' : '#00f0ff'}
                  strokeWidth="2.5"
                  filter="url(#neon-cyan-glow)"
                />
                <text
                  x={tick.lx}
                  y={tick.ly + 4}
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="select-none"
                >
                  {tick.val}
                </text>
              </g>
            ))}
          </g>

          {/* Concentric Decorative Rings around Center */}
          <circle
            cx={center}
            cy={center}
            r="105"
            stroke="#00f0ff"
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="6 4"
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r="82"
            stroke="#00f0ff"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            fill="none"
          />
          <circle
            cx={center}
            cy={center}
            r="60"
            stroke="#00f0ff"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="2 6"
            fill="none"
          />

          {/* Digital Clock & Date Display at Upper Center */}
          <g textAnchor="middle">
            <text
              x={center}
              y={center - 32}
              fill="#ffffff"
              fontSize="24"
              fontWeight="900"
              fontFamily="monospace"
              letterSpacing="2"
            >
              {timeStr}
            </text>
            <text
              x={center}
              y={center - 14}
              fill="#87ceeb"
              fontSize="9"
              fontWeight="700"
              fontFamily="monospace"
              letterSpacing="2.5"
              opacity="0.9"
            >
              {dateStr}
            </text>
          </g>

          {/* Sci-Fi Target Crosshair marks */}
          <line
            x1={center - 45}
            y1={center}
            x2={center - 30}
            y2={center}
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <line
            x1={center + 30}
            y1={center}
            x2={center + 45}
            y2={center}
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Rotating Needle (Points to speed) */}
          <g
            style={{
              transform: `rotate(${currentNeedleAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: 'transform 0.22s cubic-bezier(0.1, 0.85, 0.25, 1)',
            }}
          >
            {/* Needle Glow */}
            <polygon
              points={`
                ${center - needleBaseWidth},${center}
                ${center + needleBaseWidth},${center}
                ${center + 1.5},${center + needleLength - 10}
                ${center},${center + needleLength}
                ${center - 1.5},${center + needleLength - 10}
              `}
              fill="url(#needle-gradient)"
              filter="url(#neon-orange-glow)"
            />

            {/* Bright needle tip light */}
            <circle
              cx={center}
              cy={center + needleLength - 3}
              r="3.5"
              fill="#ffffff"
              filter="url(#neon-orange-glow)"
            />
          </g>

          {/* Central Pivot Cap */}
          <circle
            cx={center}
            cy={center}
            r="16"
            fill="#08152b"
            stroke="#00f0ff"
            strokeWidth="2.5"
            filter="url(#neon-cyan-glow)"
          />
          <circle cx={center} cy={center} r="7" fill="#ff9f00" filter="url(#neon-orange-glow)" />
          <circle cx={center} cy={center} r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Bottom Horizontal Speed & Turn Indicator Bar (matching image) */}
      <div className="w-full max-w-[390px] -mt-10 sm:-mt-12 z-20">
        <div className="bg-[#0b1b36]/90 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-[0_0_25px_rgba(0,240,255,0.2)]">
          {/* Left Blinker Button / Indicator */}
          <button
            onClick={() => setLeftBlinker((prev) => !prev)}
            title="Blinker Links"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              leftBlinker && blinkState
                ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(255,165,0,0.8)]'
                : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>

          {/* Center Large Digital Speed Readout */}
          <div className="flex items-baseline space-x-2 text-center">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              {clampedSpeed.toFixed(1)}
            </span>
            <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest font-mono">
              {unit}
            </span>
          </div>

          {/* Right Blinker Button / Indicator */}
          <button
            onClick={() => setRightBlinker((prev) => !prev)}
            title="Blinker Rechts"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              rightBlinker && blinkState
                ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(255,165,0,0.8)]'
                : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>

        {/* Secondary Sub-Telemetry: T-7.8 (Trip) & R-6.5 (Range) */}
        <div className="flex justify-between items-center px-4 pt-2 text-[11px] font-mono text-cyan-400/80">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="font-bold tracking-wider">{tripText}</span>
            <span className="text-slate-500 text-[9px]">(TRIP KM)</span>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-500 text-[9px]">BATTERY</span>
            <span className="font-bold text-green-400">{Math.round(battery)}%</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 text-[9px]">(EST. RANGE)</span>
            <span className="font-bold tracking-wider">{rangeText}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
