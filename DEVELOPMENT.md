# Wakala EMS - دليل الإعداد والتطوير

## 🚀 بدء التطوير السريع

### المتطلبات الأساسية
- Node.js v18+
- pnpm v10+
- Git

### خطوات التشغيل

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Initialize database
npm run db:generate
npm run db:migrate

# 4. Start development servers
npm run dev
```

## 🌐 URLs التطوير

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3000/
- **tRPC API**: http://localhost:3000/api/trpc
- **Health Check**: http://localhost:3000/health

## 📁 بنية المشروع

```
wakala-ems/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── pages/         # Page Components
│   │   └── lib/           # Utilities
│   └── public/            # Static Assets
├── server/                # Backend (Node.js + Express)
│   ├── _core/            # Core server initialization
│   ├── routes/           # API Routes (tRPC)
│   └── db/               # Database utilities
├── shared/               # Shared types/constants
├── drizzle/             # Database schema & migrations
└── uploads/             # File storage (local)
```

## 🔧 التكنولوجيا المستخدمة

### Frontend
- **React 19** - UI Framework
- **Vite 7** - Build Tool
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component Library
- **tRPC** - Type-safe API Client
- **Tanstack Query** - Data Fetching

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **tRPC** - API Layer
- **Drizzle ORM** - Database ORM
- **SQLite** - Database (Development)
- **Winston** - Logging

## 🗄️ Database

### Current Setup
- **Development**: SQLite (file-based)
- **Schema**: Drizzle ORM migrations in `drizzle/`

### Common Commands
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (dev only)
npm run db:push
```

## 🔐 Authentication

النظام يستخدم OAuth مع Manus API:
- Base URL: `https://api.manus.im`
- Session cookies for auth

### Development Notes
```
[Auth] Missing session cookie
```
هذا طبيعي في development - للتجربة:
1. قم بتسجيل الدخول عبر `/auth/login`
2. أو استخدم token مباشر للتطوير

## 📤 File Uploads

- **Storage**: Local filesystem (`uploads/`)
- **Endpoint**: `/uploads/:filename`
- **Max Size**: Configured in server

## 🐛 Troubleshooting

### Problem: vite.config.ts corrupted
```bash
git checkout vite.config.ts
```

### Problem: Component not found
Check `client/src/components/` structure and import paths

### Problem: Port already in use
```bash
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: Database connection error
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# For SQLite (default):
DATABASE_URL=file:./local.db
```

## 📊 Monitoring & Logs

### Winston Logs
- Format: JSON with timestamps
- Levels: info, warn, error
- Output: Console (development)

### Google Analytics
- GA4 integration enabled
- Configured in server initialization

## 🎯 API Endpoints

### tRPC Routes (Type-safe)
- Client CRUD operations
- Document management
- Analytics data
- User authentication

### REST Endpoints
- `/health` - Health check
- `/uploads/:file` - File serving
- `/api/trpc` - tRPC handler

## 🏗️ Development Workflow

1. **Feature Development**
   - Create component in `client/src/components/`
   - Add tRPC route in `server/routes/`
   - Update shared types in `shared/`

2. **Database Changes**
   - Modify schema in `drizzle/schema.ts`
   - Run `npm run db:generate`
   - Apply with `npm run db:migrate`

3. **Testing**
   - Frontend: Check browser console
   - Backend: Check server logs
   - API: Use tRPC devtools

## 🚢 Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 📝 Notes

- **React 19**: Latest version, some libraries may need updates
- **Vite 7**: Cutting edge, watch for compatibility issues
- **Database**: Currently SQLite, consider MySQL for production
- **File Storage**: Local storage, consider S3 for production

## 🆘 Support

For issues:
1. Check logs in console
2. Verify `.env` configuration
3. Review this documentation
4. Check GitHub issues

---

**Last Updated**: 2025-12-20
**Version**: 1.0.0
