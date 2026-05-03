# 📋 Panduan Setup & Deployment E-Kinerja PWA ke Cloudflare

## 🔧 Prasyarat

- GitHub repository dengan project ini
- Account Cloudflare (gratis atau berbayar)
- Node.js v16+ (untuk development lokal)
- Git installed

---

## 📦 OPSI 1: CLOUDFLARE PAGES (DIREKOMENDASIKAN) ✨

Cloudflare Pages adalah pilihan terbaik untuk SPA/PWA seperti ini karena:

- ✅ Automatic routing untuk SPA
- ✅ Deployment otomatis dari GitHub
- ✅ SSL/TLS gratis
- ✅ Cache dengan kontrol penuh
- ✅ Analytics built-in

### Step-by-Step Setup:

#### 1. Siapkan Repository GitHub

```bash
git remote -v  # Pastikan remote sudah terhubung ke GitHub

# Jika belum, tambahkan:
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

#### 2. Connect ke Cloudflare Pages

1. Login ke Cloudflare Dashboard: https://dash.cloudflare.com/
2. Klik **Workers & Pages** → **Pages** → **Create a project**
3. Pilih **Connect to Git**
4. Authorisasi GitHub dan pilih repository
5. Konfigurasi Build Settings:
   - **Framework**: None (Vanilla)
   - **Build command**: `npm run build` (atau kosongkan)
   - **Build output directory**: `.` (root folder)
   - **Root directory**: `/` (atau kosongkan)
6. Klik **Save and Deploy**

#### 3. Setelah Deploy Berhasil

```
Domain akan berupa: your-project.pages.dev
Contoh: ekinerja-pro.pages.dev
```

#### 4. Custom Domain (Opsional)

1. Klik project → **Settings** → **Custom domain**
2. Masukkan domain Anda (misal: ekinerja.yourdomain.com)
3. Update DNS di registrar domain

---

## 🔌 OPSI 2: CLOUDFLARE WORKERS (Advanced)

Jika menggunakan Cloudflare Workers:

### Setup Lokal dengan Wrangler

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login ke Cloudflare
wrangler login

# 3. Deploy project
wrangler publish

# 4. Atau untuk Pages:
wrangler pages publish . --project-name=ekinerja-pro
```

### Konfigurasi wrangler.toml

```toml
name = "ekinerja-pro"
type = "javascript"
account_id = "your-account-id"

[env.production]
route = "ekinerja-pro.sneijderlino.workers.dev/*"
zone_id = "your-zone-id"
```

Dapatkan `account_id` dan `zone_id`:

1. Cloudflare Dashboard → **Account Home** → Copy Account ID
2. Dashboard → **Websites** → Domain → **Copy Zone ID**

---

## 🌐 KONFIGURASI URL DAN ROUTING

### File-File Penting:

**1. `_redirects` - Routing SPA**

```
/* /index.html 200
```

✅ Semua route diarahkan ke index.html untuk SPA routing

**2. `service-worker.js` - Smart Caching**

- ✅ Cache busting otomatis dengan versioning
- ✅ Different strategies per asset type
- ✅ Cleanup cache lama

**3. `manifest.json` - PWA Config**

```json
{
  "start_url": "/index.html",
  "scope": "/"
}
```

---

## ⚡ FORCE PURGE CACHE CLOUDFLARE

Jika setelah deploy masih melihat versi lama:

### Method 1: Cloudflare Dashboard (Paling Mudah)

1. Login ke https://dash.cloudflare.com/
2. Pilih domain Anda
3. **Caching** → **Cache Rules** (atau **Page Rules**)
4. Klik **Purge Cache**
5. Pilih:
   - **Purge everything** (seluruh cache)
   - Atau specific URL: `/index.html`, `/assets/*`, dll
6. Klik **Purge**

### Method 2: Gunakan API Cloudflare

```bash
# Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purge specific files
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://ekinerja-pro.pages.dev/index.html","https://ekinerja-pro.pages.dev/service-worker.js"]}'
```

### Method 3: Browser DevTools

```javascript
// Clear cached service worker:
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

// Clear caches
caches.keys().then((names) => {
  Promise.all(names.map((name) => caches.delete(name)));
});

// Refresh halaman
window.location.reload();
```

### Method 4: Hard Refresh Browser

