# سكربت إصلاح خطأ console.log في server/_core/index.ts

$filePath = "server\_core\index.ts"

# قراءة محتوى الملف
$content = Get-Content $filePath -Raw

# استبدال الخطأ
$content = $content -replace 'console\.log`', 'console.log(`'

# حفظ الملف
Set-Content $filePath -Value $content -NoNewline

Write-Host "✅ تم إصلاح الملف بنجاح!" -ForegroundColor Green
Write-Host "🚀 الآن شغّل: pnpm run dev" -ForegroundColor Cyan
