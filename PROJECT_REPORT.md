# Wakala EMS - Technical Project Report
# نظام وكالة EMS - التقرير التقني الشامل

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Author:** Manus AI

---

## 1. PROJECT OVERVIEW | نظرة عامة على المشروع

### Application Name | اسم التطبيق
**Wakala EMS** (نظام وكالة EMS) - Real Estate Compensation Management System (نظام إدارة التعويضات العقارية)

### Purpose | الغرض
This system is designed to manage real estate compensation cases in Saudi Arabia. It provides a comprehensive solution for tracking client files, managing agents (وكلاء), handling property documentation, and monitoring the progress of compensation claims through various stages.

هذا النظام مصمم لإدارة ملفات التعويضات العقارية في المملكة العربية السعودية. يوفر حلاً شاملاً لتتبع ملفات العملاء، وإدارة الوكلاء، والتعامل مع وثائق العقارات، ومراقبة تقدم مطالبات التعويض عبر مراحل مختلفة.

### Main Features | الميزات الرئيسية

| Feature | Description (Arabic) |
|---------|---------------------|
| Client Management | إدارة العملاء - إضافة وتعديل وحذف بيانات العملاء |
| Agent Management | إدارة الوكلاء - تسجيل الوكلاء المعتمدين مع بياناتهم |
| File Status Tracking | تتبع حالة الملفات - 11 حالة مختلفة من جديد إلى مكتمل |
| Document Upload | رفع المستندات - تخزين الوثائق على S3 |
| WhatsApp Integration | تكامل واتساب - قوالب رسائل جاهزة للتواصل |
| Interactive Map | خريطة تفاعلية - عرض مواقع العقارات على Google Maps |
| Dual Calendar | التقويم المزدوج - دعم الهجري والميلادي |
| Dashboard & Statistics | لوحة التحكم والإحصائيات |
| Dynamic Property Forms | نماذج عقارية ديناميكية حسب نوع المستند |

---

## 2. TECHNOLOGY STACK | التقنيات المستخدمة

### Frontend | الواجهة الأمامية

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Tailwind CSS | 4.1.14 | Styling |
| Vite | 7.1.7 | Build Tool |
| Wouter | 3.3.5 | Routing |
| TanStack Query | 5.90.2 | Server State Management |
| tRPC Client | 11.6.0 | Type-safe API Calls |
| Radix UI | Various | Accessible UI Components |
| Lucide React | 0.453.0 | Icons |
| Recharts | 2.15.2 | Charts & Visualizations |
| Framer Motion | 12.23.22 | Animations |

### Backend | الخادم

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x | Runtime Environment |
| Express | 4.21.2 | Web Framework |
| tRPC Server | 11.6.0 | Type-safe API Layer |
| Drizzle ORM | 0.44.5 | Database ORM |
| Zod | 4.1.12 | Schema Validation |
| Jose | 6.1.0 | JWT Authentication |

### Database | قاعدة البيانات

| Technology | Version | Purpose |
|------------|---------|---------|
| MySQL/TiDB | 8.x | Primary Database |
| Drizzle Kit | 0.31.4 | Migration Tool |

### Storage & External Services | التخزين والخدمات الخارجية

| Service | Purpose |
|---------|---------|
| AWS S3 | Document Storage |
| Google Maps API | Interactive Maps |
| Manus OAuth | Authentication |

---

## 3. PROJECT STRUCTURE | هيكل المشروع

```
wakala-ems-new/
├── client/                    # Frontend Application (تطبيق الواجهة)
│   ├── public/               # Static Assets (الملفات الثابتة)
│   ├── src/
│   │   ├── _core/           # Core Utilities
│   │   │   └── hooks/       # Core Hooks
│   │   ├── components/      # Reusable Components (المكونات)
│   │   │   └── ui/          # shadcn/ui Components
│   │   ├── contexts/        # React Contexts
│   │   ├── hooks/           # Custom Hooks
│   │   ├── lib/             # Utilities (trpc client, utils)
│   │   ├── pages/           # Page Components (الصفحات)
│   │   ├── App.tsx          # Main App & Routes
│   │   ├── main.tsx         # Entry Point
│   │   └── index.css        # Global Styles
│   └── index.html           # HTML Template
│
├── server/                    # Backend Application (الخادم)
│   ├── _core/               # Framework Core (OAuth, tRPC setup)
│   │   └── types/           # Type Definitions
│   ├── db.ts                # Database Queries
│   ├── routers.ts           # tRPC Routers (API Endpoints)
│   ├── storage.ts           # S3 Storage Helpers
│   └── *.test.ts            # Test Files
│
├── drizzle/                   # Database Schema & Migrations
│   ├── schema.ts            # Table Definitions
│   ├── meta/                # Migration Metadata
│   └── migrations/          # SQL Migrations
│
├── shared/                    # Shared Code (Frontend & Backend)
│   ├── _core/               # Core Shared Utilities
│   ├── const.ts             # Constants
│   ├── statuses.ts          # Status Definitions
│   └── coordinates.ts       # Coordinate Extraction Utility
│
├── patches/                   # Package Patches
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript Config
├── vite.config.ts            # Vite Config
└── todo.md                   # Project TODO List
```

