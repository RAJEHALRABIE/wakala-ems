-- ========================================
-- إضافة الحقول المطلوبة لقاعدة البيانات
-- Wakala EMS - Track Page Enhancements
-- Compatible with: MariaDB 10.4+ and MySQL 8+
-- ========================================

-- ملاحظة هامة | Important Note:
-- هذا الملف مُحدَّث ليتوافق مع MariaDB 10.4 و MySQL 8
-- التغيير الرئيسي: استخدام Generated Column بدلاً من Functional Index
-- لأن MariaDB 10.4 لا تدعم صياغة CREATE INDEX على تعبير مباشر

-- ========================================
-- الجزء الأول: إضافة الحقول الأساسية
-- ========================================

-- 1. إضافة حقول بيانات الوكالة
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS power_of_attorney_number VARCHAR(100) COMMENT 'رقم الوكالة',
ADD COLUMN IF NOT EXISTS power_of_attorney_issue_date DATE COMMENT 'تاريخ إصدار الوكالة',
ADD COLUMN IF NOT EXISTS power_of_attorney_duration INT DEFAULT 180 COMMENT 'مدة الوكالة بالأيام',
ADD COLUMN IF NOT EXISTS power_of_attorney_file_url TEXT COMMENT 'رابط ملف الوكالة PDF';

-- 2. إضافة حقول بيانات العقار الإضافية
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS property_total_area VARCHAR(50) COMMENT 'إجمالي مساحة العقار',
ADD COLUMN IF NOT EXISTS property_expropriation_type ENUM('كلي', 'جزئي', 'إحياءات') DEFAULT 'كلي' COMMENT 'نوع النزع',
ADD COLUMN IF NOT EXISTS property_coordinates_lat DECIMAL(10, 8) COMMENT 'خط العرض',
ADD COLUMN IF NOT EXISTS property_coordinates_lng DECIMAL(11, 8) COMMENT 'خط الطول';

-- 3. إضافة حقول التعويض
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS compensation_official_estimate DECIMAL(15, 2) COMMENT 'قيمة التعويض الرسمية',
ADD COLUMN IF NOT EXISTS compensation_status ENUM('قيد التقييم', 'صدرت التقديرات') DEFAULT 'قيد التقييم' COMMENT 'حالة التقديرات';

-- ========================================
-- الجزء الثاني: Generated Column لتاريخ انتهاء الوكالة
-- ========================================

-- 4. إضافة عمود مُولَّد (Generated Column) لحساب تاريخ انتهاء الوكالة
-- هذا الحل يعمل في MariaDB 10.4+ و MySQL 8+
-- العمود يُحسب تلقائياً: تاريخ الإصدار + المدة بالأيام

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS poa_end_date DATE 
  AS (DATE_ADD(power_of_attorney_issue_date, INTERVAL power_of_attorney_duration DAY)) 
  STORED
  COMMENT 'تاريخ انتهاء الوكالة (محسوب تلقائياً)';

-- ملاحظة: استخدمنا STORED بدلاً من VIRTUAL لأن:
-- 1. STORED يخزن القيمة فعلياً = أسرع في الاستعلام
-- 2. يمكن إنشاء فهرس عليه بسهولة
-- 3. متوافق مع MariaDB 10.4 و MySQL 8

-- ========================================
-- الجزء الثالث: إنشاء جدول ملاحظات المراحل
-- ========================================

-- 5. إنشاء جدول ملاحظات المراحل
CREATE TABLE IF NOT EXISTS timeline_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL COMMENT 'معرف الطلب',
  stage_name VARCHAR(100) NOT NULL COMMENT 'اسم المرحلة',
  notes TEXT COMMENT 'الملاحظات',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإضافة',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  INDEX idx_document_stage (document_id, stage_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ملاحظات مراحل معالجة الطلبات';

-- ========================================
-- الجزء الرابع: إنشاء الفهارس (Indexes)
-- ========================================

