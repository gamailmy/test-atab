"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Sector,
  LabelList,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_META, formatCurrency, formatPercent, shortenSatker, SUBKODE_FIELDS } from "@/lib/emon-utils";
import type { NormalizedItem, ProgressStatus } from "@/lib/emon-types";

const STATUS_ORDER: ProgressStatus[] = ["completed", "ontrack", "behind", "critical"];

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function ChartCard({ title, description, className, children, action }: ChartCardProps) {
  return (
    <Card className={cn("border-border/60 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-medium mb-1 max-w-64 truncate">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium">
            {typeof p.value === "number" && p.dataKey === "pagu"
              ? formatCurrency(p.value, { compact: true })
              : typeof p.value === "number"
                ? formatPercent(p.value)
                : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============== 1. Bar Chart: Pagu & Progress per Satker ============== */

interface SatkerRow {
  name: string;
  short: string;
  pagu: number;
  fisik: number;
  keuangan: number;
  count: number;
}

export function SatkerBarChart({ items }: { items: NormalizedItem[] }) {
  const [mode, setMode] = useState<"progress" | "pagu">("progress");

  const rows: SatkerRow[] = useMemo(() => {
    const map = new Map<string, SatkerRow>();
    for (const it of items) {
      const key = it.nmsatker ?? "—";
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          short: shortenSatker(key),
          pagu: 0,
          fisik: 0,
          keuangan: 0,
          count: 0,
        });
      }
      const r = map.get(key)!;
      r.pagu += it.pagu;
      if (it.fisik !== null) r.fisik += it.fisik;
      if (it.keuangan !== null) r.keuangan += it.keuangan;
      r.count += 1;
    }
    const arr = Array.from(map.values());
    for (const r of arr) {
      r.fisik = r.count ? r.fisik / r.count : 0;
      r.keuangan = r.count ? r.keuangan / r.count : 0;
    }
    arr.sort((a, b) => b.pagu - a.pagu);
    return arr;
  }, [items]);

  return (
    <ChartCard
      title="Performa per Satker"
      description="Rata-rata progres fisik & keuangan, dan total pagu per satker"
      action={
        <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
          {(["progress", "pagu"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-1 rounded transition",
                mode === m
                  ? "bg-background shadow-sm font-medium text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "progress" ? "Progres" : "Pagu"}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
            <XAxis
              type="number"
              domain={mode === "progress" ? [0, 100] : [0, "auto"]}
              tickFormatter={(v) => (mode === "progress" ? `${v}%` : formatCurrency(v, { compact: true }))}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              type="category"
              dataKey="short"
              width={88}
              tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
              stroke="hsl(var(--border))"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(v) => <span className="text-muted-foreground">{v}</span>}
            />
            {mode === "progress" ? (
              <>
                <Bar dataKey="fisik" name="Fisik" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="keuangan" name="Keuangan" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} />
                <ReferenceLine x={75} stroke="#10b981" strokeDasharray="3 3" />
              </>
            ) : (
              <Bar dataKey="pagu" name="Pagu" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={16}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={`hsl(${170 + i * 8} 70% 40%)`} />
                ))}
                <LabelList
                  dataKey="pagu"
                  position="right"
                  formatter={(v: number) => formatCurrency(v, { compact: true })}
                  style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ============== 2. Scatter: Fisik vs Keuangan ============== */

export function ProgressScatter({ items }: { items: NormalizedItem[] }) {
  const data = useMemo(
    () =>
      items
        .filter((it) => it.fisik !== null && it.keuangan !== null)
        .map((it) => ({
          x: it.fisik as number,
          y: it.keuangan as number,
          z: Math.max(20, Math.min(400, it.pagu / 5e7)),
          name: it.nmpaket,
          status: it.status,
          pagu: it.pagu,
        })),
    [items]
  );

  const byStatus = useMemo(() => {
    const groups: Record<ProgressStatus, typeof data> = {
      completed: [],
      ontrack: [],
      behind: [],
      critical: [],
    };
    for (const d of data) groups[d.status].push(d);
    return groups;
  }, [data]);

  return (
    <ChartCard
      title="Fisik vs Keuangan"
      description="Setiap titik = 1 paket; ukuran ∝ pagu; garis diagonal = progres ideal"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              type="number"
              dataKey="x"
              name="Fisik"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              label={{ value: "Progres Fisik", position: "bottom", fontSize: 11, fill: "hsl(var(--muted-foreground))", offset: 4 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Keuangan"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <ZAxis type="number" dataKey="z" range={[20, 400]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg max-w-72">
                    <p className="font-medium truncate mb-1">{d.name}</p>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Fisik:</span>
                      <span className="font-mono">{formatPercent(d.x)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Keuangan:</span>
                      <span className="font-mono">{formatPercent(d.y)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Pagu:</span>
                      <span className="font-mono">{formatCurrency(d.pagu, { compact: true })}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Deviasi:</span>
                      <span className={cn("font-mono", d.x - d.y > 5 ? "text-red-600" : d.y - d.x > 5 ? "text-emerald-600" : "")}>
                        {(d.x - d.y).toFixed(2)} pp
                      </span>
                    </div>
                  </div>
                );
              }}
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
            />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#64748b" strokeDasharray="4 4" />
            <ReferenceLine x={75} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={75} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
            {STATUS_ORDER.map((s) => (
              <Scatter
                key={s}
                name={STATUS_META[s].label}
                data={byStatus[s]}
                fill={STATUS_META[s].color}
                fillOpacity={0.7}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(v) => <span className="text-muted-foreground">{v}</span>}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ============== 3. Donut: Status Distribution ============== */

function DonutActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
        {payload.label}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={18} fontWeight={700}>
        {value}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export function StatusDonut({ items }: { items: NormalizedItem[] }) {
  const [active, setActive] = useState<number>(0);

  const data = useMemo(() => {
    const counts: Record<ProgressStatus, number> = { completed: 0, ontrack: 0, behind: 0, critical: 0 };
    for (const it of items) counts[it.status]++;
    return STATUS_ORDER.map((s) => ({
      key: s,
      label: STATUS_META[s].label.split(" ")[0],
      fullLabel: STATUS_META[s].label,
      value: counts[s],
      color: STATUS_META[s].color,
    })).filter((d) => d.value > 0);
  }, [items]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard
      title="Distribusi Status Progres"
      description={`Komposisi ${total} paket berdasarkan progres fisik`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="h-56 w-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={80}
                paddingAngle={2}
                activeIndex={active}
                activeShape={DonutActiveShape}
                onMouseEnter={(_, i) => setActive(i)}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} stroke="hsl(var(--background))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active: a, payload }) => {
                  if (!a || !payload || !payload.length) return null;
                  const d = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="font-medium">{d.fullLabel}</span>
                      </div>
                      <div className="mt-1 font-mono text-sm">
                        {d.value} paket ({((d.value / total) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 w-full space-y-1.5">
          {data.map((d, i) => (
            <li
              key={d.key}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition",
                active === i ? "bg-muted/60" : "hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                <span className="truncate">{d.fullLabel}</span>
              </span>
              <span className="font-mono">
                {d.value} <span className="text-muted-foreground">({((d.value / total) * 100).toFixed(1)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/* ============== 4. Top 10 Paket by Pagu ============== */

export function TopPaketBar({ items }: { items: NormalizedItem[] }) {
  const data = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.pagu - a.pagu).slice(0, 10);
    return sorted.map((it) => ({
      name: it.nmpaket?.slice(0, 60) ?? "—",
      fullName: it.nmpaket ?? "—",
      pagu: it.pagu,
      fisik: it.fisik ?? 0,
      keuangan: it.keuangan ?? 0,
      status: it.status,
      satker: it.satkerShort,
    }));
  }, [items]);

  return (
    <ChartCard
      title="Top 10 Paket berdasarkan Pagu"
      description="Paket dengan alokasi anggaran terbesar pada filter aktif"
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
              stroke="hsl(var(--border))"
              tickFormatter={(v: string) => (v.length > 28 ? v.slice(0, 28) + "…" : v)}
            />
            <Tooltip
              content={({ active: a, payload }) => {
                if (!a || !payload || !payload.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg max-w-72">
                    <p className="font-medium mb-1.5">{d.fullName}</p>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Satker:</span>
                      <span>{d.satker}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Pagu:</span>
                      <span className="font-mono">{formatCurrency(d.pagu, { compact: true })}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Fisik:</span>
                      <span className="font-mono">{formatPercent(d.fisik)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Keuangan:</span>
                      <span className="font-mono">{formatPercent(d.keuangan)}</span>
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar dataKey="pagu" name="Pagu" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((d, i) => (
                <Cell key={i} fill={STATUS_META[d.status].color} />
              ))}
              <LabelList
                dataKey="pagu"
                position="right"
                formatter={(v: number) => formatCurrency(v, { compact: true })}
                style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ============== 5. Sub-Kode Hierarchy: Stacked bar per Kegiatan ============== */

interface KegiatanRow {
  kdgiat: string;
  count: number;
  pagu: number;
  avgFisik: number;
  avgKeu: number;
  statusCounts: Record<ProgressStatus, number>;
}

const KEGIATAN_PALETTE = ["#0d9488", "#0891b2", "#65a30d", "#ca8a04", "#ea580c", "#dc2626", "#9333ea"];

export function SubkodeHierarchyChart({ items }: { items: NormalizedItem[] }) {
  const [groupBy, setGroupBy] = useState<0 | 1 | 2 | 3 | 4>(0); // index ke SUBKODE_FIELDS

  const rows = useMemo(() => {
    const field = SUBKODE_FIELDS[groupBy];
    const map = new Map<string, KegiatanRow>();
    for (const it of items) {
      const v = (it as unknown as Record<string, string | null>)[field.apiField] ?? "(tanpa kode)";
      if (!map.has(v)) {
        map.set(v, {
          kdgiat: v,
          count: 0,
          pagu: 0,
          avgFisik: 0,
          avgKeu: 0,
          statusCounts: { completed: 0, ontrack: 0, behind: 0, critical: 0 },
        });
      }
      const r = map.get(v)!;
      r.count += 1;
      r.pagu += it.pagu;
      if (it.fisik !== null) r.avgFisik += it.fisik;
      if (it.keuangan !== null) r.avgKeu += it.keuangan;
      r.statusCounts[it.status] += 1;
    }
    const arr = Array.from(map.values());
    for (const r of arr) {
      r.avgFisik = r.count ? r.avgFisik / r.count : 0;
      r.avgKeu = r.count ? r.avgKeu / r.count : 0;
    }
    arr.sort((a, b) => b.pagu - a.pagu);
    return arr;
  }, [items, groupBy]);

  // Stacked bar data: per row, status counts
  const stackData = useMemo(
    () =>
      rows.map((r) => ({
        name: r.kdgiat,
        ...STATUS_ORDER.reduce((acc, s) => {
          acc[s] = r.statusCounts[s];
          return acc;
        }, {} as Record<ProgressStatus, number>),
        total: r.count,
        pagu: r.pagu,
        avgFisik: r.avgFisik,
        avgKeu: r.avgKeu,
      })),
    [rows]
  );

  return (
    <ChartCard
      title="Distribusi per Sub-Kode Anggaran"
      description="Jumlah paket per level (stacked by status) — klik level untuk pindah hierarki"
      action={
        <div className="flex flex-wrap gap-0.5 rounded-md border border-border bg-muted/40 p-0.5 text-[10px]">
          {SUBKODE_FIELDS.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setGroupBy(i as 0 | 1 | 2 | 3 | 4)}
              className={cn(
                "px-2 py-0.5 rounded transition",
                groupBy === i
                  ? "bg-background shadow-sm font-medium text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.short}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stackData} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              allowDecimals={false}
            />
            <Tooltip
              content={({ active: a, payload, label }) => {
                if (!a || !payload || !payload.length) return null;
                const d = payload[0].payload as (typeof stackData)[number];
                return (
                  <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg max-w-64">
                    <p className="font-medium mb-1.5">
                      {SUBKODE_FIELDS[groupBy].label}: <span className="font-mono">{label}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Total Paket:</span>
                      <span className="font-mono text-right">{d.total}</span>
                      <span className="text-muted-foreground">Total Pagu:</span>
                      <span className="font-mono text-right">{formatCurrency(d.pagu, { compact: true })}</span>
                      <span className="text-muted-foreground">Avg Fisik:</span>
                      <span className="font-mono text-right">{formatPercent(d.avgFisik)}</span>
                      <span className="text-muted-foreground">Avg Keuangan:</span>
                      <span className="font-mono text-right">{formatPercent(d.avgKeu)}</span>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-border/50 space-y-0.5">
                      {STATUS_ORDER.map((s) => {
                        const v = d[s];
                        if (v === 0) return null;
                        return (
                          <div key={s} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full" style={{ background: STATUS_META[s].color }} />
                              <span className="text-muted-foreground">{STATUS_META[s].label}</span>
                            </span>
                            <span className="font-mono">{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(v) => <span className="text-muted-foreground">{STATUS_META[v as ProgressStatus].label}</span>}
            />
            {STATUS_ORDER.map((s, i) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="status"
                fill={STATUS_META[s].color}
                radius={i === STATUS_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rows.slice(0, 8).map((r, i) => (
          <span
            key={r.kdgiat}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border border-border bg-muted/30"
          >
            <span className="size-1.5 rounded-full" style={{ background: KEGIATAN_PALETTE[i % KEGIATAN_PALETTE.length] }} />
            <span className="font-mono">{r.kdgiat}</span>
            <span className="text-muted-foreground">{r.count}pkt</span>
          </span>
        ))}
      </div>
    </ChartCard>
  );
}
