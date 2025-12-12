'use client';

import { useMemo } from 'react';

interface DataPoint {
  date?: string;
  value: number;
  label?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}

export function ProgressChart({ 
  data, 
  height = 120, 
  color = '#6366f1',
  showLabels = true 
}: ProgressChartProps) {
  const { points, maxValue } = useMemo(() => {
    if (data.length === 0) return { points: '', maxValue: 100 };
    
    const max = Math.max(...data.map(d => d.value), 1);
    const width = 100;
    const padding = 5;
    
    const pts = data.map((d, i) => {
      const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (d.value / max) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
    
    return { points: pts, maxValue: max };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Pas encore de données
      </div>
    );
  }

  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className="w-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line x1="5" y1={height - 5} x2="95" y2={height - 5} stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="5" y1={height / 2} x2="95" y2={height / 2} stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="2" />
        
        {/* Area fill */}
        <polygon
          points={`5,${height - 5} ${points} 95,${height - 5}`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {data.map((d, i) => {
          const x = 5 + (i / Math.max(data.length - 1, 1)) * 90;
          const y = height - 5 - (d.value / maxValue) * (height - 10);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>
      
      {showLabels && data.length > 0 && (
        <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
          <span>{data[0]?.label || data[0]?.date}</span>
          {data.length > 1 && (
            <span>{data[data.length - 1]?.label || data[data.length - 1]?.date}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, height = 150, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 30);
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            {showValues && (
              <span className="text-xs text-gray-600 mb-1">{item.value}%</span>
            )}
            <div 
              className="w-full rounded-t-md transition-all duration-300"
              style={{ 
                height: barHeight,
                backgroundColor: item.color || '#6366f1',
                minHeight: 4
              }}
            />
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  data?: { label: string; value: number; color: string }[];
}

export function DonutChart({ 
  value, 
  max = 100, 
  size = 100, 
  strokeWidth = 10,
  color = '#6366f1',
  label,
  data
}: DonutChartProps) {
  if (data && data.length > 0) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;
    
    return (
      <div className="flex items-center gap-4">
        <svg width={size} height={size}>
          {data.map((segment, i) => {
            const percentage = total > 0 ? segment.value / total : 0;
            const angle = percentage * 360;
            const radius = (size - strokeWidth) / 2;
            const cx = size / 2;
            const cy = size / 2;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            if (percentage === 0) return null;
            
            return (
              <path
                key={i}
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={segment.color}
              />
            );
          })}
          <circle cx={size / 2} cy={size / 2} r={size / 4} fill="white" />
        </svg>
        <div className="space-y-1">
          {data.map((segment, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-gray-600">{segment.label}: {segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((value || 0) / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(value || 0)}%</span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
}