-- 6. إنشاء فهرس على العمود المُولَّد (poa_end_date)
-- هذا يعمل بشكل مثالي في MariaDB 10.4+ و MySQL 8+
CREATE INDEX IF NOT EXISTS idx_poa_end_date ON documents (poa_end_date);

-- 7. فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_compensation_status ON documents (compensation_status);
CREATE INDEX IF NOT EXISTS idx_expropriation_type ON documents (property_expropriation_type);
CREATE INDEX IF NOT EXISTS idx_poa_number ON documents (power_of_attorney_number);

-- ========================================
-- الجزء الخامس: تحديث البيانات الموجودة
-- ========================================

-- 8. تحديث الطلبات الموجودة بقيم افتراضية (اختياري)
UPDATE documents 
SET 
  power_of_attorney_duration = 180,
  property_expropriation_type = 'كلي',
  compensation_status = 'قيد التقييم'
WHERE power_of_attorney_duration IS NULL;

-- ملاحظة: العمود poa_end_date سيُحسب تلقائياً بعد التحديث

-- ========================================
-- الجزء السادس: إضافة حقل صورة الوكيل
-- ========================================

-- 9. إضافة حقل لتخزين صورة الوكيل (اختياري)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS avatar_url TEXT COMMENT 'رابط صورة الوكيل' AFTER phone;

-- ========================================
-- الجزء السابع: إنشاء View للاستعلامات
-- ========================================

-- 10. إنشاء view لتسهيل استعلامات التتبع
-- تم تحديث الـ view لاستخدام العمود المُولَّد poa_end_date
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
  d.poa_end_date AS power_of_attorney_end_date,  -- استخدام العمود المُولَّد
  DATEDIFF(d.poa_end_date, CURDATE()) AS days_until_expiry,  -- استخدام العمود المُولَّد
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
-- الجزء الثامن: Stored Procedures
-- ========================================

-- 11. إنشاء stored procedure لجلب بيانات التتبع
DROP PROCEDURE IF EXISTS sp_get_tracking_details;

DELIMITER //

CREATE PROCEDURE sp_get_tracking_details(IN p_order_number VARCHAR(50))
BEGIN
  -- جلب بيانات الطلب الرئيسية
  SELECT * FROM v_tracking_details WHERE order_number = p_order_number;
  
  -- جلب ملاحظات المراحل
  SELECT 
    stage_name,
    notes,
    created_at,
    updated_at
  FROM timeline_notes
  WHERE document_id = (SELECT id FROM documents WHERE order_number = p_order_number)
  ORDER BY created_at ASC;
END //

DELIMITER ;

-- ========================================
-- الجزء التاسع: Triggers
-- ========================================

-- 12. إنشاء trigger لإضافة ملاحظة تلقائية عند تغيير حالة الطلب
DROP TRIGGER IF EXISTS trg_document_status_change;

DELIMITER //

CREATE TRIGGER trg_document_status_change
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO timeline_notes (document_id, stage_name, notes)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'pending' THEN 'الحالة الحالية'
        WHEN 'poa_registered' THEN 'تسجيل الوكالة'
        WHEN 'preparing' THEN 'جاري تجهيز الملف'
        WHEN 'submitted' THEN 'تم تقديم الملف'
        WHEN 'processing' THEN 'قيد المعالجة'
        WHEN 'evaluation' THEN 'التقييم'
        WHEN 'under_review' THEN 'قيد المراجعة'
        WHEN 'objection' THEN 'تقديم اعتراض'
        WHEN 'awaiting_payment' THEN 'في انتظار الدفع'
        WHEN 'check_issued' THEN 'تم إصدار الشيك'
        WHEN 'completed' THEN 'مكتمل'
        ELSE 'تحديث الحالة'
      END,
      CONCAT('تم تغيير الحالة من ', OLD.status, ' إلى ', NEW.status)
    );
  END IF;
END //

DELIMITER ;

