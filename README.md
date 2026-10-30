# e-Monitoring Satker ATAB SDA PU

Dashboard visualisasi data **e-Monitoring Satker ATAB SDA PU** — paket, pagu, dan progres fisik & keuangan per satker. Data diambil langsung dari API upstream Kementerian PUPR (`apigw.pu.go.id/v1/emon/paket/test`).

![Dashboard Preview](download/dashboard-subkode.png)

## ✨ Fitur Utama

### Model Filter (Multi-Dimensi)
- **Pencarian teks** — nama/kode paket, PPK, satker
- **Dropdown Satker** (10 satker) & **PPK** (34 PPK) dengan jumlah paket per opsi
- **Filter Sub-Kode Anggaran Cascading** (5 level hierarki):
  - Kegiatan → Output → Sub-Output → Komponen → Sub-Komponen
  - Setiap level otomatis menyaring opsi level di bawahnya
- **Tombol status progres**: Semua / Selesai (≥75%) / On-Track (50–75%) / Tertinggal (25–50%) / Kritis (<25%)
- **Slider rentang progres fisik** (0–100%)
- **Slider rentang pagu** (persentase dari min–max)

### Visualisasi
- **4 KPI Cards**: Total Paket, Total Pagu, Rata-rata Fisik, Rata-rata Keuangan
- **Bar Chart performa per Satker** (toggle Progres/Pagu)
- **Scatter Plot Fisik vs Keuangan** dengan garis ideal & warna per status
- **Distribusi per Sub-Kode Anggaran** (stacked bar per level, toggle Giat/Out/SO/Kmp/SK)
- **Donut Chart distribusi status** (interaktif)
- **Top 10 Paket berdasarkan pagu**
- **Data Table** dengan sorting semua kolom, pagination, dan dialog detail paket lengkap (hierarki sub-kode)

### Fitur Tambahan
- **Auto-fallback** ke snapshot JSON lokal jika API upstream gagal
- **Badge "Live API" / "Fallback"** dengan tombol Refresh
- **Responsive** (mobile/desktop), **dark mode ready**
- Loading skeleton & error state

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York) + Lucide icons |
| Charts | Recharts |
| Database ORM | Prisma (SQLite, opsional — tidak wajib untuk dashboard ini) |

## 📦 Prasyarat

- **Node.js** ≥ 18.18.0 (disarankan 20.x LTS)
- **npm** / **pnpm** / **bun** (salah satu)
- API key e-Monitoring PUPR (dapatkan dari `apigw.pu.go.id`)

## 🚀 Quick Start (Development)

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/emon-satker-atab-sda-pu.git
cd emon-satker-atab-sda-pu

# 2. Install dependencies
npm install
# atau: pnpm install / bun install

# 3. Salin environment template
cp .env.example .env.local
# Edit .env.local, isi EMON_API_KEY atau EMON_API_URL

# 4. Jalankan dev server
npm run dev

# 5. Buka http://localhost:3000
```

## 🔧 Konfigurasi Environment

Buat file `.env.local` (development) atau set di dashboard hosting (production):

```bash
# Opsi 1 — Full URL (disarankan)
EMON_API_URL="https://apigw.pu.go.id/v1/emon/paket/test?api_key=API_KEY_ANDA"

