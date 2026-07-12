"use client";

import { ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui";

const INK = "#20302E";
const AMBER = "#BE873B";
const CLAY = "#A9573F";
const SAGE = "#6B7A6E";

export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
}) {
  return (
    <Card className="p-5">
      <div className="font-display text-4xl text-ink">{value}</div>
      <div className="mt-1 text-sm text-sage">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-sage/70">{sublabel}</div>}
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: `1px solid rgba(32,48,46,0.1)`,
  fontSize: 13,
  fontFamily: "var(--font-body)",
};

export function TrendChart({
  data,
  dataKey,
  labelKey = "date",
  height = 220,
  color = AMBER,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey?: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(32,48,46,0.06)" vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: SAGE }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: SAGE }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: INK, fontWeight: 500 }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BreakdownChart({
  data,
  dataKey,
  labelKey = "label",
  height = 220,
  color = CLAY,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey?: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(32,48,46,0.06)" vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: SAGE }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: SAGE }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: INK, fontWeight: 500 }} cursor={{ fill: "rgba(190,135,59,0.08)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