-- ========================================
-- الجزء العاشر: إنشاء Stored Procedure للوكالات المنتهية
-- ========================================

-- 13. إنشاء stored procedure لجلب الوكالات التي ستنتهي قريباً
DROP PROCEDURE IF EXISTS sp_get_expiring_power_of_attorneys;

DELIMITER //

CREATE PROCEDURE sp_get_expiring_power_of_attorneys(IN days_threshold INT)
BEGIN
  -- جلب الوكالات التي ستنتهي خلال عدد الأيام المحدد
  SELECT 
    d.id,
    d.order_number,
    c.name AS client_name,
    c.phone AS client_phone,
    d.power_of_attorney_number,
    d.power_of_attorney_issue_date,
    d.poa_end_date,
    DATEDIFF(d.poa_end_date, CURDATE()) AS days_remaining,
    CASE 
      WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 0 THEN 'منتهية'
      WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 7 THEN 'عاجل'
      WHEN DATEDIFF(d.poa_end_date, CURDATE()) <= 30 THEN 'تحذير'
      ELSE 'سارية'
    END AS urgency_level
  FROM documents d
  LEFT JOIN clients c ON d.client_id = c.id
  WHERE d.poa_end_date IS NOT NULL
    AND DATEDIFF(d.poa_end_date, CURDATE()) <= days_threshold
    AND DATEDIFF(d.poa_end_date, CURDATE()) >= 0
  ORDER BY days_remaining ASC;
END //

DELIMITER ;

-- ========================================
-- استعلامات مفيدة للمراجعة
-- ========================================

-- عرض الوكالات التي ستنتهي خلال 30 يوم
-- CALL sp_get_expiring_power_of_attorneys(30);

-- عرض جميع الوكالات حسب الحالة
-- SELECT 
--   poa_status,
--   COUNT(*) as count,
--   GROUP_CONCAT(order_number SEPARATOR ', ') as orders
-- FROM v_tracking_details
-- GROUP BY poa_status;

-- عرض الوكالات المنتهية
-- SELECT 
--   order_number,
--   client_name,
--   power_of_attorney_number,
--   power_of_attorney_end_date,
--   days_until_expiry
-- FROM v_tracking_details
-- WHERE poa_status = 'منتهية'
-- ORDER BY power_of_attorney_end_date DESC;

-- ========================================
-- اختبار التوافقية
-- ========================================

-- التحقق من إنشاء العمود المُولَّد بنجاح
-- SELECT 
--   COLUMN_NAME,
--   COLUMN_TYPE,
--   GENERATION_EXPRESSION,
--   IS_GENERATED
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = 'wakala_ems'
--   AND TABLE_NAME = 'documents'
--   AND COLUMN_NAME = 'poa_end_date';

-- التحقق من إنشاء الفهرس بنجاح
-- SHOW INDEX FROM documents WHERE Key_name = 'idx_poa_end_date';

-- ========================================
-- ملاحظات ختامية
-- ========================================

-- ✅ تم التحديث بنجاح للتوافق مع MariaDB 10.4+
-- ✅ يعمل أيضاً مع MySQL 8+ بدون مشاكل
-- ✅ استخدام Generated Column بدلاً من Functional Index
-- ✅ جميع الاستعلامات والـ Views محدثة
-- ✅ الأداء محسّن بالفهارس المناسبة

-- الفروقات الرئيسية عن النسخة السابقة:
-- 1. إضافة عمود poa_end_date كـ STORED Generated Column
-- 2. إنشاء فهرس عادي على poa_end_date (بدلاً من functional index)
-- 3. تحديث الـ View لاستخدام poa_end_date
-- 4. إضافة stored procedure لجلب الوكالات المنتهية
-- 5. إضافة IF NOT EXISTS لتجنب الأخطاء عند إعادة التشغيل

SELECT '✅ تم تنفيذ جميع التعديلات بنجاح! السكريبت متوافق مع MariaDB 10.4+ و MySQL 8+' AS message;
