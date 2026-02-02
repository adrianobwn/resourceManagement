# Technical Specification Document (TSD)
# Resource Management Inteleq

---

## COVER

| Item | Details |
| :--- | :--- |
| **Document Name** | Technical Specification Document - Resource Management Inteleq |
| **Version** | 1.0 |
| **Date** | 01 Februari 2026 |

## AUTHORS

| Name | Role | Department |
| :--- | :--- | :--- |
| [Developer Name] | Lead Developer | IT |
| [Writer Name] | Technical Writer | IT |

## DOCUMENT HISTORY

| Date | Version | Document Revision Description | Document Author |
| :--- | :--- | :--- | :--- |
| 01 Feb 2026 | 1.0 | Initial Technical Specification | [Author Name] |

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Spesifikasi Database](#3-spesifikasi-database)
4. [Spesifikasi API](#4-spesifikasi-api)
5. [Spesifikasi Keamanan](#5-spesifikasi-keamanan)

---

## 1. Pendahuluan

### 1.1. Tujuan
Dokumen Technical Specification Document (TSD) ini bertujuan untuk menjabarkan spesifikasi teknis implementasi aplikasi **Resource Management Inteleq (RMI)**.

### 1.2. Lingkup
Dokumen ini mencakup:
*   Arsitektur sistem dan teknologi yang digunakan
*   Desain database (ERD dan struktur tabel)
*   Spesifikasi API endpoint
*   Spesifikasi keamanan sistem

### 1.3. Referensi
*   Functional Specification Document (FSD) Resource Management Inteleq
*   Business Requirements Document (BRD) Resource Management Inteleq

---

## 2. Arsitektur Sistem

### 2.1. Diagram Arsitektur

> **[INSERT ARCHITECTURE DIAGRAM HERE]**
> 
> *Sisipkan diagram arsitektur three-tier yang menunjukkan hubungan antara Frontend, Backend, dan Database.*

### 2.2. Technology Stack

| Layer | Teknologi | Versi | Deskripsi |
| :--- | :--- | :--- | :--- |
| Frontend | React.js | 18.x | Library JavaScript untuk UI |
| Frontend | Vite | 5.x | Build tool dan dev server |
| Frontend | Tailwind CSS | 3.x | CSS framework |
| Backend | Java | 17 | Bahasa pemrograman |
| Backend | Spring Boot | 3.x | Framework backend |
| Backend | Spring Security | 6.x | Framework keamanan |
| Database | MySQL | 8.x | Relational database |
| ORM | Hibernate/JPA | 6.x | Object-relational mapping |

### 2.3. Struktur Project

```
resourceManagement/
├── backend/
│   └── src/main/java/com/resourceManagement/
│       ├── controller/     # REST API Controllers
│       ├── service/        # Business Logic
│       ├── repository/     # Data Access Layer
│       ├── model/
│       │   ├── entity/     # JPA Entities
│       │   └── enums/      # Enum Types
│       ├── dto/            # Data Transfer Objects
│       └── config/         # Configuration Classes
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI Components
│       ├── pages/          # Page Components
│       └── utils/          # Utility Functions
```

---

## 3. Spesifikasi Database

### 3.1. Entity Relationship Diagram (ERD)

> **[INSERT ERD DIAGRAM HERE]**
> 
> *Sisipkan diagram ERD yang menunjukkan hubungan antar tabel.*

### 3.2. Struktur Tabel

#### 3.2.1. Tabel `users`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| user_id | INT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NOT NULL | Nama pengguna |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email (untuk login) |
| password | VARCHAR(255) | NOT NULL | Password (BCrypt) |
| user_type | ENUM | NOT NULL | 'Admin', 'DEV_MANAGER' |
| account_status | ENUM | NOT NULL | 'ACTIVE' |

#### 3.2.2. Tabel `resources`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| resource_id | INT | PK, AUTO_INCREMENT | Primary key |
| resource_name | VARCHAR(255) | NOT NULL | Nama resource |
| employee_id | VARCHAR(50) | NULLABLE | ID karyawan |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email resource |
| status | ENUM | NOT NULL | 'AVAILABLE', 'ASSIGNED' |

#### 3.2.3. Tabel `projects`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| project_id | INT | PK, AUTO_INCREMENT | Primary key |
| project_name | VARCHAR(255) | NOT NULL | Nama project |
| client_name | VARCHAR(255) | NOT NULL | Nama client |
| dev_man_id | INT | FK → users | DevMan penanggung jawab |
| status | ENUM | NOT NULL | 'ONGOING', 'HOLD', 'CLOSED' |

#### 3.2.4. Tabel `resource_assignments`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| assignment_id | INT | PK, AUTO_INCREMENT | Primary key |
| resource_id | INT | FK → resources | Resource yang di-assign |
| project_id | INT | FK → projects | Project tujuan |
| project_role | VARCHAR(255) | NOT NULL | Role di project |
| start_date | DATE | NOT NULL | Tanggal mulai |
| end_date | DATE | NOT NULL | Tanggal selesai |
| status | ENUM | NOT NULL | 'ACTIVE', 'RELEASED', 'EXPIRED' |

#### 3.2.5. Tabel `assignment_requests`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| request_id | INT | PK, AUTO_INCREMENT | Primary key |
| request_type | ENUM | NOT NULL | 'ASSIGN', 'EXTEND', 'RELEASE', 'PROJECT' |
| status | ENUM | NOT NULL | 'PENDING', 'APPROVED', 'REJECTED' |
| requester_id | INT | FK → users | User yang mengajukan |
| project_id | INT | FK → projects, NULLABLE | Project terkait |
| resource_id | INT | FK → resources, NULLABLE | Resource terkait |
| project_name | VARCHAR(255) | NULLABLE | Nama project (untuk proposal) |
| client_name | VARCHAR(255) | NULLABLE | Nama client (untuk proposal) |
| role | VARCHAR(255) | NULLABLE | Role assignment |
| start_date | DATE | NULLABLE | Tanggal mulai |
| end_date | DATE | NULLABLE | Tanggal selesai |
| new_end_date | DATE | NULLABLE | Tanggal baru (extend) |
| reason | TEXT | NULLABLE | Alasan request |
| rejection_reason | TEXT | NULLABLE | Alasan penolakan |
| created_at | DATETIME | NOT NULL | Waktu pembuatan |

#### 3.2.6. Tabel `history_logs`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| log_id | INT | PK, AUTO_INCREMENT | Primary key |
| entity_type | ENUM | NOT NULL | Tipe entitas |
| activity_type | VARCHAR(255) | NOT NULL | Jenis aktivitas |
| description | VARCHAR(1000) | NOT NULL | Deskripsi aktivitas |
| performed_by | INT | FK → users | User yang melakukan |
| project_id | INT | FK → projects, NULLABLE | Project terkait |
| resource_id | INT | FK → resources, NULLABLE | Resource terkait |
| resource_role | VARCHAR(255) | NULLABLE | Role resource |
| timestamp | DATETIME | NOT NULL | Waktu aktivitas |

### 3.3. Enum Types

| Enum | Values | Deskripsi |
| :--- | :--- | :--- |
| UserType | `Admin`, `DEV_MANAGER` | Tipe pengguna |
| AccountStatus | `ACTIVE` | Status akun |
| ResourceStatus | `AVAILABLE`, `ASSIGNED` | Status resource |
| ProjectStatus | `ONGOING`, `HOLD`, `CLOSED` | Status project |
| AssignmentStatus | `ACTIVE`, `RELEASED`, `EXPIRED` | Status assignment |
| RequestType | `ASSIGN`, `EXTEND`, `RELEASE`, `PROJECT` | Tipe request |
| RequestStatus | `PENDING`, `APPROVED`, `REJECTED` | Status request |

---

## 4. Spesifikasi API

### 4.1. Base URL
```
http://localhost:8080/api
```

### 4.2. Authentication API

#### POST `/auth/login`
Autentikasi pengguna.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "string",
  "user": {
    "userId": "integer",
    "name": "string",
    "email": "string",
    "userType": "string"
  }
}
```

### 4.3. Resource API

#### GET `/resources`
Mendapatkan daftar semua resource.

**Response (200 OK):**
```json
[
  {
    "resourceId": "integer",
    "resourceName": "string",
    "employeeId": "string",
    "email": "string",
    "status": "AVAILABLE|ASSIGNED"
  }
]
```

#### POST `/resources`
Menambah resource baru.

**Request Body:**
```json
{
  "resourceName": "string",
  "employeeId": "string",
  "email": "string"
}
```

#### PUT `/resources/{resourceId}`
Mengupdate data resource.

#### DELETE `/resources/{resourceId}`
Menghapus resource.

### 4.4. User API

#### POST `/users/pm`
Membuat akun DevMan baru.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

#### PUT `/users/{userId}`
Mengupdate data user.

#### DELETE `/users/{userId}`
Menghapus user.

### 4.5. Project API

#### GET `/projects`
Mendapatkan daftar semua project.

**Response (200 OK):**
```json
[
  {
    "projectId": "integer",
    "projectName": "string",
    "clientName": "string",
    "devManId": "integer",
    "devManName": "string",
    "status": "ONGOING|HOLD|CLOSED",
    "memberCount": "integer"
  }
]
```

#### POST `/projects`
Membuat project baru.

**Request Body:**
```json
{
  "projectName": "string",
  "clientName": "string",
  "devManId": "integer"
}
```

#### PUT `/projects/{projectId}`
Mengupdate data project.

#### DELETE `/projects/{projectId}`
Menghapus project (hanya status CLOSED).

### 4.6. Request API

#### GET `/requests`
Mendapatkan daftar request pending.

#### POST `/requests/assign`
Submit assignment request.

**Request Body:**
```json
{
  "resourceId": "integer",
  "projectId": "integer",
  "role": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}
```

#### POST `/requests/project`
Submit project proposal.

**Request Body:**
```json
{
  "projectName": "string",
  "clientName": "string",
  "description": "string"
}
```

#### POST `/requests/{id}/approve`
Menyetujui request.

#### POST `/requests/{id}/reject`
Menolak request.

**Request Body:**
```json
{
  "reason": "string"
}
```

---

## 5. Spesifikasi Keamanan

### 5.1. Authentication
*   Menggunakan **Spring Security** dengan session-based authentication
*   Password di-hash menggunakan **BCrypt**
*   Session disimpan di server-side

### 5.2. Authorization (Role-Based Access Control)

| Endpoint | Admin | DevMan |
| :--- | :--- | :--- |
| `/resources` (CRUD) | ✅ | ❌ (Read Only) |
| `/users/pm` (Create) | ✅ | ❌ |
| `/users/{id}` (Update/Delete) | ✅ | ❌ |
| `/projects` (Create Direct) | ✅ | ❌ |
| `/projects` (Propose) | ❌ | ✅ |
| `/projects/{id}` (Edit Status) | ✅ | ❌ |
| `/requests/assign` | ❌ | ✅ |
| `/requests/{id}/approve` | ✅ | ❌ |
| `/requests/{id}/reject` | ✅ | ❌ |

### 5.3. Data Protection
*   Koneksi database menggunakan kredensial yang aman
*   Password tidak pernah dikirim dalam format plain text
*   API endpoint dilindungi dengan validasi session

---

*Dokumen ini merupakan bagian dari dokumentasi teknis Resource Management Inteleq.*
