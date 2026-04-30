# TODO: Perbaikan Tampilan Dashboard di Android

## Masalah

Tampilan bagian "Total Laporan" dan elemen dashboard lainnya tidak full/break di Android.

## Penyebab

Terdapat tag HTML `<div>` yang tidak ditutup di `index.html`:

1. Stat card "Total Laporan" tidak ditutup sebelum card "Bulan Ini"
2. `.chart-header` tidak ditutup sebelum `<canvas>`
3. Tiga `.activity-item` tidak ditutup

## Perbaikan (index.html)

- [x] Tutup `</div>` untuk stat-card pertama (Total Laporan)
- [x] Tutup `</div>` untuk stat-card kedua (Bulan Ini)
- [x] Tutup `</div>` untuk chart-header
- [x] Tutup `</div>` untuk ketiga activity-item

## Follow-up

- Test buka di browser Android setelah perbaikan.
