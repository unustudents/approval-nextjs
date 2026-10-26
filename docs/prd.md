---
title: "Office Approval"
doc_id: "PRD-OA-001"
version: "1.0"
status: "Draft"
owner: "[PERLU KONFIRMASI]"
tanggal: "2026-10-22"
---

# 1. Ringkasan Eksekutif

**Office Approval** adalah aplikasi web internal untuk mendigitalisasi proses pengajuan dan persetujuan pembelian di lingkungan kantor.

Proses saat ini masih menggunakan dokumen kertas yang berpindah antar unit dan antar gedung. Pengajuan dari Kepala Unit atau Supervisor diteruskan melalui sejumlah pihak untuk mendapatkan persetujuan dan pertimbangan sebelum pembelian dapat dilakukan. Kondisi ini menyebabkan proses lambat, sulit dipantau, tidak paperless, dan berisiko membuat pengadaan terlambat.

Office Approval akan menyediakan proses digital dari pembuatan pengajuan sampai keputusan akhir. Pengajuan dibuat oleh Kepala Unit atau Supervisor, disetujui oleh Manager yang membawahi unit tersebut, kemudian otomatis diarahkan kepada pemberi pertimbangan berdasarkan kategori barang, dan selanjutnya diteruskan kepada pihak keuangan sebagai approver.

Sistem harus menggunakan workflow yang dapat dikonfigurasi sehingga perubahan approver, pemberi pertimbangan, kategori barang, atau struktur organisasi tidak memerlukan perubahan kode aplikasi.

Target utama produk adalah:

- proses pengajuan pembelian menjadi paperless;
- keputusan approval selesai maksimal **1 hari kerja**;
- status pengajuan dapat diketahui secara transparan;
- informasi approval dapat diperoleh dengan cepat;
- histori pengajuan tidak hilang dan dapat ditelusuri;
- proses approval dapat diukur melalui dashboard.

Versi pertama dibangun sebagai aplikasi web menggunakan **Next.js + Prisma**, dengan target pengembangan **2 minggu**, dilanjutkan pilot selama **1 minggu** sebelum rollout penuh.

---

# 2. Latar Belakang & Masalah

## 2.1 Proses Saat Ini

Proses pengajuan pembelian saat ini secara umum adalah:

1. Kepala Unit atau Supervisor membuat pengajuan dalam bentuk kertas.
2. Dokumen diserahkan kepada TU/Umum.
3. TU/Umum melakukan administrasi dan pengarsipan.
4. Manager yang membawahi unit pemohon memberikan persetujuan.
5. Berdasarkan jenis barang, pengajuan meminta pertimbangan dari pihak terkait.
6. Pengajuan diteruskan kepada pihak keuangan.
7. Manager Keuangan dan/atau Wakil Direktur Keuangan memberikan keputusan sesuai alur yang berlaku.
8. Pengadaan dapat dilakukan setelah approval selesai.
9. Hasil proses dapat dilaporkan kepada Direktur.

Contoh pemberi pertimbangan:

- perangkat TI → pihak/Manager TI;
- barang sarana/elektronik → pihak terkait sarana atau penunjang;
- barang medis → pihak terkait barang medis;
- barang rumah tangga → pihak terkait;
- kategori lainnya → pihak yang ditentukan dalam konfigurasi.

## 2.2 Masalah Utama

### M-01 — Proses berbasis kertas

Seluruh pengajuan masih mengandalkan dokumen fisik sehingga organisasi belum dapat menjalankan proses pengadaan secara paperless.

### M-02 — Waktu proses terlalu lama

Dokumen harus berpindah antar bagian dan antar gedung sehingga waktu approval bertambah sebelum pengadaan dapat diproses.

### M-03 — Birokrasi panjang

Terdapat sejumlah tahapan administratif yang membuat proses sulit dipantau dan menghambat kecepatan pengadaan.

### M-04 — Kurangnya transparansi

Pemohon sulit mengetahui posisi pengajuan, siapa yang sedang memproses, dan apakah pengajuan sedang menunggu pertimbangan atau keputusan.

### M-05 — Risiko kehilangan data

Dokumen fisik atau data pengajuan berisiko hilang. Risiko ini memiliki dampak operasional tinggi karena Office Approval akan menjadi sumber informasi utama pengajuan pembelian.

### M-06 — Tidak tersedia data performa approval

Organisasi belum memiliki informasi terukur mengenai:

