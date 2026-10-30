"use client";

import { useMemo } from "react";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Filters, NormalizedItem, ProgressStatus, SubkodeFilter } from "@/lib/emon-types";
import { STATUS_META, formatCurrency } from "@/lib/emon-utils";
import { SubkodeFilterPanel } from "./subkode-filter-panel";

interface FilterPanelProps {
  items: NormalizedItem[];
  filteredCount: number;
  totalCount: number;
  filters: Filters;
  paguBounds: [number, number];
  onChange: (next: Filters) => void;
  onReset: () => void;
}

const STATUS_ORDER: ProgressStatus[] = ["completed", "ontrack", "behind", "critical"];

export function FilterPanel({
  items,
  filteredCount,
  totalCount,
  filters,
  paguBounds,
  onChange,
  onReset,
}: FilterPanelProps) {
  const satkers = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      const key = it.nmsatker ?? "—";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const ppks = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      const key = it.nmppk ?? "—";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const statusCounts = useMemo(() => {
    const counts: Record<ProgressStatus, number> = {
      completed: 0,
      ontrack: 0,
      behind: 0,
      critical: 0,
    };
    for (const it of items) counts[it.status]++;
    return counts;
  }, [items]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search !== "" ||
    filters.satker !== "" ||
    filters.ppk !== "" ||
    filters.status !== "all" ||
    filters.fisikRange[0] > 0 ||
    filters.fisikRange[1] < 100 ||
    filters.paguRangePct[0] > 0 ||
    filters.paguRangePct[1] < 100 ||
    Object.values(filters.subkode).some((v) => v !== "");

  const handleSubkodeChange = (next: SubkodeFilter) =>
    onChange({ ...filters, subkode: next });

  const handleSubkodeReset = () =>
    onChange({ ...filters, subkode: { kdgiat: "", kdoutput: "", kdsoutput: "", kdkmpnen: "", kdskmpnen: "" } });

  // Compute actual pagu range from percentage
  const [minPagu, maxPagu] = paguBounds;
  const paguSpan = maxPagu - minPagu || 1;
  const actualPaguMin = minPagu + paguSpan * (filters.paguRangePct[0] / 100);
  const actualPaguMax = minPagu + paguSpan * (filters.paguRangePct[1] / 100);

  return (
    <div className="flex flex-col gap-5 p-5 bg-card rounded-xl border border-border/60 shadow-sm h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-emerald-600" />
          Filter & Pencarian
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="h-7 text-xs gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {filteredCount} / {totalCount} paket
        </Badge>
        {hasActiveFilters && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            Filter aktif
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
          Cari nama / kode paket
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="search"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Ketik kata kunci…"
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Satker */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Satker</Label>
        <Select
          value={filters.satker || "__ALL__"}
          onValueChange={(v) => update("satker", v === "__ALL__" ? "" : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Semua satker" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__ALL__">Semua satker ({satkers.length})</SelectItem>
            {satkers.map(([name, count]) => (
              <SelectItem key={name} value={name} className="text-xs">
                <span className="truncate pr-2">{name}</span>
                <Badge variant="secondary" className="ml-auto">{count}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PPK */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">PPK</Label>
        <Select
          value={filters.ppk || "__ALL__"}
          onValueChange={(v) => update("ppk", v === "__ALL__" ? "" : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Semua PPK" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__ALL__">Semua PPK ({ppks.length})</SelectItem>
            {ppks.map(([name, count]) => (
              <SelectItem key={name} value={name} className="text-xs">
                <span className="truncate pr-2">{name}</span>
                <Badge variant="secondary" className="ml-auto">{count}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-kode anggaran (5-level cascading) */}
      <Separator className="my-1" />
      <SubkodeFilterPanel
        items={items}
        value={filters.subkode}
        onChange={handleSubkodeChange}
        onReset={handleSubkodeReset}
      />
      <Separator className="my-1" />

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Status progres fisik</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update("status", "all")}
            className={cn(
              "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition",
              filters.status === "all"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-border hover:border-emerald-300 hover:bg-muted/50"
            )}
          >
            <span>Semua</span>
            <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update("status", filters.status === s ? "all" : s)}
              className={cn(
                "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition",
                filters.status === s
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-border hover:border-emerald-300 hover:bg-muted/50"
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
                <span className="truncate">{STATUS_META[s].label.split(" ")[0]}</span>
              </span>
              <Badge variant="secondary" className="ml-2">{statusCounts[s]}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Fisik range */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Rentang progres fisik</Label>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
            {filters.fisikRange[0]}% – {filters.fisikRange[1]}%
          </span>
        </div>
        <Slider
          value={filters.fisikRange}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => {
            if (v.length === 2) {
              onChange({ ...filters, fisikRange: [v[0], v[1]] });
            }
          }}
          className="py-1"
        />
      </div>

      {/* Pagu range */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Rentang pagu (Rp)</Label>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
            {formatCurrency(actualPaguMin, { compact: true })} – {formatCurrency(actualPaguMax, { compact: true })}
          </span>
        </div>
        <Slider
          value={filters.paguRangePct}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => {
            if (v.length === 2) {
              onChange({ ...filters, paguRangePct: [v[0], v[1]] });
            }
          }}
          className="py-1"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Min: {formatCurrency(minPagu, { compact: true })}</span>
          <span>Max: {formatCurrency(maxPagu, { compact: true })}</span>
        </div>
      </div>
    </div>
  );
}