### Folder Purposes | أغراض المجلدات

| Folder | Purpose (Arabic) |
|--------|-----------------|
| `client/` | تطبيق React للواجهة الأمامية |
| `client/src/pages/` | صفحات التطبيق (Dashboard, Clients, Agents, etc.) |
| `client/src/components/` | المكونات القابلة لإعادة الاستخدام |
| `server/` | خادم Express مع tRPC |
| `server/_core/` | البنية التحتية (OAuth, context, middleware) |
| `drizzle/` | مخطط قاعدة البيانات والترحيلات |
| `shared/` | الكود المشترك بين الخادم والعميل |

---

## 4. DATABASE SCHEMA | مخطط قاعدة البيانات

### Tables Overview | نظرة عامة على الجداول

The database consists of 5 main tables that handle all application data.

| Table | Arabic Name | Purpose |
|-------|-------------|---------|
| `users` | المستخدمين | Authentication & User Management |
| `agents` | الوكلاء | Authorized Agents Registry |
| `clients` | العملاء | Client/Case Records |
| `settings` | الإعدادات | Application Settings |
| `documents` | المستندات | Uploaded Documents |

### Table: `users` (المستخدمين)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary Key |
| `openId` | VARCHAR(64) | NOT NULL, UNIQUE | OAuth ID |
| `name` | TEXT | NULLABLE | User Name |
| `email` | VARCHAR(320) | NULLABLE | Email Address |
| `loginMethod` | VARCHAR(64) | NULLABLE | Login Method |
| `role` | ENUM('user','admin') | DEFAULT 'user' | User Role |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Creation Date |
| `updatedAt` | TIMESTAMP | ON UPDATE NOW() | Last Update |
| `lastSignedIn` | TIMESTAMP | DEFAULT NOW() | Last Login |

### Table: `agents` (الوكلاء)

| Column | Type | Constraints | Description (Arabic) |
|--------|------|-------------|---------------------|
| `id` | INT | PK, AUTO_INCREMENT | المعرف |
| `created_at` | TIMESTAMP | DEFAULT NOW() | تاريخ الإنشاء |
| `name` | VARCHAR(255) | NOT NULL | اسم الوكيل |
| `id_number` | VARCHAR(20) | NULLABLE | رقم الهوية |
| `birth_date` | DATE | NULLABLE | تاريخ الميلاد |
| `phone` | VARCHAR(20) | NULLABLE | رقم الجوال |

### Table: `clients` (العملاء)

