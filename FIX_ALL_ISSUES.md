# 🔧 إصلاحات GA4 Analytics - المشاكل الثلاثة

---

## المشكلة 1: لا توجد بيانات

### الأسباب المحتملة:

#### 1. GA4 Credentials خاطئة
**التحقق:**
افتح ملف `.env` وتأكد من:
```bash
GA4_PROPERTY_ID=516067078
GA4_CREDENTIALS={"type":"service_account",...}
```

**الحل:**
- تأكد أن الـ JSON في سطر واحد (بدون فواصل أسطر)
- تأكد أنه JSON صحيح (استخدم jsonlint.com للتحقق)

#### 2. البيانات تحتاج وقت
**المشكلة:**
GA4 يحتاج 24-48 ساعة لمعالجة البيانات الجديدة!

**الحل:**
- البيانات القديمة (قبل أسبوع) يجب أن تظهر فوراً
- البيانات الجديدة (اليوم) قد لا تظهر

#### 3. Custom Events غير مُعدّة
**المشكلة:**
أحداث `select_agent` قد لا تكون موجودة في GA4

**التحقق:**
1. افتح GA4 Dashboard: https://analytics.google.com
2. اذهب إلى: Reports → Realtime
3. هل ترى زيارات؟

**الحل:**
إذا لم ترَ زيارات → المشكلة في tracking code على الموقع

---

## المشكلة 2: زر التحديث لا يعمل

### الإصلاح:

افتح `client/src/pages/Analytics.tsx`

#### ابحث عن:
```typescript
const handleRefresh = () => {
  refetchKPIs();
  refetchClicks();
  refetchSessions();
};
```

#### استبدله بـ:
```typescript
const handleRefresh = async () => {
  try {
    await Promise.all([
      refetchKPIs(),
      refetchClicks(),
      refetchSessions(),
    ]);
  } catch (error) {
    console.error('Refresh error:', error);
  }
};
```

---

## المشكلة 3: لا توجد خريطة

### الخريطة لم تُضاف بعد!

لإضافة الخريطة:

### الخطوة 1: تثبيت المكتبات
```bash
pnpm add react-leaflet leaflet
pnpm add -D @types/leaflet
```

### الخطوة 2: إضافة CSS
في `client/src/pages/Analytics.tsx`، أضف في البداية:
```typescript
import 'leaflet/dist/leaflet.css';
```

### الخطوة 3: إضافة getGeoData endpoint
في `server/routers.ts` داخل `analytics: router({...})`:

```typescript
getGeoData: publicProcedure
  .input(z.object({
    startDate: z.string(),
    endDate: z.string(),
  }))
  .query(async ({ input }) => {
    if (!analyticsClient) {
      return [];
    }

    try {
      const [response] = await analyticsClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
        dimensions: [
          { name: 'city' },
          { name: 'country' },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
        ],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 20,
      });

      return response.rows?.map(row => ({
        city: row.dimensionValues?.[0]?.value || 'Unknown',
        country: row.dimensionValues?.[1]?.value || 'Unknown',
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      })) || [];
    } catch (error) {
      console.error('GA4 Geo Error:', error);
      return [];
    }
  }),
```

### الخطوة 4: جدول المدن (بدون خريطة - أبسط!)
بدلاً من الخريطة المعقدة، أضف جدول بسيط:

في `Analytics.tsx`، أضف query:
```typescript
const { data: geoData, isLoading: geoLoading } = 
  trpc.analytics.getGeoData.useQuery(
    { startDate, endDate },
    { staleTime: 5 * 60 * 1000 }
  );
```

ثم أضف Card جديد قبل Privacy Notice:
```typescript
{/* Geographic Distribution */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <MapPin className="h-5 w-5" />
      توزيع الزوار الجغرافي
    </CardTitle>
    <CardDescription>أهم المدن والدول</CardDescription>
  </CardHeader>
  <CardContent>
    {isLoading || geoLoading ? (
      <Skeleton className="h-[200px] w-full" />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-right py-2 px-4">المدينة</th>
              <th className="text-right py-2 px-4">الدولة</th>
              <th className="text-right py-2 px-4">المستخدمون</th>
              <th className="text-right py-2 px-4">الجلسات</th>
            </tr>
          </thead>
          <tbody>
            {geoData?.slice(0, 10).map((item, index) => (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="py-2 px-4 font-medium">{item.city}</td>
                <td className="py-2 px-4">{item.country}</td>
                <td className="py-2 px-4">{item.users.toLocaleString('ar-SA')}</td>
                <td className="py-2 px-4">{item.sessions.toLocaleString('ar-SA')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </CardContent>
</Card>
```

---

## إضافة رسائل الأخطاء

في `Analytics.tsx`، أضف state للأخطاء:

```typescript
const [error, setError] = useState<string | null>(null);

// في كل query، أضف onError:
const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = 
  trpc.analytics.getKPIs.useQuery(
    { startDate, endDate },
    { 
      staleTime: 5 * 60 * 1000,
      onError: (err) => {
        console.error('KPIs error:', err);
        setError('خطأ في تحميل البيانات. تحقق من إعدادات GA4.');
      }
    }
  );
```

ثم أضف Alert في البداية:
```typescript
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>خطأ</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

---

## التحقق من Console

افتح المتصفح:
1. اضغط F12
2. اذهب إلى Console
3. ابحث عن أخطاء حمراء

**الأخطاء الشائعة:**

### "GA4 client not initialized"
**المشكلة:** GA4_CREDENTIALS غير موجودة في .env
**الحل:** راجع ملف .env

### "Failed to fetch"
**المشكلة:** Server غير متصل
**الحل:** تأكد من `pnpm dev` يعمل

### "Invalid credentials"
**المشكلة:** GA4_CREDENTIALS خاطئة
**الحل:** راجع ملف JSON

---

## اختبار سريع

### Test 1: هل Server متصل؟
افتح: http://localhost:3000/analytics
إذا فتح → Server يعمل ✅

### Test 2: هل GA4 متصل؟
راجع Console (F12) → هل توجد أخطاء GA4؟

### Test 3: هل البيانات موجودة في GA4؟
افتح GA4 Dashboard → Reports → Realtime
هل ترى بيانات؟

---

## الخلاصة

### إذا لا توجد بيانات:
1. ✅ تحقق من .env (GA4_CREDENTIALS)
2. ✅ راجع Console للأخطاء
3. ✅ تحقق من GA4 Dashboard
4. ⏰ انتظر 24-48 ساعة للبيانات الجديدة

### لإصلاح زر التحديث:
1. ✅ غيّر handleRefresh كما أعلاه
2. ✅ أضف async/await

### لإضافة الخريطة:
1. ✅ أضف getGeoData endpoint
2. ✅ أضف جدول المدن (أبسط من الخريطة)
3. 🎨 (اختياري) أضف خريطة Leaflet لاحقاً

---

## 🎯 الأولويات:

1. **الآن:** شغّل diagnose-ga4.ps1 (تشخيص)
2. **ثم:** أصلح زر التحديث
3. **ثم:** أضف جدول المدن
4. **أخيراً:** راجع Console للأخطاء
