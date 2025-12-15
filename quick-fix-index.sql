-- ========================================
-- إصلاح سريع للجداول الموجودة
-- Quick Fix for Existing Tables
-- ========================================

-- إذا كانت الجداول موجودة بالفعل ولديك فقط مشكلة في الفهرس
-- استخدم هذا السكريبت البسيط

-- ========================================
-- الخطوة 1: إضافة العمود المُولَّد
-- ========================================

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS poa_end_date DATE 
  AS (DATE_ADD(power_of_attorney_issue_date, INTERVAL power_of_attorney_duration DAY)) 
  STORED
  COMMENT 'تاريخ انتهاء الوكالة (محسوب تلقائياً)';

-- ========================================
-- الخطوة 2: إنشاء الفهرس على العمود المُولَّد
-- ========================================

CREATE INDEX IF NOT EXISTS idx_poa_end_date ON documents (poa_end_date);

-- ========================================
-- الخطوة 3: إعادة إنشاء الـ View (إذا كان موجوداً)
-- ========================================

DROP VIEW IF EXISTS v_tracking_details;

CREATE VIEW v_tracking_details AS
SELECT 
  d.id,
  d.order_number,
  d.status,
  d.created_at,
  
  -- بيانات العميل
  c.name AS client_name,
  c.phone AS client_phone,
  
  -- بيانات الوكيل
  a.id AS agent_id,
  a.name AS agent_name,
  a.phone AS agent_phone,
  a.id_number AS agent_id_number,
  a.avatar_url AS agent_avatar,
  
  -- بيانات الوكالة
  d.power_of_attorney_number,
  d.power_of_attorney_issue_date,
  d.power_of_attorney_duration,
  d.poa_end_date AS power_of_attorney_end_date,
  DATEDIFF(d.poa_end_date, CURDATE()) AS days_until_expiry,
  d.power_of_attorney_file_url,
  
  -- بيانات العقار
  d.property_type,
  d.property_address,
  d.property_total_area,
  d.property_expropriation_type,
  d.property_coordinates_lat,
  d.property_coordinates_lng,
  
  -- التعويض
  d.compensation_official_estimate,
  d.compensation_status,
  
  -- حسابات الحالة
  CASE 
    WHEN d.poa_end_date IS NULL THEN 'غير محدد'
    WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 0 THEN 'منتهية'
    WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 7 THEN 'تحذير عاجل'
    WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 30 THEN 'تحذير'
    ELSE 'سارية'
  END AS poa_status
  
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN agents a ON d.agent_id = a.id;

-- ========================================
-- اختبار التحقق
-- ========================================

-- 1. التحقق من العمود المُولَّد
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  GENERATION_EXPRESSION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'wakala_ems'
  AND TABLE_NAME = 'documents'
  AND COLUMN_NAME = 'poa_end_date';

-- 2. التحقق من الفهرس
SHOW INDEX FROM documents WHERE Key_name = 'idx_poa_end_date';

-- 3. اختبار عملي
SELECT 
  order_number,
  power_of_attorney_issue_date AS issue_date,
  power_of_attorney_duration AS duration_days,
  poa_end_date,
  DATEDIFF(poa_end_date, CURDATE()) AS days_remaining
FROM documents
WHERE poa_end_date IS NOT NULL
LIMIT 5;

-- ========================================
-- تم! ✅
-- ========================================

SELECT '✅ تم إصلاح المشكلة بنجاح! الفهرس جاهز للاستخدام.' AS status;