- rata-rata waktu approval;
- jumlah pengajuan pending;
- jumlah pengajuan disetujui;
- jumlah pengajuan ditolak.

## 2.3 Volume Pengajuan

Pengajuan terjadi **setiap hari**, tetapi jumlah rata-rata pengajuan per hari atau per bulan belum dihitung.

**[PERLU KONFIRMASI]** baseline jumlah pengajuan harian dan bulanan perlu diperoleh setelah sistem mulai digunakan atau dari arsip pengajuan lama.

---

# 3. Tujuan & Metrik Keberhasilan

## 3.1 Tujuan

| ID   | Tujuan                                                | Metrik                                                        | Baseline               | Target                                          | Cara Ukur                                           |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------- | ---------------------- | ----------------------------------------------- | --------------------------------------------------- |
| G-01 | Mengubah proses pengajuan pembelian menjadi paperless | Persentase pengajuan yang dibuat melalui Office Approval      | Proses berbasis kertas | 100% pengajuan dalam kondisi sistem normal      | Jumlah pengajuan digital ÷ seluruh pengajuan × 100% |
| G-02 | Mempercepat keputusan approval                        | Waktu dari pengajuan dikirim sampai keputusan akhir           | [PERLU KONFIRMASI]     | Maksimal 1 hari kerja                           | Timestamp submit sampai timestamp keputusan akhir   |
| G-03 | Meningkatkan transparansi                             | Persentase pengajuan yang memiliki status dan histori lengkap | Tidak tersedia         | 100%                                            | Audit histori setiap pengajuan                      |
| G-04 | Menyediakan informasi performa approval               | Ketersediaan metrik dashboard                                 | Tidak tersedia         | 4 metrik utama tersedia                         | Verifikasi dashboard                                |
| G-05 | Mengurangi risiko kehilangan data                     | Persentase pengajuan tersimpan dan dapat ditelusuri           | [PERLU KONFIRMASI]     | 100% pengajuan yang berhasil disubmit tersimpan | Pemeriksaan database dan audit trail                |

Empat metrik wajib dashboard pada G-04 adalah:

1. rata-rata waktu approval;
2. jumlah pengajuan pending;
3. jumlah pengajuan disetujui;
4. jumlah pengajuan ditolak.

## 3.2 Non-Tujuan

Versi pertama Office Approval **tidak** bertujuan untuk:

- mengelola proses pembelian ke vendor;
- mengelola stok atau inventory;
- melakukan pembayaran;
- menggantikan sistem keuangan;
- melakukan integrasi ke sistem keuangan;
- menyediakan aplikasi Android atau iOS native;
- menyediakan tanda tangan digital;
- mengelola proses setelah pengajuan dinyatakan disetujui;
- menggantikan sistem procurement secara keseluruhan.

---

# 4. Pengguna & Skenario

## 4.1 Persona

### Persona P-01 — Kepala Unit / Supervisor

Tanggung jawab:

- membuat pengajuan;
- melengkapi informasi barang;
- melihat status;
- memperbaiki pengajuan apabila diminta revisi.

Kebutuhan utama:

- mengajukan dengan cepat;
- mengetahui posisi pengajuan;
- mengetahui catatan dari Manager, pemberi pertimbangan, atau approver.

### Persona P-02 — Manager Unit

Tanggung jawab:

- meninjau pengajuan dari unit yang berada di bawah tanggung jawabnya;
- menyetujui, menolak, atau meminta revisi sebelum pengajuan diteruskan.

### Persona P-03 — Pemberi Pertimbangan

Contoh:

- Manager TI;
- pihak penunjang;
- pihak terkait barang medis;
- pihak lain sesuai konfigurasi.

Tanggung jawab:

- memberikan pertimbangan atau catatan berdasarkan bidangnya.

Pemberi pertimbangan **bukan approver final**.

### Persona P-04 — Manager Keuangan / Wakil Direktur Keuangan

Tanggung jawab:

- melakukan approval sesuai workflow;
- menyetujui;
- menolak;
- meminta revisi jika workflow mengizinkan.

### Persona P-05 — TU / Umum

Tanggung jawab:

- melakukan fungsi administratif;
- melihat dan mengarsipkan pengajuan;
- memonitor proses sesuai hak akses.

TU/Umum bukan approver.

### Persona P-06 — Superadmin

Tanggung jawab:

- membuat akun pengguna;
- mengelola role;
- mengelola unit;
- mengelola kategori;
- mengatur workflow;
- menentukan approver dan pemberi pertimbangan.

## 4.2 User Stories

### US-01

Sebagai Kepala Unit/Supervisor, saya ingin membuat pengajuan pembelian secara digital agar tidak perlu menggunakan form kertas.

### US-02

Sebagai Kepala Unit/Supervisor, saya ingin mengetahui status dan posisi pengajuan agar saya mengetahui siapa yang sedang memprosesnya.

### US-03

Sebagai Manager Unit, saya ingin melakukan approval pengajuan unit saya agar pengajuan yang tidak relevan tidak diteruskan.

### US-04

Sebagai pemberi pertimbangan, saya ingin melihat detail barang dan memberikan catatan agar approver keuangan memperoleh informasi pendukung.

### US-05

Sebagai approver keuangan, saya ingin melihat pengajuan beserta seluruh catatan sebelumnya agar dapat membuat keputusan.

### US-06

Sebagai pemohon, saya ingin memperbaiki pengajuan yang belum mendapatkan approval final agar tidak perlu membuat pengajuan baru.

### US-07

Sebagai TU/Umum, saya ingin melihat pengajuan dan histori proses agar fungsi pengarsipan dapat dilakukan secara digital.

### US-08

Sebagai Superadmin, saya ingin mengatur workflow tanpa mengubah kode aplikasi agar perubahan organisasi dapat diterapkan dengan cepat.

### US-09

Sebagai manajemen, saya ingin melihat statistik approval agar dapat mengetahui performa proses pengadaan.

### US-10

Sebagai pengguna, saya ingin mengetahui perubahan status pengajuan agar tidak harus terus membuka halaman daftar pengajuan.

---

# 5. Persyaratan Fungsional

## 5.1 Autentikasi & Pengguna

### FR-001 — Login

Sistem **harus** memungkinkan pengguna login menggunakan username dan password yang dibuat oleh Superadmin.

**Prioritas:** P0  
**Terkait:** US-01 sampai US-10, G-03

**Acceptance Criteria**

**Given** pengguna memiliki akun aktif  
**When** pengguna memasukkan kredensial yang benar  
**Then** sistem menampilkan halaman sesuai hak akses pengguna.

**Edge case:** Kredensial salah harus ditolak tanpa membuka informasi internal.

---

### FR-002 — Tidak Ada Registrasi Mandiri

Sistem **tidak boleh** menyediakan registrasi akun mandiri untuk pengguna biasa.

**Prioritas:** P0  
**Terkait:** US-08, G-03

**Acceptance Criteria**

**Given** pengguna belum memiliki akun  
**When** pengguna membuka halaman login  
**Then** sistem tidak menyediakan fungsi pendaftaran akun.

---

### FR-003 — Manajemen User

Superadmin **harus** dapat membuat, mengaktifkan, menonaktifkan, dan mengubah akun pengguna.

**Prioritas:** P0  
**Terkait:** US-08

---

### FR-004 — Role & Unit

Superadmin **harus** dapat menentukan role, unit kerja, serta Manager yang membawahi setiap pengguna.

**Prioritas:** P0  
**Terkait:** US-03, US-08

---

# 5.2 Pengajuan

### FR-005 — Membuat Pengajuan

Kepala Unit atau Supervisor **harus** dapat membuat pengajuan pembelian.

**Prioritas:** P0  
**Terkait:** US-01, G-01

Minimal data pengajuan:

- pemohon;
- unit pemohon;
- tanggal pengajuan;
- kategori;
- barang yang diajukan;
- jumlah barang;
- catatan/keterangan kebutuhan.

Informasi tambahan lain **[PERLU KONFIRMASI]**.

**Acceptance Criteria**

**Given** pengguna memiliki role Kepala Unit atau Supervisor  
**When** pengguna mengisi field wajib dan mengirim pengajuan  
**Then** sistem membuat nomor pengajuan dan menyimpan pengajuan.

---

### FR-006 — Lampiran

Pemohon **harus** dapat menambahkan lampiran pada pengajuan.

**Prioritas:** P0  
**Terkait:** US-01

Format dan ukuran maksimum file **[PERLU KONFIRMASI]**.

---

### FR-007 — Nomor Pengajuan

Sistem **harus** memberikan identifier unik untuk setiap pengajuan.

**Prioritas:** P0  
**Terkait:** US-01, US-07, G-03

**Acceptance Criteria**