| Column | Type | Constraints | Description (Arabic) |
|--------|------|-------------|---------------------|
| `id` | INT | PK, AUTO_INCREMENT | المعرف |
| `created_at` | TIMESTAMP | DEFAULT NOW() | تاريخ الإنشاء |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | تاريخ التحديث |
| `name` | VARCHAR(255) | NOT NULL | اسم العميل |
| `phone` | VARCHAR(20) | NULLABLE | رقم الجوال |
| `id_number` | VARCHAR(20) | NULLABLE | رقم الهوية |
| `agent_id` | INT | FK → agents.id | الوكيل المرتبط |
| `wakalah_number` | VARCHAR(50) | NULLABLE | رقم الوكالة |
| `agency_date` | DATE | NULLABLE | تاريخ الوكالة |
| `property_doc_type` | ENUM | DEFAULT 'Deed' | نوع المستند (صك/إحكام/إحياءات/أخرى) |
| `deed_number` | VARCHAR(50) | NULLABLE | رقم الصك |
| `deed_date` | DATE | NULLABLE | تاريخ الصك |
| `request_number` | VARCHAR(50) | NULLABLE | رقم الطلب |
| `request_date` | DATE | NULLABLE | تاريخ الطلب |
| `property_description` | TEXT | NULLABLE | وصف العقار |
| `city` | VARCHAR(100) | NULLABLE | المدينة |
| `map_link` | TEXT | NULLABLE | رابط الخريطة |
| `latitude` | DECIMAL(10,8) | NULLABLE | خط العرض |
| `longitude` | DECIMAL(11,8) | NULLABLE | خط الطول |
| `district` | VARCHAR(100) | NULLABLE | الحي |
| `survey_map_ref` | VARCHAR(500) | NULLABLE | مرجع الكروكي |
| `status` | ENUM | DEFAULT 'New' | حالة الملف |
| `area_sqm` | INT | NULLABLE | المساحة (م²) |
| `expected_compensation_per_sqm` | INT | NULLABLE | سعر المتر المتوقع |
| `expected_compensation_total` | INT | NULLABLE | إجمالي التعويض المتوقع |
| `success_fee` | INT | NULLABLE | نسبة النجاح (×100) |
| `base_fee_percentage` | INT | DEFAULT 0 | نسبة الأتعاب الأساسية |
| `ref_code` | VARCHAR(20) | NULLABLE | رمز الملف |
| `missing_documents` | TEXT | NULLABLE | المستندات الناقصة |

**Status Values (حالات الملف):**

| Status | Arabic Label |
|--------|-------------|
| New | جديد |
| WakalahRegistration | تسجيل الوكالة |
| FilePreparation | جاري تجهيز الملف |
| FileSubmitted | تم تقديم الملف |
| Processing | قيد المعالجة |
| Valuation | التقييم |
| UnderReview | قيد المراجعة |
| ObjectionSubmitted | تقديم اعتراض |
| PaymentPending | في انتظار الدفع |
| CheckIssued | تم إصدار الشيك |
| Completed | مكتمل |

### Table: `settings` (الإعدادات)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary Key |
| `key` | VARCHAR(100) | NOT NULL, UNIQUE | Setting Key |
| `value` | TEXT | NULLABLE | Setting Value |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Last Update |

### Table: `documents` (المستندات)

| Column | Type | Constraints | Description (Arabic) |
|--------|------|-------------|---------------------|
| `id` | INT | PK, AUTO_INCREMENT | المعرف |
| `client_id` | INT | NOT NULL, FK | العميل المرتبط |
| `document_type` | ENUM | NOT NULL | نوع المستند |
| `custom_name` | VARCHAR(255) | NULLABLE | اسم مخصص |
| `file_name` | VARCHAR(255) | NOT NULL | اسم الملف |
| `file_url` | TEXT | NOT NULL | رابط الملف |
| `file_key` | VARCHAR(255) | NOT NULL | مفتاح S3 |
| `file_size` | INT | NULLABLE | حجم الملف |
| `mime_type` | VARCHAR(100) | NULLABLE | نوع الملف |
| `doc_status` | ENUM | DEFAULT 'pending' | حالة المستند |
| `uploaded_at` | TIMESTAMP | DEFAULT NOW() | تاريخ الرفع |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | تاريخ التحديث |

**Document Types (أنواع المستندات):**
- `ownership_deed` - صك الملكية
- `owner_id` - هوية المالك
- `legal_wakalah` - الوكالة الشرعية
- `agent_id` - هوية الوكيل
- `survey_report` - تقرير المساحة
- `heirs_certificate` - صك حصر الورثة
- `other` - أخرى

### Relationships | العلاقات

```
agents (1) ←──────→ (N) clients
         agent_id FK

clients (1) ←──────→ (N) documents
          client_id FK
```

---

## 5. API ENDPOINTS | نقاط النهاية

The application uses **tRPC** for type-safe API communication. All endpoints are accessed via `/api/trpc/*`.

### Authentication | المصادقة

| Procedure | Type | Description |
|-----------|------|-------------|
| `auth.me` | Query | Get current user info |
| `auth.logout` | Mutation | Logout user |
| `auth.verifyAccessCode` | Mutation | Verify access code for login |
| `auth.verifyMasterKey` | Mutation | Verify master key for admin actions |

