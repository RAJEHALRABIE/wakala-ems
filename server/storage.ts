/**
 * Flexible Storage Helper
 * يدعم التخزين المحلي (للتطوير) والسحابي (للإنتاج)
 * 
 * الوضع يُحدد تلقائياً من متغيرات البيئة:
 * - إذا وُجد S3_BUCKET → يستخدم S3/R2
 * - إذا لم يوجد → يستخدم التخزين المحلي
 */

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// التحقق من وضع التخزين
// ═══════════════════════════════════════════════════════════════

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'me-south-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // لـ Cloudflare R2

const USE_CLOUD_STORAGE = !!(S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY);

// إعلام المطور بالوضع المستخدم
if (USE_CLOUD_STORAGE) {
  console.log('[Storage] Mode: CLOUD (S3/R2)');
  console.log('[Storage] Bucket:', S3_BUCKET);
  if (S3_ENDPOINT) console.log('[Storage] Endpoint:', S3_ENDPOINT);
} else {
  console.log('[Storage] Mode: LOCAL (uploads/)');
}

// ═══════════════════════════════════════════════════════════════
// التخزين المحلي
// ═══════════════════════════════════════════════════════════════

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('[Storage] Created uploads directory:', UPLOAD_DIR);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .substring(0, 200);
}

async function localStoragePut(
  relKey: string,
  buffer: Buffer
): Promise<{ key: string; url: string }> {
  ensureUploadDir();
  
  const fileName = relKey.split('/').pop() || 'file';
  const safeFileName = sanitizeFileName(fileName);
  const uniqueName = `${Date.now()}-${safeFileName}`;
  
  const subDir = relKey.includes('/') 
    ? path.dirname(relKey).replace(/^\/+/, '') 
    : '';
  
  const targetDir = subDir 
    ? path.join(UPLOAD_DIR, subDir) 
    : UPLOAD_DIR;
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const filePath = path.join(targetDir, uniqueName);
  
  fs.writeFileSync(filePath, buffer);
  
  const relativePath = path.relative(UPLOAD_DIR, filePath).replace(/\\/g, '/');
  const url = `/uploads/${relativePath}`;
  
  console.log('[Storage:Local] File saved:', { key: uniqueName, url, size: buffer.length });
  
  return { key: uniqueName, url };
}

async function localStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, '');
  return { key, url: `/uploads/${key}` };
}

async function localStorageDelete(relKey: string): Promise<boolean> {
  const key = relKey.replace(/^\/+/, '');
  const filePath = path.join(UPLOAD_DIR, key);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('[Storage:Local] File deleted:', key);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// التخزين السحابي (S3 / Cloudflare R2)
// ═══════════════════════════════════════════════════════════════

let s3Client: any = null;

async function getS3Client() {
  if (s3Client) return s3Client;
  
  // Dynamic import لتجنب أخطاء إذا لم تكن المكتبة مثبتة
  try {
    const { S3Client } = await import('@aws-sdk/client-s3');
    
    const config: any = {
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY!,
        secretAccessKey: S3_SECRET_KEY!,
      },
    };
    
    // Cloudflare R2 يحتاج endpoint مخصص
    if (S3_ENDPOINT) {
      config.endpoint = S3_ENDPOINT;
      config.forcePathStyle = true; // مطلوب لـ R2
    }
    
    s3Client = new S3Client(config);
    return s3Client;
  } catch (error) {
    console.error('[Storage] AWS SDK not installed. Run: pnpm add @aws-sdk/client-s3');
    throw new Error('AWS SDK not available');
  }
}

async function cloudStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  
  const fileName = relKey.split('/').pop() || 'file';
  const safeFileName = sanitizeFileName(fileName);
  const key = `${Date.now()}-${safeFileName}`;
  const fullKey = relKey.includes('/') 
    ? `${path.dirname(relKey).replace(/^\/+/, '')}/${key}`
    : key;
  
  const buffer = typeof data === 'string' 
    ? Buffer.from(data) 
    : Buffer.from(data);
  
  await client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fullKey,
    Body: buffer,
    ContentType: contentType,
  }));
  
  // بناء الـ URL
  let url: string;
  if (S3_ENDPOINT) {
    // Cloudflare R2 public URL
    const publicDomain = process.env.S3_PUBLIC_URL || `https://${S3_BUCKET}.${S3_REGION}.r2.cloudflarestorage.com`;
    url = `${publicDomain}/${fullKey}`;
  } else {
    // AWS S3 URL
    url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fullKey}`;
  }
  
  console.log('[Storage:Cloud] File uploaded:', { key: fullKey, url, size: buffer.length });
  
  return { key: fullKey, url };
}

async function cloudStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, '');
  
  let url: string;
  if (S3_ENDPOINT) {
    const publicDomain = process.env.S3_PUBLIC_URL || `https://${S3_BUCKET}.${S3_REGION}.r2.cloudflarestorage.com`;
    url = `${publicDomain}/${key}`;
  } else {
    url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }
  
  return { key, url };
}

async function cloudStorageDelete(relKey: string): Promise<boolean> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await getS3Client();
    const key = relKey.replace(/^\/+/, '');
    
    await client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    
    console.log('[Storage:Cloud] File deleted:', key);
    return true;
  } catch (error) {
    console.error('[Storage:Cloud] Delete failed:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// الواجهة الموحدة (Unified Interface)
// ═══════════════════════════════════════════════════════════════

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const buffer = typeof data === 'string'
    ? Buffer.from(data)
    : Buffer.from(data);

  if (USE_CLOUD_STORAGE) {
    return cloudStoragePut(relKey, buffer, contentType);
  }
  return localStoragePut(relKey, buffer);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (USE_CLOUD_STORAGE) {
    return cloudStorageGet(relKey);
  }
  return localStorageGet(relKey);
}

export async function storageDelete(relKey: string): Promise<boolean> {
  if (USE_CLOUD_STORAGE) {
    return cloudStorageDelete(relKey);
  }
  return localStorageDelete(relKey);
}

// ═══════════════════════════════════════════════════════════════
// معلومات التصدير
// ═══════════════════════════════════════════════════════════════

export const storageInfo = {
  mode: USE_CLOUD_STORAGE ? 'cloud' : 'local',
  bucket: S3_BUCKET || null,
  region: S3_REGION,
  localDir: UPLOAD_DIR,
};