**Given** pengajuan berhasil disubmit  
**When** data tersimpan  
**Then** sistem menghasilkan identifier yang tidak sama dengan pengajuan lain.

---

# 5.3 Kategori & Routing

### FR-008 — Kategori Pengajuan

Superadmin **harus** dapat mengelola kategori pengajuan tanpa perubahan kode aplikasi.

**Prioritas:** P0  
**Terkait:** US-08

Kategori awal:

- Perangkat TI;
- Elektronik;
- Barang Medis;
- Barang Rumah Tangga;
- Lainnya.

---

### FR-009 — Routing Manager Unit

Setiap pengajuan **harus** terlebih dahulu diarahkan kepada Manager yang membawahi unit pemohon.

**Prioritas:** P0  
**Terkait:** US-03, G-02

**Acceptance Criteria**

**Given** Kepala Unit/Supervisor mengirim pengajuan  
**When** pengajuan berhasil disubmit  
**Then** status berubah menjadi menunggu persetujuan Manager Unit dan belum diteruskan ke tahap berikutnya.

---

### FR-010 — Routing Pemberi Pertimbangan

Sistem **harus** menentukan pemberi pertimbangan secara otomatis berdasarkan kategori pengajuan.

**Prioritas:** P0  
**Terkait:** US-04, US-08, G-02

**Acceptance Criteria**

**Given** Manager Unit menyetujui pengajuan  
**When** kategori pengajuan memiliki pemberi pertimbangan aktif  
**Then** sistem mengirim pengajuan kepada pemberi pertimbangan yang dikonfigurasi.

---

### FR-011 — Workflow Dinamis

Superadmin **harus** dapat mengubah urutan workflow, approver, dan pemberi pertimbangan tanpa mengubah source code.

**Prioritas:** P0  
**Terkait:** US-08

---

### FR-012 — Workflow per Kategori

Sistem **harus** mendukung workflow yang berbeda untuk setiap kategori pengajuan.

**Prioritas:** P0  
**Terkait:** US-08

Contoh:

`Perangkat TI → Manager Unit → Manager TI sebagai pertimbangan → Approval Keuangan`

---

# 5.4 Pertimbangan & Approval

### FR-013 — Catatan Pertimbangan

Pemberi pertimbangan **harus** dapat memberikan catatan terhadap pengajuan.

**Prioritas:** P0  
**Terkait:** US-04

---

### FR-014 — Approval Manager Unit

Manager Unit **harus** dapat memilih tindakan setuju, tolak, atau revisi terhadap pengajuan unitnya.

**Prioritas:** P0  
**Terkait:** US-03

---

### FR-015 — Approval Keuangan

Approver keuangan **harus** dapat menyetujui, menolak, atau meminta revisi sesuai konfigurasi workflow.

**Prioritas:** P0  
**Terkait:** US-05, G-02

---

### FR-016 — Catatan Keputusan

Sistem **harus** menyimpan catatan yang diberikan pada tindakan approve, reject, revisi, dan pertimbangan.

**Prioritas:** P0  
**Terkait:** US-02, US-05, G-03

---

### FR-017 — Revisi

Pemohon **harus** dapat memperbaiki pengajuan yang dikembalikan untuk revisi selama pengajuan belum mencapai approval final.

**Prioritas:** P0  
**Terkait:** US-06

**Acceptance Criteria**

**Given** pengajuan berstatus perlu revisi dan belum mendapat approval final  
**When** pemohon memperbarui data dan mengirim ulang  
**Then** sistem menyimpan versi terbaru tanpa menghapus histori sebelumnya.

**Edge case:** Pengajuan yang telah final tidak boleh diedit oleh pemohon.

---

# 5.5 Status & Tracking

### FR-018 — Status Pengajuan

Sistem **harus** menampilkan status aktif setiap pengajuan.

**Prioritas:** P0  
**Terkait:** US-02, G-03

Status minimal:

- Draft;
- Menunggu Manager Unit;
- Menunggu Pertimbangan;
- Menunggu Approval Keuangan;
- Perlu Revisi;
- Disetujui;
- Ditolak.

---

### FR-019 — Posisi Pengajuan

Sistem **harus** menampilkan pihak atau tahapan yang saat ini sedang menunggu tindakan.

**Prioritas:** P0  
**Terkait:** US-02, G-03

---

### FR-020 — Histori

Sistem **harus** menampilkan histori proses pengajuan secara kronologis.

