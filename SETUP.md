# Biks.ai — Local Setup

## Prerequisites

- Node.js v20+ — [nodejs.org](https://nodejs.org)
- pnpm — `npm install -g pnpm`

## Steps

**1. Clone & install**
```bash
git clone https://github.com/reva007kali/biks-ai.git
cd biks-ai
pnpm install
```

**2. Buat file `.env`** di root project, isi dengan keys dari team lead:
```env
# Manus Agent API (untuk AI analysis)
MANUS_API_KEY=

# EXA Search API (untuk lead discovery)
EXA_API_KEY=

# Mem0 API (untuk memory feature)
MEM0_API_KEY=

# Resend Email API (untuk kirim email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Supabase (auth + Postgres). Dari Supabase Dashboard → Project Settings → API.
# Kosongkan keduanya kalau mau jalan TANPA login (mode fallback lokal).
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
OWNER_EMAIL=            # opsional: email yang boleh akses prosedur admin

PORT=3000
```

**3. Setup database Supabase** (sekali saja, hanya jika pakai login)
- Buka Supabase Dashboard → **SQL Editor** → jalankan isi file [`supabase/schema.sql`](supabase/schema.sql).
  Ini membuat tabel `profiles` + `histories`, RLS, dan trigger auto-buat profile saat signup.
- Dashboard → **Authentication → URL Configuration**: tambahkan URL app (mis. `http://localhost:3000`
  dan domain produksi) ke *Site URL* / *Redirect URLs*.
- (Opsional) Authentication → Providers → Email: matikan *Confirm email* kalau mau user langsung
  login setelah signup tanpa verifikasi email.

**4. Jalankan**
```bash
pnpm dev
```

Buka `http://localhost:3000`. Jika `VITE_SUPABASE_*` diisi, app meminta login (email/password)
dan menyimpan data user ke Postgres Supabase. Jika dikosongkan, app jalan tanpa login.

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Port 3000 sudah dipakai | App otomatis pakai port berikutnya (3001, 3002, dst.) |
| `pnpm: command not found` | Jalankan `npm install -g pnpm` dulu |
| API keys tidak jalan | Pastikan tidak ada spasi di sekitar `=` di file `.env` |
| Analyze website lama (2-3 menit) | Normal — Manus agent butuh waktu untuk proses, tunggu saja |
| Analyze website timeout | Coba lagi, Manus kadang butuh retry pertama kali |