### Agents | الوكلاء

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `agents.list` | Query | - | Get all agents |
| `agents.getById` | Query | `{ id: number }` | Get agent by ID |
| `agents.create` | Mutation | `{ name, idNumber?, birthDate?, phone? }` | Create new agent |
| `agents.update` | Mutation | `{ id, name?, idNumber?, birthDate?, phone? }` | Update agent |
| `agents.delete` | Mutation | `{ id, masterKey }` | Delete agent (requires master key) |

### Clients | العملاء

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `clients.list` | Query | - | Get all clients |
| `clients.getById` | Query | `{ id: number }` | Get client by ID |
| `clients.getWithAgent` | Query | `{ id: number }` | Get client with agent info |
| `clients.getByRefCode` | Query | `{ refCode: string }` | Get client by reference code |
| `clients.search` | Query | `{ query: string }` | Search clients |
| `clients.byStatus` | Query | `{ status: string }` | Get clients by status |
| `clients.create` | Mutation | `{ name, phone?, ... }` | Create new client |
| `clients.update` | Mutation | `{ id, name?, ... }` | Update client |
| `clients.delete` | Mutation | `{ id, masterKey }` | Delete client (requires master key) |

### Dashboard | لوحة التحكم

| Procedure | Type | Description |
|-----------|------|-------------|
| `dashboard.stats` | Query | Get dashboard statistics |

### Settings | الإعدادات

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `settings.get` | Query | `{ key: string }` | Get setting by key |
| `settings.set` | Mutation | `{ key, value, masterKey }` | Set setting value |
| `settings.getAll` | Query | - | Get all settings |
| `settings.getWhatsAppTemplates` | Query | - | Get WhatsApp message templates |
| `settings.setWhatsAppTemplate` | Mutation | `{ type, template, masterKey }` | Update WhatsApp template |

### Documents | المستندات

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `documents.listByClient` | Query | `{ clientId: number }` | Get documents for client |
| `documents.create` | Mutation | `{ clientId, documentType, fileName, ... }` | Create document record |
| `documents.update` | Mutation | `{ id, status?, customName? }` | Update document |
| `documents.delete` | Mutation | `{ id: number }` | Delete document |
| `documents.upload` | Mutation | `{ fileName, fileData, mimeType, clientId }` | Upload file to S3 |

---

## 6. ENVIRONMENT VARIABLES | متغيرات البيئة

### Required Variables | المتغيرات المطلوبة

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Session signing secret | `your-secret-key-here` |
| `VITE_APP_ID` | Manus OAuth App ID | `app-xxxxx` |
| `OAUTH_SERVER_URL` | OAuth backend URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal | `https://auth.manus.im` |
| `BUILT_IN_FORGE_API_URL` | Manus API URL | `https://forge.manus.ai` |
| `BUILT_IN_FORGE_API_KEY` | Server-side API key | `sk-xxxxx` |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend API key | `pk-xxxxx` |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend API URL | `https://forge.manus.ai` |

### Optional Variables | المتغيرات الاختيارية

| Variable | Description | Default |
|----------|-------------|---------|
| `LOGIN_ACCESS_CODE` | Access code for login | `BAREQ2030` |
| `MASTER_KEY` | Admin master key | `RAJ0579` |
| `OWNER_OPEN_ID` | Owner's OAuth ID | - |
| `OWNER_NAME` | Owner's display name | - |

### S3 Storage Variables | متغيرات التخزين

| Variable | Description |
|----------|-------------|
| `S3_BUCKET` | S3 bucket name |
| `S3_REGION` | AWS region |
| `S3_ACCESS_KEY_ID` | AWS access key |
| `S3_SECRET_ACCESS_KEY` | AWS secret key |

> **Note:** When deployed on Manus platform, most environment variables are automatically injected.

---

## 7. SETUP INSTRUCTIONS | تعليمات الإعداد

### Prerequisites | المتطلبات الأساسية

- Node.js 22.x or higher
- pnpm 10.x (package manager)
- MySQL 8.x or TiDB database

### Installation | التثبيت

```bash
# Clone the repository
git clone <repository-url>
cd wakala-ems-new

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your values
```

### Database Setup | إعداد قاعدة البيانات

```bash
# Generate and run migrations
pnpm db:push

# This command runs:
# 1. drizzle-kit generate - Generate migration files
# 2. drizzle-kit migrate - Apply migrations to database
```

### Development | التطوير

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:3000
```

### Testing | الاختبار

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- coordinates.test.ts
```