**Prioritas:** P0  
**Terkait:** US-02, US-07, G-03

Histori minimal berisi:

- waktu tindakan;
- pengguna;
- role;
- tindakan;
- catatan;
- status setelah tindakan.

---

# 5.6 Notifikasi

### FR-021 — Notifikasi Tugas

Sistem **harus** membuat notifikasi ketika pengguna memperoleh pengajuan yang membutuhkan tindakan.

**Prioritas:** P0  
**Terkait:** US-10, G-02

---

### FR-022 — Notifikasi Perubahan Status

Sistem **harus** memberi notifikasi kepada pemohon ketika pengajuan berubah status menjadi revisi, ditolak, atau disetujui.

**Prioritas:** P0  
**Terkait:** US-10

Media notifikasi awal adalah notifikasi di aplikasi.

Notifikasi melalui WhatsApp, email, atau media eksternal **tidak termasuk scope awal kecuali dikonfirmasi kemudian**.

---

# 5.7 Dashboard

### FR-023 — Dashboard Approval

Sistem **harus** menyediakan dashboard performa approval.

**Prioritas:** P0  
**Terkait:** US-09, G-04

Dashboard minimal menampilkan:

- rata-rata waktu approval;
- jumlah pengajuan pending;
- jumlah pengajuan disetujui;
- jumlah pengajuan ditolak.

---

### FR-024 — Perhitungan Waktu Approval

Sistem **harus** menghitung waktu approval berdasarkan timestamp pengajuan dikirim sampai timestamp keputusan akhir.

**Prioritas:** P0  
**Terkait:** US-09, G-02

Definisi jam kerja dan hari libur untuk perhitungan SLA **[PERLU KONFIRMASI]**.

---

# 5.8 Arsip

### FR-025 — Akses TU/Umum

TU/Umum **harus** dapat melihat pengajuan dan histori yang diberikan hak akses kepadanya tanpa memiliki kewenangan approval.

**Prioritas:** P0  
**Terkait:** US-07

---

### FR-026 — Pencarian Pengajuan

Pengguna yang memiliki akses **harus** dapat mencari pengajuan berdasarkan nomor pengajuan, pemohon, unit, kategori, atau status.

**Prioritas:** P1  
**Terkait:** US-02, US-07

---

# 5.9 Audit

### FR-027 — Audit Trail

Sistem **harus** merekam setiap tindakan yang mengubah status atau isi pengajuan.

**Prioritas:** P0  
**Terkait:** US-07, G-03, G-05

---

### FR-028 — Histori Tidak Hilang Saat Revisi

Sistem **tidak boleh** menghapus histori approval sebelumnya ketika pengajuan direvisi.

**Prioritas:** P0  
**Terkait:** US-06, G-05

---

# 6. Persyaratan Non-Fungsional

### NFR-001 — Teknologi

Aplikasi **harus** dikembangkan menggunakan Next.js dengan Prisma sebagai ORM.

---

### NFR-002 — Web Application

Office Approval **harus** dapat digunakan melalui web browser tanpa membutuhkan instalasi aplikasi mobile native.

Browser minimum yang didukung **[PERLU KONFIRMASI]**.

---

### NFR-003 — Authorization

Sistem **harus** membatasi fitur dan data berdasarkan role dan otorisasi pengguna.

---

### NFR-004 — Password

Password pengguna **tidak boleh** disimpan dalam bentuk plaintext.

Algoritma hashing yang digunakan mengikuti library autentikasi yang dipilih pada implementasi.

---

### NFR-005 — Data Integrity

Setelah sistem menyatakan pengajuan berhasil disimpan, record pengajuan **harus** tersedia kembali ketika dibuka menggunakan identifier pengajuan yang sama.

---

### NFR-006 — Auditability

Perubahan status pengajuan **harus** memiliki informasi pengguna dan timestamp.

---

### NFR-007 — Backup

Database produksi **harus** memiliki mekanisme backup.

Frekuensi backup, retensi, dan Recovery Point Objective **[PERLU KONFIRMASI]** sebelum produksi penuh.

---

### NFR-008 — Recovery

Prosedur pemulihan data **harus** diuji sebelum rollout penuh.

Target Recovery Time Objective **[PERLU KONFIRMASI]**.

---

### NFR-009 — HTTPS

Jika aplikasi dapat diakses melalui jaringan di luar localhost, komunikasi pengguna dengan aplikasi **harus** menggunakan HTTPS.

