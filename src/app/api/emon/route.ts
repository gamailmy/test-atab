import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Konfigurasi API:
 * - EMON_API_URL: full URL upstream (termasuk api_key) — disarankan untuk GitHub hosting
 * - EMON_API_KEY: hanya API key-nya; jika diisi akan digabung dengan base URL default
 * Jika keduanya kosong, akan otomatis pakai fallback JSON lokal.
 */
const DEFAULT_BASE_URL = "https://apigw.pu.go.id/v1/emon/paket/test";
const UPSTREAM_URL =
  process.env.EMON_API_URL ||
  (process.env.EMON_API_KEY
    ? `${DEFAULT_BASE_URL}?api_key=${process.env.EMON_API_KEY}`
    : `${DEFAULT_BASE_URL}?api_key=0451299a9ab9a1dcff3404ee8ba8a13c4186a4a570cdce2d5c9ae69fc53e630c`);

export interface EmonItem {
  tgl_tarik: string | null;
  kdsatker: string | null;
  nmsatker: string | null;
  nmppk: string | null;
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

async function readFallback(): Promise<EmonResponse> {
  const file = path.join(process.cwd(), "public", "emon-fallback.json");
  const raw = await fs.readFile(file, "utf-8");
  const data = JSON.parse(raw);
  return {
    resource: data.resource ?? [],
    meta: data.meta ?? { count: data.resource?.length ?? 0 },
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(): Promise<NextResponse<EmonResponse>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(UPSTREAM_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const fallback = await readFallback();
      fallback.error = `Upstream responded ${res.status}`;
      return NextResponse.json(fallback);
    }

    const data = (await res.json()) as { resource?: EmonItem[]; meta?: { count: number } };
    if (!Array.isArray(data.resource) || data.resource.length === 0) {
      const fallback = await readFallback();
      fallback.error = "Upstream returned empty resource array";
      return NextResponse.json(fallback);
    }

    return NextResponse.json({
      resource: data.resource,
      meta: data.meta ?? { count: data.resource.length },
      source: "upstream",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const fallback = await readFallback();
    fallback.error = err instanceof Error ? err.message : "Unknown fetch error";
    return NextResponse.json(fallback);
  }
}
