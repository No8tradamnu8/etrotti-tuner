import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

export interface RadialGaugeProps {
  id?: string;
  value: number;
  min?: number;
  max: number;
  unit: string;
  title: string;
  color: string;
  secondaryText?: string;
  badge?: { text: string; bg: string; textCol: string };
  size?: number;
  icon?: React.ReactNode;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  id,
  value,
  min = 0,
  max,
  unit,
  title,
  color,
  secondaryText,
  badge,
  size = 200,
  icon,
}) => {
  const safeValue = Math.min(Math.max(Number(value) || 0, min), max);
  const chartData = [{ name: title, value: safeValue, fill: color }];

  // Calculations for ticks
  const startAngle = 220;
  const endAngle = -40;
  const totalAngle = 260; // from 220 to -40
  const tickSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div
      id={id || `radial-gauge-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="glass rounded-3xl p-5 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300 hover:border-slate-600/50"
      style={{ minHeight: `${size + 90}px` }}
    >
      {/* Title & Icon Header */}
      <div className="w-full flex items-center justify-between mb-1 z-10 px-1">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badge.bg} ${badge.textCol}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Radial Chart Container */}
      <div
        className="relative flex items-center justify-center my-auto"
        style={{ width: size, height: size }}
      >
        {/* Subtle tick markers on background ring */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {tickSteps.map((fraction, i) => {
            // angle in radians: startAngle clockwise by (fraction * totalAngle)
            // Note: SVG standard angles are clockwise from positive X, Recharts polar angles are counter-clockwise from 3 o'clock.
            // Angle in Recharts: theta = startAngle - fraction * totalAngle
            const thetaDeg = startAngle - fraction * totalAngle;
            const thetaRad = (thetaDeg * Math.PI) / 180;
            const rOuter = size / 2 - 2;
            const rInner = size / 2 - 7;
            const cx = size / 2;
            const cy = size / 2;
            const x1 = cx + rOuter * Math.cos(thetaRad);
            const y1 = cy - rOuter * Math.sin(thetaRad);
            const x2 = cx + rInner * Math.cos(thetaRad);
            const y2 = cy - rInner * Math.sin(thetaRad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#475569"
                strokeWidth={i === 0 || i === tickSteps.length - 1 ? '2.5' : '1.5'}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
        </svg>

        {/* Dynamic Recharts Radial Bar Chart */}
        <RadialBarChart
          width={size}
          height={size}
          cx={size / 2}
          cy={size / 2}
          innerRadius="72%"
          outerRadius="92%"
          barSize={13}
          data={chartData}
          startAngle={startAngle}
          endAngle={endAngle}
        >
          <PolarAngleAxis
            type="number"
            domain={[min, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#1e293b' }}
            dataKey="value"
            cornerRadius={8}
            isAnimationActive={true}
            animationDuration={600}
          />
        </RadialBarChart>

        {/* Center Display: Numerical value, unit, and subtle glow */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center pt-2">
          <span
            className="text-4xl sm:text-5xl font-black tracking-tighter leading-none"
            style={{
              color: color,
              textShadow: `0 0 16px ${color}33`,
            }}
          >
            {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
          </span>
          <span className="text-xs uppercase text-slate-400 tracking-widest font-bold mt-1">
            {unit}
          </span>
        </div>
      </div>

      {/* Footer secondary info (e.g. max scale, remaining range/voltage) */}
      <div className="w-full text-center z-10 pt-2 border-t border-slate-800/80">
        <span className="text-[11px] font-mono text-slate-400">
          {secondaryText || `Scale: ${min} - ${max} ${unit}`}
        </span>
      </div>
    </div>
  );
};