---

### NFR-010 — Performa

Target waktu respons halaman utama, daftar pengajuan, detail pengajuan, dan dashboard **[PERLU KONFIRMASI]** melalui pengujian performa sebelum rollout penuh.

---

# 7. Alur & Desain

## 7.1 Happy Path

```text
Kepala Unit / Supervisor
        │
        ▼
Membuat Pengajuan
        │
        ▼
Manager Unit
        │
        ├── Tolak ──────────────► Selesai: Ditolak
        │
        ├── Revisi ─────────────► Pemohon memperbaiki
        │
        ▼ Setuju
Pemberi Pertimbangan
berdasarkan kategori
        │
        ▼
Memberikan catatan/masukan
        │
        ▼
Approval Keuangan
        │
        ├── Revisi ─────────────► Pemohon memperbaiki
        │
        ├── Tolak ──────────────► Selesai: Ditolak
        │
        ▼ Setuju
Selesai: Disetujui
```

## 7.2 Prinsip Workflow

Workflow harus memisahkan tiga konsep:

**Approval**  
Keputusan yang menentukan apakah pengajuan dapat melanjutkan proses.

**Pertimbangan**  
Catatan profesional/teknis dari pihak terkait tanpa menjadi approval final.

**Administrasi/Arsip**  
Akses untuk TU/Umum tanpa kewenangan mengubah keputusan.

## 7.3 Halaman Utama

Versi pertama minimal memiliki:

1. Login.
2. Dashboard.
3. Daftar Pengajuan.
4. Buat Pengajuan.
5. Detail Pengajuan.
6. Inbox Approval/Pertimbangan.
7. Histori Pengajuan.
8. Manajemen User.
9. Manajemen Unit.
10. Manajemen Kategori.
11. Manajemen Workflow.

---

# 8. Kebutuhan Teknis & Data

## 8.1 Stack

- Frontend/Backend: Next.js.
- ORM: Prisma.
- Database: [PERLU KONFIRMASI].
- Authentication: credentials username/password.
- Deployment: [PERLU KONFIRMASI].

Kandidat deployment:

- server lokal;
- Vercel;
- hosting yang mendukung kebutuhan Next.js;
- infrastruktur lain yang diputuskan setelah MVP tersedia.

## 8.2 Entitas Data Utama

### User

Minimal:

- id;
- username;
- passwordHash;
- nama;
- role;
- unitId;
- status.

### Unit

Minimal:

- id;
- namaUnit;
- managerId;
- status.

### Category

Minimal:

- id;
- nama;
- status.

### Submission

Minimal:

- id;
- nomorPengajuan;
- requesterId;
- unitId;
- categoryId;
- status;
- createdAt;
- updatedAt;
- submittedAt;
- approvedAt.

### SubmissionItem

Minimal:

- id;
- submissionId;
- namaBarang;
- jumlah;
- hargaSatuan;
- totalHarga (dihitung dari hargaSatuan × jumlah);
- keterangan;
- spesifikasi.

### Workflow

Minimal:

- id;
- nama;
- categoryId;
- status.

### WorkflowStep

Minimal:

- id;
- workflowId;
- urutan;
- tipe;
- targetRole atau targetUser;
- wajib/tidak wajib;
- status.

Tipe step minimal:

- APPROVAL;
- REVIEW/CONSIDERATION.

### ApprovalAction

Minimal:

- id;
- submissionId;
- workflowStepId;
- actorId;
- action;
- catatan;
- timestamp.

### Attachment

Minimal:

- id;
- submissionId;
- filename;
- storageReference;
- uploadedBy;
- uploadedAt.

### Notification

Minimal:

- id;
- userId;
- submissionId;
- type;
- readAt;
- createdAt.

## 8.3 Prinsip Penyimpanan Data

Data pengajuan yang telah memiliki histori approval **tidak boleh** dihapus langsung oleh pengguna biasa.

Mekanisme soft delete atau kebijakan retensi **[PERLU KONFIRMASI]**.

---

# 9. Asumsi, Dependensi & Batasan

## 9.1 Asumsi

- Setiap Kepala Unit/Supervisor memiliki Manager Unit yang dapat ditentukan di sistem.
- Setiap kategori dapat dipetakan ke pemberi pertimbangan.
- Pengguna memiliki akses browser.
- Struktur workflow dapat berubah setelah aplikasi berjalan.
- Tahap keputusan keuangan dapat berbeda sesuai konfigurasi.

