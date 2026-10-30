"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Activity, AlertTriangle, RefreshCw, Database, ExternalLink, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { normalize, formatDate } from "@/lib/emon-utils";
import type { EmonResponse, Filters, NormalizedItem } from "@/lib/emon-types";
import { FilterPanel } from "@/components/dashboard/filter-panel";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SatkerBarChart, ProgressScatter, StatusDonut, TopPaketBar, SubkodeHierarchyChart } from "@/components/dashboard/charts";
import { DataTable } from "@/components/dashboard/data-table";

const DEFAULT_FILTERS: Filters = {
  search: "",
  satker: "",
  ppk: "",
  status: "all",
  fisikRange: [0, 100],
  paguRangePct: [0, 100],
  subkode: { kdgiat: "", kdoutput: "", kdsoutput: "", kdkmpnen: "", kdskmpnen: "" },
};

export default function Home() {
  const { data: session } = useSession();
  const [data, setData] = useState<EmonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emon", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: EmonResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const normalized: NormalizedItem[] = useMemo(
    () => (data?.resource ?? []).map(normalize),
    [data]
  );

  // Pagu bounds for filter slider (computed once from full dataset)
  const paguBounds: [number, number] = useMemo(() => {
    if (normalized.length === 0) return [0, 1];
    let min = Infinity;
    let max = -Infinity;
    for (const it of normalized) {
      if (it.pagu < min) min = it.pagu;
      if (it.pagu > max) max = it.pagu;
    }
    return [Math.floor(min), Math.ceil(max)];
  }, [normalized]);

  const filtered: NormalizedItem[] = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    // Compute actual pagu range from percentage
    const [minPagu, maxPagu] = paguBounds;
    const paguSpan = maxPagu - minPagu || 1;
    const actualPaguMin = minPagu + paguSpan * (filters.paguRangePct[0] / 100);
    const actualPaguMax = minPagu + paguSpan * (filters.paguRangePct[1] / 100);
    const sk = filters.subkode;
    return normalized.filter((it) => {
      if (q) {
        const hay = `${it.nmpaket ?? ""} ${it.kdpaket ?? ""} ${it.nmppk ?? ""} ${it.nmsatker ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.satker && it.nmsatker !== filters.satker) return false;
      if (filters.ppk && it.nmppk !== filters.ppk) return false;
      if (filters.status !== "all" && it.status !== filters.status) return false;
      const fisik = it.fisik ?? 0;
      if (fisik < filters.fisikRange[0] || fisik > filters.fisikRange[1]) return false;
      if (it.pagu < actualPaguMin || it.pagu > actualPaguMax) return false;
      // Sub-kode cascading filter
      if (sk.kdgiat && it.kdgiat !== sk.kdgiat) return false;
      if (sk.kdoutput && it.kdoutput !== sk.kdoutput) return false;
      if (sk.kdsoutput && it.kdsoutput !== sk.kdsoutput) return false;
      if (sk.kdkmpnen && it.kdkmpnen !== sk.kdkmpnen) return false;
      if (sk.kdskmpnen && it.kdskmpnen !== sk.kdskmpnen) return false;
      return true;
    });
  }, [normalized, filters, paguBounds]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shrink-0 shadow-sm">
              <Activity className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                e-Monitoring Satker ATAB SDA PU
              </h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="font-mono">apigw.pu.go.id/v1/emon/paket/test</span>
                {data && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0 px-1.5 h-4 gap-1",
                      data.source === "upstream"
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                    )}
                  >
                    <Database className="size-2.5" />
                    {data.source === "upstream" ? "Live API" : "Fallback"}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {data?.fetchedAt && (
              <span className="hidden md:inline text-[11px] text-muted-foreground">
                Update: {formatDate(data.fetchedAt)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-8 gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Memuat…" : "Refresh"}
            </Button>
            <a
              href="https://apigw.pu.go.id/v1/emon/paket/test?api_key=0451299a9ab9a1dcff3404ee8ba8a13c4186a4a570cdce2d5c9ae69fc53e630c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 px-2"
            >
              <ExternalLink className="size-3.5" />
              Sumber API
            </a>
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md border border-border bg-background hover:bg-muted/50 transition text-xs">
                  <span className="size-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white">
                    <User className="size-3" />
                  </span>
                  <span className="hidden sm:inline font-medium max-w-20 truncate">
                    {session?.user?.name || "User"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{session?.user?.name || "User"}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Login aktif</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                >
                  <LogOut className="size-3.5 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 md:px-6 py-5">
        {error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-6 flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Gagal memuat data dari API</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              <Button onClick={() => fetchData()} size="sm" className="mt-3" variant="outline">
                <RefreshCw className="size-3.5 mr-1.5" /> Coba lagi
              </Button>
            </div>
          </div>
        ) : loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            <KpiCards items={filtered} totalCount={normalized.length} />

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
              <aside className="lg:sticky lg:top-20 lg:self-start">
                <FilterPanel
                  items={normalized}
                  filteredCount={filtered.length}
                  totalCount={normalized.length}
                  filters={filters}
                  paguBounds={paguBounds}
                  onChange={setFilters}
                  onReset={handleReset}
                />
              </aside>

              <div className="flex flex-col gap-5 min-w-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <SatkerBarChart items={filtered} />
                  <ProgressScatter items={filtered} />
                </div>
                <SubkodeHierarchyChart items={filtered} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <StatusDonut items={filtered} />
                  <TopPaketBar items={filtered} />
                </div>
                <DataTable items={filtered} />
              </div>
            </div>

            {data?.source === "fallback" && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2 text-xs">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-amber-800 dark:text-amber-200">
                  Menampilkan data fallback (snapshot terakhir) karena API upstream tidak dapat dijangkau
                  {data.error ? `: ${data.error}` : ""}. Klik <strong>Refresh</strong> untuk mencoba lagi.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border bg-background/60 py-3 px-4 md:px-6">
        <p className="text-[11px] text-muted-foreground text-center">
          Visualisasi data e-Monitoring Satker ATAB SDA PU · Sumber:{" "}
          <span className="font-mono">apigw.pu.go.id/v1/emon/paket/test</span> ·{" "}
          {data?.meta.count ?? 0} total paket
        </p>
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <Skeleton className="h-[480px] rounded-xl" />
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
