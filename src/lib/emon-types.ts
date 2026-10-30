export interface EmonItem {
  tgl_tarik: string | null;
  kdsatker: string | null;
  nmsatker: string | null;
  nmppk: string | null;
  // Sub-kode hierarki anggaran (5 level)
  kdgiat: string | null;
  kdoutput: string | null;
  kdsoutput: string | null;
  kdkmpnen: string | null;
  kdskmpnen: string | null;
  kdpaket: string | null;
  nmpaket: string | null;
  pagu_total: string | null;
  progres_fisik: string | null;
  progres_keuangan: string | null;
}

export interface EmonResponse {
  resource: EmonItem[];
  meta: { count: number };
  source: "upstream" | "fallback";
  fetchedAt: string;
  error?: string;
}

export type ProgressStatus = "critical" | "behind" | "ontrack" | "completed";

export interface NormalizedItem extends EmonItem {
  pagu: number;
  fisik: number | null;
  keuangan: number | null;
  status: ProgressStatus;
  satkerShort: string;
  // Label gabungan sub-kode untuk tampilan ringkas
  subkodeLabel: string;
}

export interface SubkodeFilter {
  kdgiat: string; // "" = all
  kdoutput: string;
  kdsoutput: string;
  kdkmpnen: string;
  kdskmpnen: string;
}

export interface Filters {
  search: string;
  satker: string; // "" = all
  ppk: string; // "" = all
  status: ProgressStatus | "all";
  fisikRange: [number, number]; // 0-100
  paguRangePct: [number, number]; // 0-100 (percentage of pagu bounds)
  subkode: SubkodeFilter;
}