## 9.2 Dependensi

- daftar pengguna;
- struktur unit;
- hubungan unit dengan Manager;
- daftar kategori barang;
- daftar pemberi pertimbangan;
- daftar approver keuangan;
- konfigurasi workflow.

## 9.3 Batasan

- target pengembangan versi awal adalah **2 minggu**;
- platform hanya web;
- akun dibuat oleh Superadmin;
- tidak ada self-registration;
- tidak ada aplikasi mobile native;
- tidak ada integrasi sistem keuangan pada versi awal;
- deployment belum ditentukan.

---

# 10. Risiko & Mitigasi

| ID   | Risiko                             | Dampak                                        | Mitigasi                                                                 |
| ---- | ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| R-01 | Approver lambat melakukan tindakan | Target 1 hari kerja tidak tercapai            | Inbox approval, status pending, notifikasi, dan dashboard waktu approval |
| R-02 | Data pengajuan hilang              | Proses pengadaan kehilangan bukti dan histori | Database persisten, backup, audit trail, dan uji recovery                |
| R-03 | Workflow salah konfigurasi         | Pengajuan masuk ke pihak yang salah           | Validasi konfigurasi workflow dan pengujian sebelum diaktifkan           |
| R-04 | User tetap memakai kertas          | Target paperless tidak tercapai               | Pilot, sosialisasi, dan kebijakan penggunaan sistem                      |
| R-05 | Sistem down                        | Pengajuan tidak dapat diproses                | Fallback sementara menggunakan kertas dan proses recovery                |
| R-06 | Perubahan struktur organisasi      | Workflow tidak sesuai                         | Workflow, user, unit, dan approver dibuat configurable                   |
| R-07 | Target pengembangan terlalu pendek | Fitur inti tidak stabil                       | Prioritaskan seluruh P0 sebelum fitur P1                                 |
| R-08 | Deployment belum diputuskan        | Risiko keterlambatan produksi                 | Tentukan environment produksi sebelum pilot berakhir                     |

---

# 11. Rencana Rilis

## 11.1 Tahap Pengembangan — 2 Minggu

### Minggu 1

Fokus:

- autentikasi;
- user & role;
- unit;
- kategori;
- form pengajuan;
- struktur workflow;
- approval Manager Unit;
- pemberi pertimbangan;
- approval keuangan.

### Minggu 2

Fokus:

- revisi;
- histori;
- audit trail;
- notifikasi;
- dashboard;
- arsip TU/Umum;
- pengujian workflow;
- pengujian data;
- persiapan deployment.

## 11.2 Pilot — 1 Minggu

Pilot dilakukan selama **1 minggu** pada pengguna/unit terpilih.

Jumlah unit pilot **[PERLU KONFIRMASI]**.

Selama pilot harus dievaluasi:

- apakah pengajuan berhasil dibuat;
- apakah routing benar;
- apakah approver menerima tugas;
- apakah histori lengkap;
- apakah waktu approval dapat dihitung;
- apakah ada kehilangan data;
- apakah pengguna kembali menggunakan kertas karena kendala sistem.

## 11.3 Rollout Penuh

Rollout penuh dilakukan setelah pilot apabila tidak terdapat defect kritis yang:

- menyebabkan data pengajuan hilang;
- menyebabkan pengajuan tidak dapat dibuka;
- menyebabkan routing ke approver yang salah;
- menyebabkan approval tidak tercatat;
- menyebabkan akses pengguna melampaui hak aksesnya.

## 11.4 Fallback

Jika Office Approval tidak dapat digunakan, proses pengajuan dapat sementara kembali menggunakan dokumen kertas.

Pengajuan kertas yang dibuat selama downtime sebaiknya dimasukkan kembali ke sistem setelah layanan pulih.

---

# 12. Pertanyaan Terbuka

**OQ-01** — Database apa yang akan digunakan bersama Prisma?

**OQ-02** — Office Approval akan ditempatkan di server lokal, Vercel, Hostinger, atau environment lain?

**OQ-03** — Berapa batas ukuran dan format lampiran?

**OQ-04** — Apakah satu pengajuan dapat memiliki lebih dari satu jenis barang?

**OQ-05** — Apakah harga perkiraan dan nilai total pembelian wajib dicatat?

**OQ-06** — Apakah nominal pembelian nantinya menentukan level approver?

