"use client";

import { useState } from "react";
import { Coins, Users, Award, Percent } from "lucide-react";

interface ChartDataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: ChartDataPoint[];
  title: string;
  colorClassName?: string;
  gradientId: string;
}

export function AreaChart({ data, title, colorClassName = "text-blue-600", gradientId }: AreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 100); // Default max to 100 if all 0

  const width = 500;
  const height = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate SVG coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, val: d.value, label: d.label };
  });

  // Create SVG path string
  const pathD = points.reduce((acc, p, index) => {
    return acc + `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Create area SVG path string (closed loop at the bottom)
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-amber-500 fill-amber-500/10" />
          {title}
        </h3>
        {hoveredIndex !== null && (
          <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 animate-in fade-in zoom-in-95">
            {points[hoveredIndex].label}: <span className="text-blue-600 font-extrabold">{points[hoveredIndex].val.toLocaleString()} Cr</span>
          </div>
        )}
      </div>

      {/* SVG Responsive Wrapper */}
      <div className="relative w-full overflow-hidden aspect-[5/2]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" className={colorClassName} />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" className={colorClassName} />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const gridVal = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94A3B8"
                  className="text-[9px] font-bold"
                >
                  {gridVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaD && (
            <path
              d={areaD}
              fill={`url(#${gradientId})`}
              className={colorClassName}
            />
          )}

          {/* Line Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={colorClassName}
            />
          )}

          {/* Interactivity Dots */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* Invisible large circle for easier mouse hover hit area */}
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visible dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? "5.5" : "3.5"}
                fill={hoveredIndex === idx ? "currentColor" : "#FFFFFF"}
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-all duration-150 ${colorClassName}`}
              />
            </g>
          ))}

          {/* X Axis labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fill="#94A3B8"
              className="text-[10px] font-bold"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

interface CourseBarData {
  title: string;
  enrollments: number;
  revenue: number;
}

interface CourseBarChartProps {
  data: CourseBarData[];
  title: string;
}

export function CourseBarChart({ data, title }: CourseBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center py-10 text-xs text-slate-400">
        Chưa có dữ liệu hiệu suất khóa học.
      </div>
    );
  }

  const maxEnrollments = Math.max(...data.map((d) => d.enrollments), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
        <Award className="h-4 w-4 text-blue-500 fill-blue-500/10" />
        {title}
      </h3>

      <div className="space-y-4">
        {data.map((course, idx) => {
          const enrollPct = (course.enrollments / maxEnrollments) * 100;
          const revPct = (course.revenue / maxRevenue) * 100;

          return (
            <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="truncate max-w-[70%]" title={course.title}>
                  {course.title}
                </span>
                <span className="text-slate-400 font-semibold shrink-0 text-[10px]">
                  {course.enrollments} HV · {course.revenue.toLocaleString()} Cr
                </span>
              </div>

              <div className="space-y-1">
                {/* Enrollments bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0">Học viên:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 rounded-full h-full transition-all duration-500"
                      style={{ width: `${enrollPct}%` }}
                    />
                  </div>
                </div>

                {/* Revenue bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0">Doanh thu:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 rounded-full h-full transition-all duration-500"
                      style={{ width: `${revPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryData {
  category: string;
  revenue: number;
}

interface CategoryDistributionProps {
  data: CategoryData[];
  title: string;
}

export function CategoryDistribution({ data, title }: CategoryDistributionProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center py-10 text-xs text-slate-400">
        Chưa có dữ liệu chuyên mục.
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0) || 1;

  // Predefined gorgeous colors for the category layout
  const colors = [
    "bg-blue-500 text-blue-600",
    "bg-emerald-500 text-emerald-600",
    "bg-purple-500 text-purple-600",
    "bg-amber-500 text-amber-600",
    "bg-rose-500 text-rose-600",
    "bg-indigo-500 text-indigo-600",
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
        <Percent className="h-4 w-4 text-purple-500" />
        {title}
      </h3>

      {/* Stacked Horizontal Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
        {data.map((item, idx) => {
          const pct = (item.revenue / totalRevenue) * 100;
          if (pct === 0) return null;
          const colorClass = colors[idx % colors.length].split(" ")[0];
          return (
            <div
              key={idx}
              className={`${colorClass} h-full transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${item.category}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.map((item, idx) => {
          const pct = (item.revenue / totalRevenue) * 100;
          const bgClass = colors[idx % colors.length].split(" ")[0];
          const textClass = colors[idx % colors.length].split(" ")[1];

          return (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50/50 border border-slate-100/50">
              <span className={`h-2.5 w-2.5 rounded-full ${bgClass} shrink-0 mt-0.5`} />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-800 truncate" title={item.category}>
                  {item.category}
                </span>
                <span className={`font-semibold text-[10px] ${textClass}`}>
                  {item.revenue.toLocaleString()} Cr ({pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
