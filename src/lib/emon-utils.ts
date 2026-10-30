import type { EmonItem, NormalizedItem, ProgressStatus, SubkodeFilter } from "./emon-types";

export function toNumber(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function classifyStatus(fisik: number | null): ProgressStatus {
  if (fisik === null) return "critical";
  if (fisik >= 75) return "completed";
  if (fisik >= 50) return "ontrack";
  if (fisik >= 25) return "behind";
  return "critical";
}

export function shortenSatker(name: string | null): string {
  if (!name) return "—";
  return name
    .replace(/^BALAI BESAR WILAYAH SUNGAI/, "BBWS")
    .replace(/^SNVT PELAKSANAAN JARINGAN PEMANFAATAN AIR/, "SNVT JIPA")
    .replace(/^SNVT AIR TANAH DAN AIR BAKU/, "SNVT ATAB")
    .replace(/PROVINSI.*/, "")
    .replace(/NUSA TENGGARA/, "NT")
    .replace(/KALIMANTAN/, "KAL")
    .replace(/MALUKU.*/, "MALUKU")
    .replace(/I KALI.*/, "I")
    .trim();
}

/**
 * Bangun label sub-kode gabungan, mis: "GIAT 7755 / OUT EBA / SO 962 / KMP 307 / SK A"
 * Field kosong dilewati.
 */
export function subkodeLabel(item: EmonItem): string {
  const parts: string[] = [];
  if (item.kdgiat) parts.push(`G ${item.kdgiat}`);
  if (item.kdoutput) parts.push(`O ${item.kdoutput}`);
  if (item.kdsoutput) parts.push(`SO ${item.kdsoutput}`);
  if (item.kdkmpnen) parts.push(`K ${item.kdkmpnen}`);
  if (item.kdskmpnen) parts.push(`SK ${item.kdskmpnen}`);
  return parts.length ? parts.join(" · ") : "—";
}

export const SUBKODE_FIELDS: Array<{
  key: keyof SubkodeFilter;
  apiField: keyof EmonItem;
  label: string;
  short: string;
}> = [
  { key: "kdgiat", apiField: "kdgiat", label: "Kegiatan", short: "Giat" },
  { key: "kdoutput", apiField: "kdoutput", label: "Output", short: "Out" },
  { key: "kdsoutput", apiField: "kdsoutput", label: "Sub-Output", short: "SO" },
  { key: "kdkmpnen", apiField: "kdkmpnen", label: "Komponen", short: "Kmp" },
  { key: "kdskmpnen", apiField: "kdskmpnen", label: "Sub-Komponen", short: "SK" },
];

export function normalize(item: EmonItem): NormalizedItem {
  const pagu = toNumber(item.pagu_total) ?? 0;
  const fisik = toNumber(item.progres_fisik);
  const keuangan = toNumber(item.progres_keuangan);
  return {
    ...item,
    pagu,
    fisik,
    keuangan,
    status: classifyStatus(fisik),
    satkerShort: shortenSatker(item.nmsatker),
    subkodeLabel: subkodeLabel(item),
  };
}

export function formatCurrency(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`;
    if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)} M`;
    if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(1)} Jt`;
    return `Rp ${value.toLocaleString("id-ID")}`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatPercent(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const STATUS_META: Record<
  ProgressStatus,
  { label: string; color: string; bg: string; text: string; dot: string }
> = {
  completed: {
    label: "Selesai (≥75%)",
    color: "#10b981",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  ontrack: {
    label: "On-Track (50–75%)",
    color: "#0d9488",
    bg: "bg-teal-100 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  behind: {
    label: "Tertinggal (25–50%)",
    color: "#f59e0b",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Kritis (<25% / N/A)",
    color: "#ef4444",
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
};
