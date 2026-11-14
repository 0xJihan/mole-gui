import React from "react";

interface SparklineProps {
  data: number[];
  color?: string; // e.g. "rgb(59, 130, 246)" for blue, "rgb(6, 182, 212)" for cyan
  maxVal?: number;
  height?: number;
  width?: string | number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "rgb(59, 130, 246)",
  maxVal = 100,
  height = 48,
}) => {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full flex items-center justify-center text-xs text-slate-500">No data</div>;
  }

  const svgWidth = 240;
  const svgHeight = height;
  const pointsCount = Math.max(data.length, 2);
  const stepX = svgWidth / (pointsCount - 1);

  const points = data.map((val, idx) => {
    const clamped = Math.max(0, Math.min(val, maxVal));
    const y = svgHeight - (clamped / maxVal) * (svgHeight - 6) - 3;
    const x = idx * stepX;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${((data.length - 1) * stepX).toFixed(1)},${svgHeight} L 0,${svgHeight} Z`;

  const gradientId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
