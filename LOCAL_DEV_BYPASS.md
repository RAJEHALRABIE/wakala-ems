# تجاوز تسجيل الدخول للتطوير المحلي
# Local Development Login Bypass

## المشكلة
المشروع يستخدم Manus OAuth ولن يعمل محلياً بدون سيرفر Manus.

## الحل المؤقت

### الخطوة 1: عدّل ملف Login.tsx

افتح الملف: `client/src/pages/Login.tsx`

ابحث عن دالة التحقق من كود الدخول وأضف هذا في البداية:

```tsx
// في دالة handleSubmit أو ما يماثلها
const handleLogin = async () => {
  // === LOCAL DEV BYPASS - Remove in production ===
  if (accessCode === "BAREQ2030" || accessCode === "LOCAL") {
    localStorage.setItem("wakala_access", "granted");
    window.location.href = "/dashboard";
    return;
  }
  // === END BYPASS ===
  
  // ... باقي الكود الأصلي
};
```

### الخطوة 2: أو استخدم Console

افتح المتصفح على صفحة Login، ثم افتح Developer Tools (F12)، واكتب:

```javascript
localStorage.setItem("wakala_access", "granted");
window.location.href = "/dashboard";
```

### الخطوة 3: للاختبار السريع

يمكنك أيضاً فتح الرابط مباشرة بعد تشغيل السيرفر:
```
http://localhost:3000/dashboard
```

ثم نفذ أمر Console أعلاه.

---

## ⚠️ تحذير أمني

هذا الحل للتطوير المحلي فقط!
لا تستخدمه في الإنتاج (Production).

للإنتاج، يجب استبدال نظام Manus OAuth بنظام مصادقة مستقل.
