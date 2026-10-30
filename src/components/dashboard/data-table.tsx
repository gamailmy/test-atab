"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { STATUS_META, formatCurrency, formatPercent, formatDate, SUBKODE_FIELDS } from "@/lib/emon-utils";
import type { NormalizedItem } from "@/lib/emon-types";

type SortKey = "nmpaket" | "nmsatker" | "nmppk" | "kdgiat" | "pagu" | "fisik" | "keuangan" | "status";
type SortDir = "asc" | "desc";

interface DataTableProps {
  items: NormalizedItem[];
}

const PAGE_SIZE = 10;

type SortIconProps = { k: SortKey; sortKey: SortKey; sortDir: SortDir };

function SortIcon({ k, sortKey, sortDir }: SortIconProps) {
  if (k !== sortKey) return <ChevronsUpDown className="size-3 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="size-3 text-emerald-600" /> : <ChevronDown className="size-3 text-emerald-600" />;
}

type ThProps = {
  k: SortKey;
  label: string;
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
};

function Th({ k, label, className, sortKey, sortDir, onSort }: ThProps) {
  return (
    <th className={cn("px-3 py-2 text-left font-medium text-[11px] uppercase tracking-wide text-muted-foreground", className)}>
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground transition"
      >
        {label}
        <SortIcon k={k} sortKey={sortKey} sortDir={sortDir} />
      </button>
    </th>
  );
}

export function DataTable({ items }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("pagu");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<NormalizedItem | null>(null);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "nmpaket": av = a.nmpaket ?? ""; bv = b.nmpaket ?? ""; break;
        case "nmsatker": av = a.nmsatker ?? ""; bv = b.nmsatker ?? ""; break;
        case "nmppk": av = a.nmppk ?? ""; bv = b.nmppk ?? ""; break;
        case "kdgiat": av = a.kdgiat ?? ""; bv = b.kdgiat ?? ""; break;
        case "pagu": av = a.pagu; bv = b.pagu; break;
        case "fisik": av = a.fisik ?? -1; bv = b.fisik ?? -1; break;
        case "keuangan": av = a.keuangan ?? -1; bv = b.keuangan ?? -1; break;
        case "status": av = a.status; bv = b.status; break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
    setPage(0);
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Detail Paket</CardTitle>
        <CardDescription className="text-xs">
          Klik header untuk mengurutkan. Klik ikon mata untuk detail paket.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-2 py-2 w-8" />
                  <Th k="nmpaket" label="Nama Paket" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="nmsatker" label="Satker" className="hidden md:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="nmppk" label="PPK" className="hidden lg:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="kdgiat" label="Sub-Kode" className="hidden xl:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="pagu" label="Pagu" className="text-right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="fisik" label="Fisik" className="text-right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="keuangan" label="Keuangan" className="text-right hidden sm:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <Th k="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                      Tidak ada paket yang cocok dengan filter aktif.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((it, i) => {
                    const meta = STATUS_META[it.status];
                    return (
                      <tr
                        key={`${it.kdpaket ?? i}-${i}`}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition"
                      >
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => setDetail(it)}
                            className="text-muted-foreground hover:text-emerald-600 transition"
                            aria-label="Lihat detail"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </td>
                        <td className="px-3 py-2 max-w-64">
                          <p className="line-clamp-2 leading-snug">{it.nmpaket ?? "—"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{it.kdpaket}</p>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-muted-foreground line-clamp-1">{it.satkerShort}</span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <span className="text-muted-foreground line-clamp-1">{it.nmppk ?? "—"}</span>
                        </td>
                        <td className="px-3 py-2 hidden xl:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {SUBKODE_FIELDS.map((f) => {
                              const v = (it as unknown as Record<string, string | null>)[f.apiField];
                              if (!v) return null;
                              return (
                                <span key={f.key} className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[9px] font-mono">
                                  <span className="text-muted-foreground">{f.short}</span>
                                  <span className="text-foreground">{v}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                          {formatCurrency(it.pagu, { compact: true })}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatPercent(it.fisik)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono hidden sm:table-cell">
                          {formatPercent(it.keuangan)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", meta.bg, meta.text)}>
                            <span className={cn("size-1.5 rounded-full", meta.dot)} />
                            {meta.label.split(" ")[0]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
          <p className="text-xs text-muted-foreground">
            Menampilkan {pageItems.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} dari {sorted.length} paket
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="h-7 px-2"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              className="h-7 px-2"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs px-2 font-mono">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages - 1}
              className="h-7 px-2"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="h-7 px-2"
            >
              »
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Detail Paket</DialogTitle>
            <DialogDescription className="text-xs font-mono">{detail?.kdpaket}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nama Paket</p>
                <p className="font-medium leading-snug">{detail.nmpaket ?? "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Satker</p>
                  <p className="text-sm">{detail.nmsatker ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kode Satker</p>
                  <p className="text-sm font-mono">{detail.kdsatker ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PPK</p>
                  <p className="text-sm">{detail.nmppk ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[detail.status].bg, STATUS_META[detail.status].text)}>
                    <span className={cn("size-1.5 rounded-full", STATUS_META[detail.status].dot)} />
                    {STATUS_META[detail.status].label}
                  </span>
                </div>
              </div>

              {/* Hierarki sub-kode anggaran */}
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Hierarki Sub-Kode Anggaran</p>
                <div className="grid grid-cols-5 gap-2">
                  {SUBKODE_FIELDS.map((f, idx) => {
                    const v = (detail as unknown as Record<string, string | null>)[f.apiField];
                    return (
                      <div key={f.key} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-0.5">
                          <span className="size-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[9px] font-mono font-bold grid place-items-center">
                            {idx + 1}
                          </span>
                          {f.label}
                        </p>
                        <p className="text-sm font-mono font-semibold truncate" title={v ?? ""}>{v ?? "—"}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="font-medium">Kode Paket:</span>
                  <span className="font-mono text-foreground">{detail.kdpaket ?? "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">Pagu Total</p>
                  <p className="text-sm font-mono font-semibold mt-1">{formatCurrency(detail.pagu)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(detail.pagu, { compact: true })}</p>
                </div>
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">Progres Fisik</p>
                  <p className="text-sm font-mono font-semibold mt-1">{formatPercent(detail.fisik)}</p>
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${detail.fisik ?? 0}%` }} />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground">Progres Keuangan</p>
                  <p className="text-sm font-mono font-semibold mt-1">{formatPercent(detail.keuangan)}</p>
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${detail.keuangan ?? 0}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span>Tgl Tarik Data: {detail.tgl_tarik ? formatDate(detail.tgl_tarik) : "—"}</span>
                {detail.fisik !== null && detail.keuangan !== null && (
                  <span>
                    Deviasi: <span className={cn("font-mono font-medium", Math.abs(detail.fisik - detail.keuangan) > 5 ? "text-amber-600" : "text-emerald-600")}>
                      {(detail.fisik - detail.keuangan).toFixed(2)} pp
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
