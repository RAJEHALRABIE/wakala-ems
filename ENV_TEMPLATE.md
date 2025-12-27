# Environment Variables Template
# متغيرات البيئة المطلوبة

Copy these variables to your `.env` file and fill in your values.

## Database | قاعدة البيانات

```env
DATABASE_URL=mysql://user:password@localhost:3306/wakala_ems
```

## Authentication | المصادقة

```env
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars

# Access code for login (change in production)
LOGIN_ACCESS_CODE=BAREQ2030

# Master key for admin operations (change in production)
MASTER_KEY=RAJ0579
```

## Manus OAuth (Required for Manus Platform)

```env
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Owner info (auto-filled by Manus)
OWNER_OPEN_ID=
OWNER_NAME=
```

## Manus Forge API

```env
BUILT_IN_FORGE_API_URL=https://forge.manus.ai
BUILT_IN_FORGE_API_KEY=sk-your-server-api-key

VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai
VITE_FRONTEND_FORGE_API_KEY=pk-your-frontend-api-key
```

## S3 Storage (for document uploads)

```env
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Analytics (Optional)

```env
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## App Settings (Optional)

```env
VITE_APP_TITLE=نظام وكالة EMS
VITE_APP_LOGO=
```

## Docker Compose Specific

```env
MYSQL_ROOT_PASSWORD=root_password
```

---

**Note:** When deployed on Manus platform, most variables are automatically injected.
