"use client";

import { Package, Wallet, HardHat, TrendingUp, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/emon-utils";
import type { NormalizedItem } from "@/lib/emon-types";

interface KpiCardsProps {
  items: NormalizedItem[];
  totalCount: number;
}

interface Kpi {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accent: string;
  ring: string;
}

export function KpiCards({ items, totalCount }: KpiCardsProps) {
  const totalPagu = items.reduce((sum, it) => sum + it.pagu, 0);
  const fisikVals = items.map((it) => it.fisik).filter((v): v is number => v !== null);
  const keuVals = items.map((it) => it.keuangan).filter((v): v is number => v !== null);
  const avgFisik = fisikVals.length ? fisikVals.reduce((a, b) => a + b, 0) / fisikVals.length : 0;
  const avgKeu = keuVals.length ? keuVals.reduce((a, b) => a + b, 0) / keuVals.length : 0;

  const kpis: Kpi[] = [
    {
      label: "Total Paket",
      value: items.length.toLocaleString("id-ID"),
      sub: `dari ${totalCount.toLocaleString("id-ID")} paket`,
      icon: Package,
      accent: "text-emerald-600",
      ring: "from-emerald-500/15 to-emerald-500/0",
    },
    {
      label: "Total Pagu",
      value: formatCurrency(totalPagu, { compact: true }),
      sub: `${formatCurrency(totalPagu)}`,
      icon: Wallet,
      accent: "text-teal-600",
      ring: "from-teal-500/15 to-teal-500/0",
    },
    {
      label: "Rata-rata Fisik",
      value: formatPercent(avgFisik),
      sub: `${fisikVals.length} paket terdatalog`,
      icon: HardHat,
      accent: "text-amber-600",
      ring: "from-amber-500/15 to-amber-500/0",
    },
    {
      label: "Rata-rata Keuangan",
      value: formatPercent(avgKeu),
      sub: `selisih vs fisik ${(avgFisik - avgKeu).toFixed(2)} pp`,
      icon: TrendingUp,
      accent: "text-orange-600",
      ring: "from-orange-500/15 to-orange-500/0",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className={cn(
              "relative overflow-hidden p-4 border-border/60 shadow-sm",
              "bg-gradient-to-br",
              kpi.ring
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight truncate">{kpi.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{kpi.sub}</p>
              </div>
              <div className={cn("rounded-lg size-9 grid place-items-center bg-background/70 backdrop-blur", kpi.accent)}>
                <Icon className="size-4" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