```
Chrome/Edge: Ctrl+Shift+Delete kemudian Ctrl+Shift+R
Firefox: Ctrl+Shift+Delete kemudian Ctrl+F5
Safari: Hold Option, klik Reload
```

---

## 🔍 DEBUGGING CACHE ISSUES

### Check Cache Status di Browser:

```javascript
// Di Console Browser
// 1. Cek Service Workers
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => console.log("SW:", reg));
});

// 2. Cek Caches
caches.keys().then((names) => {
  console.log("Caches:", names);
  names.forEach((name) => {
    caches.open(name).then((cache) => {
      cache.keys().then((requests) => {
        console.log(
          `${name}:`,
          requests.map((r) => r.url),
        );
      });
    });
  });
});

// 3. Clear everything
Promise.all([
  caches
    .keys()
    .then((names) => Promise.all(names.map((n) => caches.delete(n)))),
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister()))),
]).then(() => location.reload());
```

### Check HTTP Headers di Network Tab:

```
Cache-Control: max-age=31536000  // Assets (1 tahun)
Cache-Control: no-cache          // HTML (always revalidate)
Cache-Control: max-age=3600      // Service Worker (1 jam)
```

---

## 📊 PRODUCTION CHECKLIST

Sebelum production:

- [ ] Push all changes ke GitHub
- [ ] Verify build status di Cloudflare (green ✓)
- [ ] Test di incognito window (clear cache)
- [ ] Check service worker registration (DevTools → Application)
- [ ] Verify manifest.json loads correctly
- [ ] Test offline functionality (DevTools → Network → Offline)
- [ ] Purge cache jika sudah verified
- [ ] Monitor dengan Cloudflare Analytics

---

## 🚀 DEPLOYMENT WORKFLOW

### Daily Updates:

```bash
# 1. Make changes locally
git add .
git commit -m "Fix: [description]"
git push origin main

# 2. Cloudflare auto-deploys (monitor di dashboard)

# 3. If cache issue, purge:
# Dashboard → Caching → Purge Cache → Purge Everything
```

### Production Release:

```bash
# 1. Update version di package.json
# 2. Tag release di GitHub
git tag -a v2.1.1 -m "Release v2.1.1"
git push origin v2.1.1

# 3. Deploy dan Purge Cache
# 4. Verify pada staging terlebih dahulu
```

---

## 🐛 TROUBLESHOOTING

### ❌ "Situs ini tidak dapat dijangkau" (ERR_FAILED)

**Penyebab:**

1. ❌ Output directory salah di Cloudflare → ✅ Set ke `.` (root)
2. ❌ Tidak ada index.html di root → ✅ File harus di root repo
3. ❌ Build settings wrong → ✅ Set "Build output directory" ke `.`
4. ❌ \_redirects file missing → ✅ Tambahkan \_redirects

**Solusi:**

```bash
# 1. Verify struktur
ls -la index.html
ls -la service-worker.js
ls -la _redirects

# 2. Rebuild
git add .
git commit -m "Fix: Update deployment config"
git push origin main

# 3. Wait untuk build selesai (~2 menit)
# Monitor di: Cloudflare Dashboard → Pages → Deployments
```

### ❌ "Versi lama masih tampil"

**Penyebab:** Cache tidak di-purge

**Solusi:**

1. Dashboard → Caching → Purge Cache → Purge Everything
2. Wait 30 detik
3. Hard refresh browser (Ctrl+Shift+R)
4. Clear Service Worker di DevTools

### ❌ Service Worker error

**Debug:**

```javascript
// Di Console
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => {
    console.log("Active:", reg.active);
    console.log("Scope:", reg.scope);
    if (reg.active) console.log("State:", reg.active.state);
  });
});
```

---

## 📞 Useful Links

- Cloudflare Dashboard: https://dash.cloudflare.com/
- Pages Documentation: https://developers.cloudflare.com/pages/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- Cache Control Guide: https://developers.cloudflare.com/cache/concepts/cache-control/
- PWA Guide: https://web.dev/progressive-web-apps/

---

## 💡 BEST PRACTICES

1. **Versioning**: Update `CACHE_VERSION` di service-worker.js setiap build
2. **Monitoring**: Setup Cloudflare Alerts untuk uptime
3. **Analytics**: Check user behavior di Cloudflare Analytics
4. **Backups**: Regular commit ke GitHub sebelum deploy
5. **Testing**: Test offline di DevTools sebelum production

---

Generated: 2024
Last Updated: May 2026