# Opsi 2 — Hanya API key (base URL default dipakai otomatis)
EMON_API_KEY="API_KEY_ANDA"
```

> ⚠️ **Keamanan**: Jangan commit `.env.local` ke repository. Untuk hosting publik, selalu set API key via dashboard environment variables provider.

> ℹ️ Jika kedua variabel kosong, dashboard otomatis memakai snapshot fallback JSON lokal (`public/emon-fallback.json`) — berguna untuk demo atau saat API upstream down.

## 🔐 Authentication

Dashboard dilindungi login menggunakan **NextAuth.js** (Credentials Provider). Semua route kecuali `/login` dan `/api/auth/*` diproteksi oleh middleware — pengguna belum login akan otomatis di-redirect ke halaman login.

### Konfigurasi Environment Variables Auth

```bash
# WAJIB untuk produksi — generate dengan: openssl rand -base64 32
NEXTAUTH_SECRET="string-random-32-byte-anda"

# URL aplikasi (Vercel set otomatis, manual untuk local/other hosting)
NEXTAUTH_URL="http://localhost:3000"

# Kredensial login (ganti dari default!)
AUTH_USERNAME="admin"
AUTH_PASSWORD="emon2026"
```

### Default Credentials (Development)

Untuk development & preview tanpa env vars:
- **Username**: `admin`
- **Password**: `emon2026`

> ⚠️ **PENTING**: Ganti kedua credential ini via Environment Variables saat deploy ke produksi. Default hanya untuk development.

### Alur Login

1. User akses `/` → middleware cek session cookie
2. Jika belum login → redirect ke `/login?callbackUrl=/`
3. User input username/password → submit form
4. NextAuth validasi via Credentials Provider (compare dengan `AUTH_USERNAME` / `AUTH_PASSWORD`)
5. Jika valid → set JWT session cookie → redirect ke `callbackUrl`
6. Jika tidak valid → tampilkan error di halaman login
7. Untuk logout → klik avatar user di header → "Keluar" → session dihapus → redirect ke `/login`

## 📜 Available Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan dev server di `http://localhost:3000` |
| `npm run build` | Build untuk production (output `.next/`) |
| `npm run start` | Jalankan production server setelah build |
| `npm run lint` | Cek code quality dengan ESLint |
| `npm run typecheck` | Cek type safety dengan TypeScript |

## ☁️ Deployment

### Option A: Vercel (Recommended — paling mudah untuk Next.js)

1. Push repository ke GitHub
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. Vercel auto-detect Next.js, klik **Deploy**
4. Tambahkan Environment Variables di **Settings → Environment Variables** (wajib untuk login & API):
   - `EMON_API_KEY` = `0451299a9ab9a1dcff3404ee8ba8a13c4186a4a570cdce2d5c9ae69fc53e630c`
   - `NEXTAUTH_SECRET` = *(generate dengan `openssl rand -base64 32` di terminal, atau pakai generator online)*
   - `AUTH_USERNAME` = `admin` *(atau username pilihan Anda)*
   - `AUTH_PASSWORD` = `ganti-password-kuat-anda` *(WAJIB ganti dari default)*
5. Redeploy. Selesai!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option B: Netlify

1. Push ke GitHub
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Tambahkan environment variables di **Site settings → Environment variables**:
   - `EMON_API_KEY`, `NEXTAUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD`
5. Deploy. Gunakan [Next.js Runtime plugin](https://docs.netlify.com/integrations/frameworks/next-js/) untuk App Router support.

### Option C: Cloudflare Pages

1. Push ke GitHub
2. [pages.cloudflare.com](https://pages.cloudflare.com) → **Create project** → connect repo
3. Build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
4. Tambahkan `EMON_API_KEY` di **Settings → Environment variables**
5. Save and Deploy.

### Option D: Self-hosted (VPS / Docker)

```bash
# Build dan jalankan production
npm run build
npm run start

# Atau dengan Docker (buat Dockerfile sendiri):
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build
#
# FROM node:20-alpine AS runner
# WORKDIR /app
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public
# ENV NODE_ENV=production
# EXPOSE 3000
# CMD ["node", "server.js"]
```

> Untuk self-hosted, `next.config.ts` sudah menggunakan `output: "standalone"` untuk ukuran bundle minimal.

## 📁 Struktur Project

```
.
├── public/
│   ├── emon-fallback.json     # Snapshot JSON fallback
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── api/emon/route.ts  # Proxy API ke upstream PUPR (hindari CORS)
│   │   ├── layout.tsx         # Root layout + metadata SEO
│   │   ├── page.tsx           # Halaman dashboard utama
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── filter-panel.tsx           # Filter utama (search/satker/PPK/status/range)
│   │   │   ├── subkode-filter-panel.tsx   # Filter cascading sub-kode (5 level)
│   │   │   ├── kpi-cards.tsx              # 4 kartu KPI
│   │   │   ├── charts.tsx                 # 5 visualisasi (bar/scatter/donut/top/subkode)
│   │   │   └── data-table.tsx             # Tabel + detail dialog
│   │   └── ui/                            # shadcn/ui components
│   ├── lib/
│   │   ├── emon-types.ts      # TypeScript types
│   │   ├── emon-utils.ts      # Helpers (format, normalize, status)
│   │   ├── db.ts              # Prisma client (opsional)
│   │   └── utils.ts           # cn() helper
│   └── hooks/
├── prisma/schema.prisma       # Skema DB (opsional, tidak wajib untuk dashboard)
├── .env.example
├── .gitignore
├── .nvmrc
├── next.config.ts
├── package.json
└── README.md
```

## 🔒 Catatan Keamanan API

- API route `/api/emon` berjalan **server-side** sehingga API key upstream **tidak terekspos** di browser client
- API key di-read dari `process.env.EMON_API_KEY` atau `process.env.EMON_API_URL`
- Bila ingin mengganti endpoint upstream, cukup ubah `DEFAULT_BASE_URL` di `src/app/api/emon/route.ts`
- Fallback JSON (`public/emon-fallback.json`) berisi snapshot data terakhir — berguna saat development offline

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push: `git push origin feat/nama-fitur`
5. Buka Pull Request

## 📄 License

MIT — lihat file [LICENSE](LICENSE).

## 📊 Sumber Data

- **API**: `apigw.pu.go.id/v1/emon/paket/test` (Kementerian PUPR RI)
- **Update**: Real-time setiap request, dengan fallback ke snapshot lokal
- **Total data**: 300 paket dari 10 satker (BBWS NT II + 9 SNVT ATAB/JIPA)

---

Dibangun dengan Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, dan Recharts.