### Production Build | بناء الإنتاج

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Type Checking | فحص الأنواع

```bash
# Run TypeScript type check
pnpm check
```

---

## 8. DEFAULT CREDENTIALS | بيانات الاعتماد الافتراضية

### Access Code | كود الدخول

| Purpose | Value |
|---------|-------|
| Login Access Code | `BAREQ2030` |
| Master Key (Admin) | `RAJ0579` |

> **Security Warning:** Change these values in production by setting `LOGIN_ACCESS_CODE` and `MASTER_KEY` environment variables.

### Admin Access | الوصول الإداري

The first user to log in becomes the owner. To promote a user to admin:

1. Access the database directly
2. Update the `role` field in `users` table to `'admin'`

```sql
UPDATE users SET role = 'admin' WHERE openId = 'user-open-id';
```

---

## 9. KNOWN ISSUES | المشاكل المعروفة

### Current Issues | المشاكل الحالية

| Issue | Status | Workaround |
|-------|--------|------------|
| Archive page missing | Known | Page file needs to be created |
| Existing clients need re-save for coordinates | By Design | Open and save each client to extract coordinates |

### Incomplete Features | الميزات غير المكتملة

| Feature | Status | Notes |
|---------|--------|-------|
| PDF Export | Not Implemented | Future enhancement |
| Email Notifications | Not Implemented | WhatsApp templates available |
| Bulk Import | Not Implemented | Manual entry only |
| Multi-language | Partial | Arabic UI, some English labels |

### Archive Page Fix | إصلاح صفحة الأرشيف

The Archive page is referenced in App.tsx but the file may be missing. To fix:

```bash
# Check if file exists
ls client/src/pages/Archive.tsx

# If missing, create it or update App.tsx to remove the route
```

---

## 10. DEPLOYMENT NOTES | ملاحظات النشر

### Recommended Hosting | الاستضافة الموصى بها

| Requirement | Specification |
|-------------|---------------|
| VPS RAM | 2GB minimum, 4GB recommended |
| CPU | 2 cores minimum |
| Storage | 20GB SSD |
| OS | Ubuntu 22.04 LTS |

### Required Ports | المنافذ المطلوبة

| Port | Service |
|------|---------|
| 3000 | Application (can be proxied) |
| 443 | HTTPS (via reverse proxy) |
| 80 | HTTP redirect |

### SSL/HTTPS Requirements | متطلبات SSL

- **Required** for production deployment
- Use Let's Encrypt for free SSL certificates
- Configure via Nginx or Caddy reverse proxy

### Nginx Configuration Example | مثال إعداد Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Manus Platform Deployment | النشر على منصة Manus

When deploying on Manus platform:

1. Create a checkpoint using `webdev_save_checkpoint`
2. Click the **Publish** button in the Management UI
3. Configure custom domain in Settings → Domains
4. Environment variables are automatically injected

### Health Check Endpoint | نقطة فحص الصحة

```
GET /api/trpc/auth.me
```

Returns user info if authenticated, null otherwise.

---

## Appendix A: File Status Flow | مسار حالات الملف

```
جديد (New)
    ↓
تسجيل الوكالة (WakalahRegistration)
    ↓
جاري تجهيز الملف (FilePreparation)
    ↓
تم تقديم الملف (FileSubmitted)
    ↓
قيد المعالجة (Processing)
    ↓
التقييم (Valuation)
    ↓
قيد المراجعة (UnderReview)
    ↓ (إذا تم الاعتراض)
تقديم اعتراض (ObjectionSubmitted)
    ↓
في انتظار الدفع (PaymentPending)
    ↓
تم إصدار الشيك (CheckIssued)
    ↓
مكتمل (Completed)
```

---

## Appendix B: WhatsApp Template Variables | متغيرات قوالب واتساب

| Variable | Description |
|----------|-------------|
| `{اسم_العميل}` | Client name |
| `{رمز_الملف}` | File reference code |
| `{اسم_الوكيل}` | Agent name |
| `{رقم_الوكالة}` | Wakalah number |
| `{الحالة}` | Current status |
| `{المستندات_الناقصة}` | Missing documents list |
| `{رقم_الهوية}` | ID number |
| `{تاريخ_الميلاد}` | Birth date |
| `{هاتف_الوكيل}` | Agent phone |

---

**End of Technical Report**

*Generated by Manus AI - December 2025*
