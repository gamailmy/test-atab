"use client";

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUBKODE_FIELDS } from "@/lib/emon-utils";
import type { NormalizedItem, SubkodeFilter } from "@/lib/emon-types";

interface SubkodeFilterPanelProps {
  items: NormalizedItem[]; // full normalized dataset (NOT pre-filtered by sub-kode)
  value: SubkodeFilter;
  onChange: (next: SubkodeFilter) => void;
  onReset: () => void;
}

/**
 * Cascading sub-kode filter.
 * Setiap level berikutnya hanya menampilkan opsi yang konsisten dengan
 * pilihan level di atasnya (parent context).
 */
export function SubkodeFilterPanel({ items, value, onChange, onReset }: SubkodeFilterPanelProps) {
  // Untuk setiap level, hitung opsi yang valid berdasarkan parent yang sudah dipilih
  const options = useMemo(() => {
    const result: Array<{
      key: keyof SubkodeFilter;
      label: string;
      short: string;
      options: Array<{ value: string; count: number }>;
    }> = [];

    for (let i = 0; i < SUBKODE_FIELDS.length; i++) {
      const field = SUBKODE_FIELDS[i];
      // Filter items berdasarkan parent (level 0..i-1)
      const filtered = items.filter((it) => {
        for (let j = 0; j < i; j++) {
          const parent = SUBKODE_FIELDS[j];
          const selected = value[parent.key];
          if (selected && (it as unknown as Record<string, string | null>)[parent.apiField] !== selected) {
            return false;
          }
        }
        return true;
      });

      const counts = new Map<string, number>();
      for (const it of filtered) {
        const v = (it as unknown as Record<string, string | null>)[field.apiField];
        if (v === null || v === undefined || v === "") continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }

      result.push({
        key: field.key,
        label: field.label,
        short: field.short,
        options: Array.from(counts.entries())
          .sort((a, b) => {
            // Numeric sort if all numeric, else alpha
            const an = /^\d+$/.test(a[0]);
            const bn = /^\d+$/.test(b[0]);
            if (an && bn) return Number(a[0]) - Number(b[0]);
            return a[0].localeCompare(b[0]);
          })
          .map(([value, count]) => ({ value, count })),
      });
    }
    return result;
  }, [items, value]);

  const hasActive = SUBKODE_FIELDS.some((f) => value[f.key] !== "");

  const update = (key: keyof SubkodeFilter, val: string) => {
    // Reset semua level di bawah level yang diubah
    const idx = SUBKODE_FIELDS.findIndex((f) => f.key === key);
    const next: SubkodeFilter = { ...value, [key]: val };
    for (let i = idx + 1; i < SUBKODE_FIELDS.length; i++) {
      next[SUBKODE_FIELDS[i].key] = "";
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Layers className="size-3.5 text-emerald-600" />
          Filter Sub-Kode Anggaran
        </div>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Bersihkan sub-kode
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const selected = value[opt.key];
          // Jika parent belum dipilih, semua opsi tampil
          // Jika parent sudah dipilih, opsi mungkin kosong (tidak ada yang cocok)
          return (
            <div key={opt.key} className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                {opt.label}
                {selected && (
                  <Badge variant="secondary" className="ml-2 text-[10px] py-0 px-1.5 h-4">
                    {selected}
                  </Badge>
                )}
              </Label>
              <Select
                value={selected || "__ALL__"}
                onValueChange={(v) => update(opt.key, v === "__ALL__" ? "" : v)}
                disabled={opt.options.length === 0 && !selected}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={`Semua (${opt.options.length})`} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__ALL__" className="text-xs">
                    <span>Semua {opt.label}</span>
                    <Badge variant="secondary" className="ml-auto">{opt.options.length}</Badge>
                  </SelectItem>
                  {opt.options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs font-mono">
                      <span className="truncate pr-2">{o.value}</span>
                      <Badge variant="secondary" className="ml-auto">{o.count}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {hasActive && (
        <div className={cn("rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-2 text-[11px] text-emerald-700 dark:text-emerald-300")}>
          <span className="font-medium">Filter sub-kode aktif:</span>{" "}
          {SUBKODE_FIELDS.filter((f) => value[f.key]).map((f) => `${f.short}=${value[f.key]}`).join(" · ")}
        </div>
      )}
    </div>
  );
}
