
# Functional Specification Document (FSD)
# Resource Management Inteleq

---

## COVER

| Item | Details |
| :--- | :--- |
| **Document Name** | Functional Specification Document - Resource Management Inteleq |
| **Version** | 1.0 |
| **Date** | 01 Februari 2026 |

## AUTHORS

| Name | Role | Department |
| :--- | :--- | :--- |
| [Admin Name] | Project Manager | IT |
| [Writer Name] | Technical Writer | IT |

## DOCUMENT HISTORY

| Date | Version | Document Revision Description | Document Author |
| :--- | :--- | :--- | :--- |
| 14 Jan 2026 | 0.1 | Initial Draft based on BRD | [Author Name] |
| 01 Feb 2026 | 1.0 | Detailed Functional Specification | [Author Name] |

## APPROVAL

| Approval Date | Approved Version | Approver Role | Approver |
| :--- | :--- | :--- | :--- |
| | 1.0 | Project Owner | |
| | 1.0 | Lead Developer | |

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Gambaran Umum Aplikasi](#2-gambaran-umum-aplikasi)
3. [Deskripsi Rinci Kebutuhan Aplikasi](#3-deskripsi-rinci-kebutuhan-aplikasi)
4. [Desain Interface (UI) Aplikasi](#4-desain-interface-ui-aplikasi)
5. [Keamanan Sistem (Security) Aplikasi](#5-keamanan-sistem-security-aplikasi)

---

## 1. Pendahuluan

### 1.1. Tujuan
Dokumen Functional Specification Document (FSD) ini bertujuan untuk menjabarkan spesifikasi fungsional dan teknis dari aplikasi **Resource Management Inteleq (RMI)**.

Secara spesifik, aplikasi ini dibangun untuk **divisi HR Inteleq** agar dapat **memonitor pengelolaan resource** secara lebih efektif dan efisien. Sistem ini dipersiapkan untuk menggantikan proses manual berbasis **Excel** yang selama ini digunakan, sehingga meminimalisir kesalahan data dan mempercepat proses pengambilan keputusan.

### 1.2. Lingkup Masalah
Lingkup pengembangan sistem ini mencakup transformasi digital dari pengelolaan resource yang sebelumnya **berbasis Excel (manual)** menjadi sistem web terintegrasi. Hal ini dilakukan untuk mengatasi kendala pemantauan (monitoring) yang sulit dilakukan saat menggunakan spreadsheet.

Ruang lingkup utama meliputi 5 pilar fungsionalitas:
1.  **Master Data**: Pengelolaan data Resource (Developer), Project, dan User (DevMan & Admin).
2.  **Workflow Request**: Pengajuan Assignment (Resource ke Project), Extend (Perpanjangan), dan Release (Pengembalian).
3.  **Validasi & Approval**: Mekanisme validasi oleh Admin terhadap request DevMan.
4.  **Monitoring & Tracking**: Dashboard untuk memantau status resource, ketersediaan, dan proyek berjalan.
5.  **Reporting & Notification**: Riwayat aktivitas (History Log) dan notifikasi status request.

### 1.3. Referensi
*   Business Requirements Document (BRD) Resource Management Inteleq Versi 3 (14 Jan 2026).
*   Functional Specification Document Template.
*   Technical Specification Document (TSD) Resource Management Inteleq *(dokumen terpisah untuk detail teknis implementasi)*.

### 1.4. Definisi, Akronim, dan Singkatan
| Istilah/Akronim | Definisi dan Penjelasan |
| :--- | :--- |
| **Admin** | Administrator (Tim HR). Pengguna dari divisi HR yang memiliki hak akses penuh untuk mengelola Master Data, memvalidasi request dari DevMan, dan memonitor ketersediaan resource. |
| **DevMan** | Developer Manager. Peran pengguna yang bertanggung jawab mengelola proyek dan mengajukan request resource. |
| **Resource** | Sumber daya manusia (developer) yang dikelola dalam sistem. |
| **RMI** | Resource Management Inteleq. Sistem aplikasi ini. |
| **Assignment** | Proses penugasan resource ke proyek dalam periode waktu tertentu. |
| **Extend** | Proses perpanjangan masa tugas resource pada project yang sama. |
| **Release** | Proses pengembalian resource dari proyek (Selesai tugas/Resign). |
| **ONGOING** | Status proyek yang sedang aktif berjalan. |
| **HOLD** | Status proyek yang ditahan sementara. |
| **CLOSED** | Status proyek yang sudah selesai. |
| **AVAILABLE** | Status resource yang tidak sedang ditugaskan ke project manapun. |
| **ASSIGNED** | Status resource yang sedang ditugaskan ke satu atau lebih project. |
| **PENDING** | Status request yang menunggu persetujuan Admin. |
| **APPROVED** | Status request yang telah disetujui. |
| **REJECTED** | Status request yang ditolak. |
| **UNAVAILABLE** | Status DevMan yang sedang memiliki project aktif (ONGOING). |

---

## 2. Gambaran Umum Aplikasi

### 2.1. Deskripsi Umum Aplikasi Resource Management
Aplikasi Resource Management Inteleq adalah sistem berbasis web yang dirancang untuk mengelola siklus hidup penugasan resource ke dalam proyek. Sistem ini memfasilitasi workflow antara DevMan (Pemohon) dan Admin (Validator).

#### 2.1.1. Konfigurasi Aplikasi Resource Management
Aplikasi ini dikelompokkan menjadi modul-modul berikut:
1.  **Modul Authentication**: Login dan manajemen sesi pengguna.
2.  **Modul Dashboard**: Visualisasi statistik resource, project, dan request.
3.  **Modul Master Data**: Manajemen data Resource, User (DevMan), dan Project.
4.  **Modul Workflow**: Proses Request (Assign/Extend/Release) dan Approval.
5.  **Modul Activities/History**: Pencatatan riwayat aktivitas penugasan.

#### 2.1.2. Arsitektur Aplikasi Resource Management
Aplikasi dibangun menggunakan arsitektur **Three-Tier**:
*   **Frontend (Presentation Layer)**: React.js (Vite) dengan Tailwind CSS untuk antarmuka pengguna yang responsif.
*   **Backend (Business Logic Layer)**: Java Spring Boot untuk menangani logika bisnis, REST API, dan keamanan.
*   **Database (Data Layer)**: MySQL untuk penyimpanan data relasional (User, Resource, Project, Request, Log).

> **Catatan:** Detail spesifikasi teknis seperti API Endpoint, ERD (Entity Relationship Diagram), Sequence Diagram, dan Class Diagram dijabarkan dalam dokumen **Technical Specification Document (TSD)**.

#### 2.1.3. Ringkasan Spesifikasi API

Berikut adalah ringkasan endpoint API utama yang digunakan dalam sistem:

| Modul | Endpoint | Method | Deskripsi |
| :--- | :--- | :--- | :--- |
| Auth | `/api/auth/login` | POST | Autentikasi pengguna |
| Resource | `/api/resources` | GET, POST | Lihat dan tambah resource |
| Resource | `/api/resources/{id}` | GET, PUT, DELETE | Detail, edit, hapus resource |
| User | `/api/users/pm` | POST | Tambah akun DevMan |
| User | `/api/users/{id}` | PUT, DELETE | Edit dan hapus user |
| Project | `/api/projects` | GET, POST | Lihat dan tambah project |
| Project | `/api/projects/{id}` | PUT, DELETE | Edit dan hapus project |
| Request | `/api/requests` | GET | Lihat daftar request |
| Request | `/api/requests/assign` | POST | Submit assignment request |
| Request | `/api/requests/{id}/approve` | POST | Approve request |
| Request | `/api/requests/{id}/reject` | POST | Reject request |

> **Detail lengkap:** Lihat TSD Section API Specification.

#### 2.1.4. Ringkasan Desain Database

Berikut adalah entitas utama dalam database:

| Entitas | Deskripsi | Relasi Utama |
| :--- | :--- | :--- |
| `users` | Data pengguna (Admin, DevMan) | - |
| `resources` | Data resource/developer | assignments |
| `projects` | Data project | users (devMan), assignments |
| `assignments` | Penugasan resource ke project | resources, projects |
| `assignment_requests` | Request dari DevMan | users, resources, projects |
| `history_logs` | Log aktivitas sistem | users, resources, projects |

> **Detail lengkap:** Lihat TSD Section Database Design (ERD).

### 2.2. Kebutuhan Bisnis Aplikasi Resource Management

#### 2.2.1. Eliminasi Proses Manual Excel
Menggantikan penggunaan **Microsoft Excel** yang rentan error dan sulit dipantau. Sistem ini menyediakan sentralisasi data sehingga HR dapat memonitor status resource (`AVAILABLE` atau `ASSIGNED`) secara *real-time* tanpa perlu merekap ulang data manual.

#### 2.2.2. Validasi dan Kontrol Terpusat
Memastikan setiap penugasan resource ke proyek melalui proses validasi oleh Admin untuk mencegah _double booking_ atau ketidaksesuaian skill.

#### 2.2.3. Transparansi Riwayat (Tracking)
Menyediakan rekam jejak (Audit Trail) yang jelas mengenai siapa yang menggunakan resource tertentu, kapan mulai, kapan selesai, dan perpanjangan kontrak.

#### 2.2.4. Monitoring Real-Time
Memberikan dashboard visual yang memudahkan HR dan DevMan dalam memonitor status resource dan project secara langsung tanpa harus membuka banyak file atau sheet.

### 2.3. Karakteristik Pengguna Aplikasi Resource Management
1.  **Administrator (Admin)**:
    *   Mengakses seluruh fitur sistem.
    *   Mengelola Master Data (Resource, DevMan, Project).
    *   Menyetujui atau menolak request (Assign, Extend, Release).
    *   Melihat dashboard statistik global.
2.  **Developer Manager (DevMan)**:
    *   Melihat daftar resource yang tersedia.
    *   Mengelola project miliknya sendiri.
    *   Membuat pengajuan (Request) untuk Assign, Extend, atau Release resource.
    *   Melihat dashboard terkait project yang dipegang.

### 2.4. Alur Proses Aplikasi Resource Management

#### 2.4.1. Alur Inisiasi Project

**A. Pembuatan Project oleh Admin (Langsung)**
1.  Admin login ke sistem.
2.  Admin masuk ke menu **Project** dan klik tombol **"Add Project"**.
3.  Admin mengisi form: Nama Project, Client, dan memilih DevMan yang akan bertanggung jawab.
4.  Project langsung tersimpan dengan status `ONGOING`.

**B. Pembuatan Project oleh DevMan (Melalui Request)**
1.  DevMan login ke sistem.
2.  DevMan masuk ke menu **Project** dan klik tombol **"Propose Project"**.
3.  DevMan mengisi form: Nama Project dan Client.
4.  Request tersimpan dengan status `PENDING` dan muncul di Dashboard Admin.
5.  Admin melakukan validasi:
    *   **Approve**: Project dibuat dengan status `ONGOING`, DevMan yang mengajukan otomatis menjadi penanggung jawab.
    *   **Reject**: Request ditolak, project tidak dibuat.

#### 2.4.2. Alur Assignment Resource

1.  **Request**: DevMan mencari resource dengan status `AVAILABLE` dan melakukan **"Assignment Request"** dengan menentukan Start Date dan End Date.
2.  **Approval**: Admin menerima notifikasi request di Dashboard.
    *   **Approve**: Status resource berubah menjadi `ASSIGNED`, assignment berstatus `ACTIVE`.
    *   **Reject**: Status request menjadi `REJECTED`, resource tetap `AVAILABLE`.

#### 2.4.3. Alur Extend dan Release

1.  **Extend Request**: Saat masa tugas hampir habis, DevMan dapat melakukan **"Extend Request"** untuk memperpanjang durasi assignment.
2.  **Release Request**: DevMan dapat melakukan **"Release Request"** untuk mengembalikan resource sebelum atau tepat pada saat kontrak habis.
3.  Admin memvalidasi request Extend/Release:
    *   **Approve Extend**: End Date assignment diperpanjang.
    *   **Approve Release**: Assignment berstatus `RELEASED`, jika resource tidak memiliki assignment aktif lainnya, status resource kembali `AVAILABLE`.

#### 2.4.4. Alur Penutupan Project

1.  **Hanya Admin** yang dapat mengubah status project melalui fitur **Edit Project**.
2.  Status project dapat diubah menjadi:
    *   `ONGOING` → Project aktif berjalan.
    *   `HOLD` → Project ditunda sementara.
    *   `CLOSED` → Project selesai (tidak dapat diubah kembali).
3.  Jika project `CLOSED`, semua assignment aktif di project tersebut akan berstatus `RELEASED`.
4.  Resource yang tidak memiliki assignment aktif lainnya kembali berstatus `AVAILABLE`.
5.  Project hanya dapat dihapus jika statusnya `CLOSED`.

### 2.5. Fitur Utama Aplikasi Resource Management

Aplikasi ini memiliki fitur-fitur utama yang mencakup:
*   **Authentication**: Login aman dengan validasi role.
*   **Dashboard**: Statistik Total Resource, Resource Available, Resource Assigned, dan Project Active.
*   **Resource Management**: List view, filter by skill/availability, detail profile resource.
*   **Project Management**: List project, detail project, anggota tim project.
*   **Request Management**: Form pengajuan dan tabel approval.

#### 2.5.1. Kebutuhan Fungsional

| No | Kode | Kebutuhan Fungsional | Deskripsi |
| :--- | :--- | :--- | :--- |
| 1 | KF-01 | Login | Sistem harus dapat mengautentikasi pengguna berdasarkan email dan password. |

| 2 | KF-02 | Logout | Sistem harus dapat menghapus sesi pengguna dan mengarahkan ke halaman Login. |

| 3 | KF-03 | Lihat Dashboard | Sistem harus menampilkan statistik resource, project, dan request sesuai role pengguna. |

| 4 | KF-04 | Tambah Resource | Admin dapat menambahkan resource baru ke sistem. |

| 5 | KF-05 | Edit Resource | Admin dapat mengubah data resource yang sudah ada. |

| 6 | KF-06 | Hapus Resource | Admin dapat menghapus data resource dari sistem. |

| 7 | KF-07 | Lihat Detail Resource | Admin dan DevMan dapat melihat detail resource beserta riwayat assignment. |

| 8 | KF-08 | Tambah DevMan | Admin dapat menambahkan akun DevMan baru. |

| 9 | KF-09 | Edit DevMan | Admin dapat mengubah data akun DevMan. |

| 10 | KF-10 | Hapus DevMan | Admin dapat menghapus akun DevMan dari sistem. |

| 11 | KF-11 | Tambah Project (Admin) | Admin dapat membuat project baru secara langsung dengan menentukan DevMan. |

| 12 | KF-12 | Propose Project (DevMan) | DevMan dapat mengajukan proposal project baru untuk divalidasi Admin. |

| 13 | KF-13 | Edit Project | Admin dapat mengubah data project (nama, client, status). |

| 14 | KF-14 | Hapus Project | Admin dapat menghapus project yang statusnya `CLOSED`. |

| 15 | KF-15 | Ubah Status Project | Admin dapat mengubah status project (ONGOING/HOLD/CLOSED). |

| 16 | KF-16 | Request Assignment | DevMan dapat mengajukan permintaan penugasan resource ke project. |

| 17 | KF-17 | Request Extend | DevMan dapat mengajukan perpanjangan durasi assignment. |

| 18 | KF-18 | Request Release | DevMan dapat mengajukan pengembalian resource dari project. |

| 19 | KF-19 | Approve Request | Admin dapat menyetujui request (Assign/Extend/Release/Project). |

| 20 | KF-20 | Reject Request | Admin dapat menolak request dengan memberikan alasan penolakan. |

| 21 | KF-21 | Lihat Riwayat Aktivitas | Pengguna dapat melihat log aktivitas penugasan resource. |

| 22 | KF-22 | Filter dan Pencarian | E |

| 23 | KF-23 | Export Data | Admin dapat mengekspor data resources dan history log ke format Excel. |

#### 2.5.2. Kebutuhan Non-Fungsional

| No | Kode | Kebutuhan Non-Fungsional | Deskripsi |
| :--- | :--- | :--- | :--- |
| 1 | KNF-01 | Keamanan (Security) | Password harus dienkripsi menggunakan BCrypt. Akses API harus divalidasi dengan token/session. |

| 2 | KNF-02 | Performa (Performance) | Halaman harus dimuat dalam waktu kurang dari 3 detik pada kondisi normal. |

| 3 | KNF-03 | Ketersediaan (Availability) | Sistem harus tersedia 24/7 dengan minimal downtime untuk maintenance. |

| 4 | KNF-04 | Usability | Antarmuka pengguna harus intuitif dan responsif di berbagai ukuran layar. |

| 5 | KNF-05 | Maintainability | Kode harus terstruktur dengan baik (clean code) untuk memudahkan pemeliharaan. |

| 6 | KNF-06 | Scalability | Arsitektur sistem harus mendukung penambahan fitur dan jumlah pengguna. |

| 7 | KNF-07 | Compatibility | Sistem harus kompatibel dengan browser modern (Chrome, Firefox, Edge, Safari). |

### 2.6. Metodologi Pengembangan Aplikasi Resource Management

Pengembangan aplikasi ini menggunakan metodologi **Waterfall** yang bersifat sekuensial dan terstruktur, terdiri dari 5 fase:

> **[INSERT WATERFALL DIAGRAM HERE]**
> 
> *Sisipkan diagram Waterfall yang menunjukkan alur sekuensial dari fase Requirements → Design → Implementation → Testing → Deployment & Maintenance.*

#### 2.6.1. Requirements (Analisis Kebutuhan)
Tahap pengumpulan dan dokumentasi kebutuhan sistem secara lengkap sebelum memulai pengembangan.

> **Output:** Business Requirements Document (BRD) dan Functional Specification Document (FSD).

#### 2.6.2. Design (Perancangan)
Tahap perancangan arsitektur sistem, desain database (ERD), dan desain antarmuka pengguna (UI/UX). Semua rancangan harus disetujui sebelum melanjutkan ke tahap implementasi.

> **Output:** Technical Specification Document (TSD), ERD *(dijelaskan pada TSD Section 3)*, dan Desain Interface *(dijelaskan pada FSD Section 4)*.

#### 2.6.3. Implementation (Pengembangan)
Tahap pengembangan aplikasi berdasarkan desain yang telah disetujui:
*   **Frontend Development**: React.js dengan Vite dan Tailwind CSS.
*   **Backend Development**: Java Spring Boot dengan REST API.
*   **Database Implementation**: MySQL dengan JPA/Hibernate.

#### 2.6.4. Testing (Pengujian)
Tahap pengujian aplikasi secara menyeluruh setelah implementasi selesai:
*   **Unit Testing**: Pengujian per komponen/fungsi.
*   **Integration Testing**: Pengujian integrasi antar modul.
*   **System Testing**: Pengujian sistem secara keseluruhan.
*   **User Acceptance Testing (UAT)**: Pengujian bersama pengguna akhir.

#### 2.6.5. Deployment & Maintenance (Penerapan dan Pemeliharaan)
Tahap penerapan aplikasi ke lingkungan produksi dan pemeliharaan pasca-deployment:
*   Deployment ke server produksi.
*   Bug fixing dan perbaikan berdasarkan feedback pengguna.
*   Monitoring performa dan keamanan sistem.

---

## 3. Deskripsi Rinci Kebutuhan Aplikasi

### 3.1. Deskripsi Use Case Kebutuhan Fungsional

#### 3.1.1. Definisi Aktor
*   **Admin**: Pengguna internal yang mengatur data master dan validasi.
*   **DevMan**: Pengguna level manajerial yang mengelola proyek teknis.

#### 3.1.2. Definisi Use Case

| No | Use Case | Deskripsi | Aktor |
| :--- | :--- | :--- | :--- |
| 1 | Login | Masuk ke sistem dengan email dan password | Admin, DevMan |

| 2 | Logout | Keluar dari sistem | Admin, DevMan |

| 3 | Lihat Dashboard | Melihat statistik resource, project, dan request | Admin, DevMan |

| 4 | Tambah Resource | Menambahkan resource baru ke sistem | Admin |

| 5 | Edit Resource | Mengubah data resource | Admin |

| 6 | Hapus Resource | Menghapus resource dari sistem | Admin |

| 7 | Lihat Detail Resource | Melihat detail dan riwayat assignment resource | Admin, DevMan |

| 8 | Tambah DevMan | Menambahkan akun DevMan baru | Admin |

| 9 | Edit DevMan | Mengubah data akun DevMan | Admin |

| 10 | Hapus DevMan | Menghapus akun DevMan | Admin |

| 11 | Tambah Project | Membuat project baru secara langsung | Admin |

| 12 | Propose Project | Mengajukan proposal project untuk divalidasi | DevMan |

| 13 | Edit Project | Mengubah data project | Admin |

| 14 | Hapus Project | Menghapus project (hanya status CLOSED) | Admin |

| 15 | Ubah Status Project | Mengubah status project (ONGOING/HOLD/CLOSED) | Admin |

| 16 | Request Assignment | Mengajukan penugasan resource ke project | DevMan |

| 17 | Request Extend | Mengajukan perpanjangan durasi assignment | DevMan |

| 18 | Request Release | Mengajukan pengembalian resource dari project | DevMan |

| 19 | Approve Request | Menyetujui request | Admin |

| 20 | Reject Request | Menolak request dengan alasan | Admin |

| 21 | Lihat Riwayat Aktivitas | Melihat log aktivitas penugasan | Admin, DevMan |

| 22 | Filter dan Pencarian | Mencari dan memfilter data | Admin, DevMan |

| 23 | Export Data | Mengekspor data resources dan history log ke Excel | Admin |

#### 3.1.3. Diagram Use Case

> **[INSERT USE CASE DIAGRAM HERE]**
> 
> *Sisipkan diagram use case yang menggambarkan hubungan antara aktor (Admin, DevMan) dengan use case sistem.*

### 3.2. Desain Kebutuhan Fungsional

#### 3.2.1. Use Case Modul Authentication

> **[INSERT USE CASE DIAGRAM - MODUL AUTHENTICATION]**
> 
> *Sisipkan diagram use case untuk modul Authentication yang menggambarkan alur Login dan Logout.*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-01 | Login | Admin, DevMan | User memasukkan email dan password. Sistem memvalidasi kredensial dan mengarahkan ke Dashboard sesuai Role. |
| UC-02 | Logout | Admin, DevMan | User keluar dari sistem. Session dihapus dan diarahkan ke halaman Login. |

---

#### 3.2.2. Use Case Modul Master Data (Resource)

> **[INSERT USE CASE DIAGRAM - MODUL MASTER DATA RESOURCE]**
> 
> *Sisipkan diagram use case untuk pengelolaan Resource.*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-03 | Lihat Dashboard | Admin, DevMan | Melihat statistik resource, project, dan pending request. |
| UC-04 | Tambah Resource | Admin | Admin menambahkan resource baru dengan data (Nama, Employee ID, Email). |
| UC-05 | Edit Resource | Admin | Admin mengubah data resource yang sudah ada. |
| UC-06 | Hapus Resource | Admin | Admin menghapus resource dari sistem. |
| UC-07 | Lihat Detail Resource | Admin, DevMan | Melihat detail resource beserta riwayat assignment. |

---

#### 3.2.3. Use Case Modul Master Data (User/DevMan)

> **[INSERT USE CASE DIAGRAM - MODUL MASTER DATA DEVMAN]**
> 
> *Sisipkan diagram use case untuk pengelolaan akun DevMan.*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-08 | Tambah DevMan | Admin | Admin membuat akun DevMan baru dengan data (Nama, Email, Password). |
| UC-09 | Edit DevMan | Admin | Admin mengubah data akun DevMan. |
| UC-10 | Hapus DevMan | Admin | Admin menghapus akun DevMan dari sistem. |

---

#### 3.2.4. Use Case Modul Master Data (Project)

> **[INSERT USE CASE DIAGRAM - MODUL MASTER DATA PROJECT]**
> 
> *Sisipkan diagram use case untuk pengelolaan Project.*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-11 | Tambah Project | Admin | Admin membuat project baru secara langsung dengan menentukan DevMan. |
| UC-12 | Propose Project | DevMan | DevMan mengajukan proposal project baru untuk divalidasi Admin. |
| UC-13 | Edit Project | Admin | Admin mengubah data project (nama, client, status). |
| UC-14 | Hapus Project | Admin | Admin menghapus project (hanya jika status `CLOSED`). |
| UC-15 | Ubah Status Project | Admin | Admin mengubah status project (`ONGOING`/`HOLD`/`CLOSED`). |

---

#### 3.2.5. Use Case Modul Workflow (Request System)

> **[INSERT USE CASE DIAGRAM - MODUL WORKFLOW]**
> 
> *Sisipkan diagram use case untuk sistem Request (Assign, Extend, Release, Approval).*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-16 | Request Assignment | DevMan | DevMan memilih resource `AVAILABLE`, memilih Project, menentukan durasi, dan mengirim request. Status awal `PENDING`. |
| UC-17 | Request Extend | DevMan | DevMan mengajukan perpanjangan durasi assignment untuk resource yang sudah ada di projectnya. |
| UC-18 | Request Release | DevMan | DevMan mengembalikan resource sebelum atau saat kontrak habis. |
| UC-19 | Approve Request | Admin | Admin menyetujui request (Assign/Extend/Release/Project). Data diupdate sesuai request. |
| UC-20 | Reject Request | Admin | Admin menolak request dengan memberikan alasan penolakan. |

---

#### 3.2.6. Use Case Modul Reporting (Activities)

> **[INSERT USE CASE DIAGRAM - MODUL REPORTING]** *(Opsional)*
> 
> *Sisipkan diagram use case untuk modul Reporting jika diperlukan.*

| UC Code | Use Case | Aktor | Deskripsi |
| :--- | :--- | :--- | :--- |
| UC-21 | Lihat Riwayat Aktivitas | Admin, DevMan | Melihat log aktivitas penugasan resource (siapa, kapan, aksi apa). |
| UC-22 | Filter dan Pencarian | Admin, DevMan | Mencari dan memfilter data pada halaman Resource dan Project. |
| UC-23 | Export Data | Admin | Mengekspor data resources dan history log ke format Excel. |

---

## 4. Desain Interface (UI) Aplikasi

### 4.1. Login
Halaman awal untuk autentikasi. Terdapat input field untuk **Email** dan **Password**, serta tombol **Sign In**.

> **Gambar 4.1** Halaman Login

---

### 4.2. Admin Dashboard
Pusat informasi bagi Admin.
*   **Stat Cards**: Menampilkan jumlah Total Resources, Available Resources, Active Projects, dan Pending Requests.
*   **Pending Request**: Daftar request yang butuh persetujuan segera.
*   **Assignments Ending Soon**: Menampilkan daftar assignment yang akan berakhir dalam waktu dekat beserta countdown hari.
*   **Active Projects**: Menampilkan daftar project yang sedang berjalan (status ONGOING) beserta jumlah member.

> **Gambar 4.2** Admin Dashboard - Tampilan Utama

**Sub-screenshots (Request Details):**
Bagian ini menampilkan detail dari setiap request yang masuk ke Admin.
*   **Detail Project**: Menampilkan proposal project baru, deskripsi, dan resource plan.
*   **Detail Assign**: Menampilkan permintaan resource baru untuk project.
*   **Detail Extend**: Menampilkan permintaan perpanjangan kontrak resource.
*   **Detail Release**: Menampilkan permintaan pelepasan resource dari project.

> **Gambar 4.2.1** Admin Dashboard - Modal Detail Request Project
> **Gambar 4.2.2** Admin Dashboard - Modal Detail Request Assign Resource
> **Gambar 4.2.3** Admin Dashboard - Modal Detail Request Extend Resource
> **Gambar 4.2.4** Admin Dashboard - Modal Detail Request Release Resource

**Sub-screenshots (Reject Views - Side-by-Side Layout):**
Menampilkan form penolakan (Reject) yang muncul di samping detail visual.
*   **Side-by-Side Layout**: Form reject muncul di sebelah kanan detail request tanpa menutup informasi utama.
*   **Reason Input**: Text area wajib diisi oleh Admin untuk memberikan alasan penolakan.

> **Gambar 4.2.5** Admin Dashboard - Side-by-Side Reject View (Project)
> **Gambar 4.2.6** Admin Dashboard - Side-by-Side Reject View (Assign)
> **Gambar 4.2.7** Admin Dashboard - Side-by-Side Reject View (Extend)
> **Gambar 4.2.8** Admin Dashboard - Side-by-Side Reject View (Release)

**Notification Toasts:**
Menampilkan contoh notifikasi sistem (Toast) untuk memberikan feedback kepada pengguna.
*   **Success Approve**: Notifikasi hijau yang muncul saat request berhasil disetujui.
*   **Success Reject**: Notifikasi hijau/merah yang muncul saat request berhasil ditolak.

> **Gambar 4.2.9** Notification - Success Approve Request (Example)
> **Gambar 4.2.10** Notification - Success Reject Request (Example)

---

### 4.3. Admin Devman
Halaman pengelolaan akun Developer Manager.
*   **Search & Filter**: Pencarian DevMan berdasarkan nama dan filter berdasarkan status (All/Available/Unavailable).
*   **Tabel DevMan**: Menampilkan daftar DevMan dengan kolom Name, Email, Status (Available/Unavailable), dan Action.
*   **Action**: View Detail (melihat project DevMan), Delete (hapus akun), Edit (ubah data).
*   **Create DevMan**: Tombol "+ Create DevMan" untuk mendaftarkan user DevMan baru.

> **Gambar 4.3** Admin DevMan - Tampilan Utama

**Sub-screenshots (Manajemen Data DevMan):**
Bagian ini menampilkan fitur pengelolaan data Developer Manager (DevMan).
*   **Add DevMan**: Form untuk mendaftarkan DevMan baru (Nama, Email, Password).
*   **Edit DevMan**: Form untuk mengubah data profil DevMan.
*   **View Detail (Unavailable)**: Menampilkan profil DevMan yang sedang menangani project aktif.
*   **View Detail (Available)**: Menampilkan profil DevMan yang tidak menangani project (Available).
*   **Delete Confirmation (Available)**: Modal konfirmasi saat menghapus DevMan yang tidak memiliki project.
*   **Delete Violation (Unavailable)**: Modal peringatan (Restriction) saat mencoba menghapus DevMan yang memiliki project aktif.

> **Gambar 4.3.1** Admin DevMan - Modal Add DevMan
> **Gambar 4.3.2** Admin DevMan - Modal Edit DevMan
> **Gambar 4.3.3** Admin DevMan - Modal View Detail (Unavailable Case)
> **Gambar 4.3.4** Admin DevMan - Modal View Detail (Available Case)
> **Gambar 4.3.5** Admin DevMan - Modal Delete Confirmation (Available Case)
> **Gambar 4.3.6** Admin DevMan - Modal Delete Violation (Unavailable Case)

**Notification Toasts (Feedback System):**
Menampilkan feedback sistem terhadap aksi yang dilakukan (Delete & Update).
*   **Success Delete (Available)**: Notifikasi toast hijau yang muncul saat DevMan berhasil dihapus (karena status Available).
*   **Success Update**: Notifikasi toast hijau yang muncul saat data DevMan berhasil diubah (Edit).

> **Gambar 4.3.7** Notification - Success Delete (Available Case)

---

### 4.4. Admin Resources
Halaman utama database resource.
*   **Filter & Search**: Pencarian berdasarkan nama. Filter berdasarkan Status, Tanggal (dd/mm/yyyy), dan Role (All Roles).
*   **Export**: Tombol untuk mengekspor data resource (CSV/Excel).
*   **Resource Table**: Menampilkan Nama, Status, View Detail, dan Track Record.
*   **Action**: Tombol Assign to Project, Edit, dan Delete resource.

**Behaviors (Status Based):**
*   **View Detail (Assigned)**: Menampilkan card berisi detail project yang sedang dikerjakan resource.
*   **View Detail (Available)**: Menampilkan toast notification informasi bahwa resource sedang tidak menangani project.
*   **Track Record (Assigned)**: Menampilkan riwayat project yang pernah/sedang dikerjakan (Ada isi).
*   **Track Record (Available)**: Menampilkan halaman kosong (Empty State) jika belum ada riwayat atau sedang available (sesuai kondisi).
*   **Delete (Available)**: Menampilkan modal konfirmasi penghapusan standard.
*   **Delete (Assigned)**: Menampilkan modal restriksi (Restriction) karena resource sedang aktif dalam project.
*   **Assign (Available)**: Menampilkan modal form untuk assign resource ke project.
*   **Assign (Assigned)**: Menampilkan modal restriksi (Restriction) karena resource sudah assigned.

> **Gambar 4.4** Admin Resources - Tampilan Utama


> **Gambar 4.4.1** Admin Resources - Modal Add Resource
> **Gambar 4.4.2** Admin Resources - Modal Edit Resource
> **Gambar 4.4.3** Admin Resources - View Detail (Assigned Case - Project Card)
> **Gambar 4.4.4** Admin Resources - View Detail (Available Case - Toast)
> **Gambar 4.4.5** Admin Resources - View Track Record (Assigned Case - With Data)
> **Gambar 4.4.6** Admin Resources - View Track Record (Available Case - Empty)
> **Gambar 4.4.7** Admin Resources - Assign to Project (Available Case)
> **Gambar 4.4.8** Admin Resources - Assign to Project (Assigned Case - Restriction)
> **Gambar 4.4.9** Admin Resources - Delete Resource (Available Case - Confirmation)
> **Gambar 4.4.10** Admin Resources - Delete Resource (Assigned Case - Restriction)

**Notification Toasts (Feedback System):**
Menampilkan feedback sistem terhadap aksi yang dilakukan.
*   **Success Update**: Notifikasi toast hijau saat data resource berhasil diperbarui.
*   **Success Assign**: Notifikasi toast hijau saat resource berhasil di-assign ke project.
*   **Success Delete**: Notifikasi toast hijau saat resource berhasil dihapus.
*   **Success Export**: Notifikasi toast hijau saat data resource berhasil diexport.

> **Gambar 4.4.11** Notification - Success Update (Example)
> **Gambar 4.4.12** Notification - Success Assign (Example)
> **Gambar 4.4.13** Notification - Success Delete (Example)
> **Gambar 4.4.20** Notification - Success Export (Example)

**Sub-screenshots (Filter & Export Tools):**
Detail tampilan fitur filter, pencarian, dan export data.
> **Gambar 4.4.14** Admin Resources - Filter Status Selection

> **Gambar 4.4.15** Admin Resources - Filter Role Selection

> **Gambar 4.4.16** Admin Resources - Date Filter (Period Selection)

> **Gambar 4.4.17** Admin Resources - Export Data Action

> **Gambar 4.4.18** Admin Resources - Example Exported File (Excel/CSV)

> **Gambar 4.4.19** Admin Resources - Search Functionality

---

### 4.5. Admin Activities
Halaman Log Audit.
*   Menampilkan tabel riwayat: Tanggal, Aktor (Siapa), Aksi (Assign/Extend), Target (Resource), dan Keterangan.

> **Gambar 4.5** Admin Activities - Tab All

**Sub-screenshots:**
> **Gambar 4.5.1** Admin Activities - Tab Assign
> **Gambar 4.5.2** Admin Activities - Tab Extend
> **Gambar 4.5.3** Admin Activities - Tab Release

---

### 4.6. Devman Dashboard
Halaman utama bagi DevMan.
*   **My Projects Summary**: Ringkasan project yang sedang ditangani.
*   **Resources Overview**: Grafik/Angka jumlah resource yang ada di dalam timnya.

> **Gambar 4.6** DevMan Dashboard - Tampilan Utama

**Sub-screenshots:**
> **Gambar 4.6.1** DevMan Dashboard - Modal Approve/Reject *(jika ada)*

---

### 4.7. Devman Resources
Halaman untuk mencari dan me-request resource.
*   **Marketplace View**: Daftar seluruh resource yang ada di perusahaan.
*   **Request Button**: Tombol "Assign" pada resource yang statusnya Available.
*   **My Team View**: Daftar resource yang saat ini sedang bekerja di project DevMan tersebut. Tombol "Extend" dan "Release" tersedia di sini.

> **Gambar 4.7** DevMan Resources - Tampilan Utama

**Sub-screenshots:**
> **Gambar 4.7.1** DevMan Resources - Modal Request Assign
> **Gambar 4.7.2** DevMan Resources - Modal Request Extend
> **Gambar 4.7.3** DevMan Resources - Modal Request Release
> **Gambar 4.7.4** DevMan Resources - Detail Resource/Track Record

---

### 4.8. Devman Activities
Sama seperti Admin Activities, namun difilter khusus untuk aktivitas yang berkaitan dengan DevMan tersebut atau project-nya.

> **Gambar 4.8** DevMan Activities - Tab All

**Sub-screenshots:**
> **Gambar 4.8.1** DevMan Activities - Tab Assign
> **Gambar 4.8.2** DevMan Activities - Tab Extend
> **Gambar 4.8.3** DevMan Activities - Tab Release

---

### 4.9. Admin Project
Halaman manajemen Project untuk Admin.
*   **Project List**: Daftar semua project dengan status.
*   **Project Info**: Nama, Klien, DevMan, Status.
*   **Members**: Daftar resource yang tergabung dalam project ini.

> **Gambar 4.9** Admin Project - Tampilan Utama

**Sub-screenshots:**
> **Gambar 4.9.1** Admin Project - Modal Add Project
> **Gambar 4.9.2** Admin Project - Modal Edit Project
> **Gambar 4.9.3** Admin Project - Modal Delete Confirmation
> **Gambar 4.9.4** Admin Project - Detail Project dengan Members

---

### 4.10. Devman Project
Halaman manajemen Project untuk DevMan.
*   **My Projects**: Daftar project yang ditangani DevMan.
*   **Propose Project**: Form untuk mengajukan proposal project baru.

> **Gambar 4.10** DevMan Project - Tampilan Utama

**Sub-screenshots:**
> **Gambar 4.10.1** DevMan Project - Modal Propose Project
> **Gambar 4.10.2** DevMan Project - Detail Project dengan Members

---

## 5. Keamanan Sistem (Security) Aplikasi

### 5.1. Authentication
*   Menggunakan mekanisme **JWT (JSON Web Token)** dengan **Spring Security**.
*   Session management menggunakan `SessionCreationPolicy.STATELESS` (tidak menyimpan session di server).
*   Password disimpan dalam format terenkripsi menggunakan **BCryptPasswordEncoder**.

### 5.2. Authorization (Role-Based Access Control)
*   API Endpoint dilindungi berdasarkan Role menggunakan `hasRole()`:
    *   Endpoint `/api/users/**` hanya dapat diakses oleh role **Admin**.
    *   Endpoint `/api/auth/**` dapat diakses tanpa autentikasi (public).
    *   Endpoint lainnya memerlukan autentikasi (`authenticated()`).
*   Halaman Admin tidak dapat diakses oleh DevMan, dan sebaliknya (validasi di Frontend routing).

### 5.3. Data Security
*   Konfigurasi database disimpan di `application.properties`:
    *   URL database, username, dan password dikonfigurasi di file properties.
    *   Untuk lingkungan production, disarankan menggunakan **Environment Variables** untuk kredensial sensitif.
*   CORS dikonfigurasi untuk mengizinkan request dari frontend.

