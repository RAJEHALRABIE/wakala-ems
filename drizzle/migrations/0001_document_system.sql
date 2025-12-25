-- Migration: إضافة نظام المستندات الجديد
-- تاريخ: 2025-12-20
-- وصف: إنشاء جداول document_types و client_documents وإضافة البيانات الأولية

-- 1. إنشاء جدول أنواع المستندات
CREATE TABLE IF NOT EXISTS document_types (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  category ENUM('common', 'title_deed', 'ihkaam', 'ihyaa'),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. إنشاء جدول مستندات العملاء
CREATE TABLE IF NOT EXISTS client_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  document_type_id VARCHAR(50) NOT NULL,
  
  label VARCHAR(100) NOT NULL,
  description TEXT,
  
  file_url TEXT,
  file_key VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(100),
  
  uploaded_at TIMESTAMP NULL,
  uploaded_by INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. إضافة البيانات الأولية لأنواع المستندات (11 نوعاً)
INSERT INTO document_types (id, label, category, display_order) VALUES
-- فئة: title_deed (صك الملكية)
('property_deed', 'صك الملكية', 'title_deed', 1),
('owner_id', 'هوية المالك', 'title_deed', 2),
('legal_agency', 'الوكالة الشرعية', 'title_deed', 3),
('agent_id', 'هوية الوكيل', 'title_deed', 4),
('survey_plan', 'الرفع المساحي للعقار', 'title_deed', 5),
('heirs_inventory', 'حصر الورثة', 'title_deed', 6),

-- فئة: ihkaam (إحكام)
('ihkaam_request', 'طلب منصة إحكام', 'ihkaam', 7),
('supporting_docs', 'مستندات داعمة للحكم', 'ihkaam', 8),

-- فئة: ihyaa (إحياءات)
('other_proof', 'مستندات ثبوتية أخرى', 'ihyaa', 9),

-- فئة: common (مشتركة لجميع الأنواع)
('common_owner_id', 'هوية المالك', 'common', 10),
('common_legal_agency', 'الوكالة الشرعية', 'common', 11);

-- 4. إنشاء فهارس للأداء
CREATE INDEX idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX idx_client_documents_document_type_id ON client_documents(document_type_id);
CREATE INDEX idx_client_documents_uploaded_at ON client_documents(uploaded_at);

-- 5. توضيح: جدول documents القديم يبقى كما هو للتوافق مع النظام القديم