**OQ-07** — Apakah Manager Keuangan dan Wakil Direktur Keuangan selalu berurutan atau dapat dipilih berdasarkan workflow?

**OQ-08** — Apakah sebuah kategori dapat memiliki lebih dari satu pemberi pertimbangan?

**OQ-09** — Apakah pertimbangan harus diberikan sebelum pengajuan dapat masuk ke approval keuangan?

**OQ-10** — Jam kerja dan hari kerja apa yang digunakan untuk menghitung target maksimal 1 hari kerja?

**OQ-11** — Berapa frekuensi backup database dan berapa lama backup disimpan?

**OQ-12** — Berapa target waktu pemulihan sistem jika terjadi kerusakan?

**OQ-13** — Berapa target performa halaman utama dan dashboard?

**OQ-14** — Berapa unit yang akan mengikuti pilot minggu pertama?

**OQ-15** — Siapa owner resmi PRD dan Product Owner Office Approval?

Pertanyaan terbuka di atas tidak menghalangi dimulainya development MVP, kecuali keputusan yang berkaitan langsung dengan database, deployment, dan keamanan produksi.

---

# 13. Glosarium

**Approval**  
Tindakan menyetujui atau menolak pengajuan yang memengaruhi kelanjutan workflow.

**Approver**  
Pengguna yang memiliki kewenangan memberikan approval.

**Pemberi Pertimbangan**  
Pengguna yang memberikan catatan profesional/teknis tanpa menjadi approver final.

**Pemohon**  
Kepala Unit atau Supervisor yang membuat pengajuan.

**Manager Unit**  
Manager yang membawahi unit pemohon dan memberikan approval pertama.

**TU/Umum**  
Pihak administratif yang memiliki fungsi arsip dan monitoring, bukan approval.

**Workflow**  
Urutan tahapan yang harus dilewati sebuah pengajuan.

**Workflow Step**  
Satu tahapan di dalam workflow.

**Paperless**  
Pengajuan diproses tanpa dokumen kertas selama Office Approval dalam kondisi normal.

**Audit Trail**  
Catatan kronologis tindakan pengguna terhadap pengajuan.

**Approval Final**  
Keputusan terakhir pada workflow yang menyebabkan pengajuan berstatus Disetujui atau Ditolak.

**Pending**  
Pengajuan yang masih menunggu tindakan pada salah satu tahap workflow.

---

# 14. Riwayat Revisi

| Versi | Tanggal    | Perubahan                                                      | Penulis            |
| ----- | ---------- | -------------------------------------------------------------- | ------------------ |
| 1.0   | 2026-10-22 | PRD awal berdasarkan hasil wawancara kebutuhan Office Approval | [PERLU KONFIRMASI] |

---

# Checklist Kualitas

### Requirement Terukur

**Status: sebagian besar terpenuhi.**

Requirement proses memiliki actor, tindakan, kondisi, dan hasil yang dapat diuji.

Beberapa NFR masih membutuhkan angka sebelum produksi, khususnya:

- performa;
- ukuran file;
- backup;
- RPO/RTO;
- definisi jam kerja.

Bagian tersebut sengaja ditandai **[PERLU KONFIRMASI]** dan tidak dibuat asumsi.

### Kontradiksi

**Tidak ditemukan kontradiksi utama.**

Peran telah dipisahkan menjadi:

- Kepala Unit/SPV = pemohon;
- Manager Unit = approval wajib pertama;
- pihak teknis/terkait = pemberi pertimbangan;
- Manager Keuangan/Wadir Keuangan = approval keuangan;
- TU/Umum = administratif/arsip;
- Superadmin = konfigurasi.

### Bagian yang Masih Lemah

Bagian yang paling membutuhkan validasi saat development adalah:

1. bentuk workflow Manager Keuangan dan Wakil Direktur Keuangan;
2. aturan kategori → pemberi pertimbangan;
3. kemungkinan workflow berdasarkan nominal pembelian;
4. database dan deployment produksi;
5. strategi backup dan recovery;
6. definisi SLA 1 hari kerja;
7. detail field form pengajuan.

### Kesimpulan Review

PRD sudah cukup untuk memulai pengembangan **Office Approval MVP**, khususnya desain database, autentikasi, pengajuan, dynamic workflow, approval, pertimbangan, audit trail, notifikasi, dan dashboard.

Prioritas engineering harus diberikan kepada requirement **P0** dan perlindungan terhadap kehilangan data sebelum rollout penuh.
