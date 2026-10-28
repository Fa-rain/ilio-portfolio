# 📁 Direktori Penyimpanan Karya (`karya/`)

Direktori ini digunakan untuk menyimpan seluruh berkas, data, dan aset dari penambahan proyek / **karya** mahasiswa Informatika UNSOED '26 ke dalam platform **Ilio**.

---

## 📂 Struktur Direktori

```text
karya/
├── karya.json       # Database katalog karya dalam format JSON
├── uploads/         # Direktori penyimpanan file & gambar pendukung karya
└── README.md        # Dokumentasi direktori penyimpanan karya
```

---

## 📌 Penjelasan Berkas

1. **`karya.json`**
   - Berisi data entri karya (id, judul, kategori, jumlah anggota, pembuat, deskripsi, tech stack, tanggal).
   - Data karya baru yang ditambahkan melalui website disimpan secara otomatis ke `localStorage` peramban serta dapat diekspor/disinkronkan ke dalam berkas ini.

2. **`uploads/`**
   - Tempat meletakkan berkas gambar *thumbnail*, poster, dokumentasi hasil proyek, atau berkas pendukung karya sebelum ditautkan ke sistem portofolio.
   - Format gambar yang disarankan: `.png`, `.jpg`, `.jpeg`, `.webp`.

3. **Integrasi Vanilla JavaScript (`script.js`)**
   - Sistem penambahan karya diproses oleh `script.js` (ES6+) dengan validasi angka jumlah anggota/modul yang ketat, penyimpanan dinamis, dan kalkulasi metrik langsung ke antarmuka website tanpa memuat ulang halaman (*real-time*).

