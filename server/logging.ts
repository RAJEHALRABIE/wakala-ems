import { db, insertClientActivityLog, getClientActivityLogs as dbGetClientActivityLogs } from './db';
import { logger } from './logger';

/**
 * Global logging helper for client activities
 */

/**
 * Log a client activity to the database
 */
export async function logClientActivity(params: {
  clientId: number;
  actionType: 'STATUS_CHANGE' | 'DOC_UPLOAD' | 'DOC_DELETE' | 'WHATSAPP_SENT' | 'NOTE_ADD';
  description?: string;
  meta?: Record<string, any>;
  performedByUserId?: number;
}): Promise<void> {
  try {
    // Log attempt details
    console.log('[LOG ACTIVITY] Attempting to log activity:', {
      clientId: params.clientId,
      actionType: params.actionType,
      performedByUserId: params.performedByUserId,
      meta: params.meta,
    });

    // Use system admin user (id: 1) as default for all activities
    // This is a temporary bypass until proper auth is implemented
    const finalUserId = params.performedByUserId || 1;

    console.log('[LOG ACTIVITY] Using userId:', finalUserId);

    // Convert meta to JSON string for SQLite storage
    const metaString = params.meta ? JSON.stringify(params.meta) : null;
    
    // Insert into client_activity_log table
    const result = await insertClientActivityLog({
      clientId: params.clientId,
      actionType: params.actionType,
      description: params.description || null,
      meta: metaString as any, // Cast to any to match the expected type
      performedByUserId: finalUserId,
      createdAt: new Date(),
    });

    console.log('[LOG ACTIVITY] Successfully logged activity. Result:', result);

    // Database Activity Mirroring - console.info for terminal visibility
    console.info('[LOG]:', {
      clientId: params.clientId,
      action: params.actionType,
      description: params.description,
      meta: params.meta,
      performedBy: finalUserId,
      timestamp: new Date().toISOString()
    });

    // Also log to Winston logger for backup
    logger.info('Client activity logged', {
      clientId: params.clientId,
      actionType: params.actionType,
      description: params.description,
      performedByUserId: finalUserId,
      meta: params.meta,
    });
  } catch (error) {
    console.error('[LOG ACTIVITY] Failed to log client activity:', {
      clientId: params.clientId,
      actionType: params.actionType,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      dbError: error,
    });
    
    logger.error('Failed to log client activity', {
      clientId: params.clientId,
      actionType: params.actionType,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Don't throw - we don't want logging failures to break main functionality
  }
}

/**
 * Log document upload activity
 */
export async function logDocumentUpload(params: {
  clientId: number;
  documentId: number;
  fileName: string;
  documentTypeId: string;
  fileSize: number;
  performedByUserId?: number;
}): Promise<void> {
  await logClientActivity({
    clientId: params.clientId,
    actionType: 'DOC_UPLOAD',
    description: `تم رفع مستند: ${params.fileName} (${params.documentTypeId})`,
    meta: {
      documentId: params.documentId,
      fileName: params.fileName,
      documentTypeId: params.documentTypeId,
      fileSize: params.fileSize,
    },
    performedByUserId: params.performedByUserId,
  });
}

/**
 * Log document delete activity
 */
export async function logDocumentDelete(params: {
  clientId: number;
  documentId: number;
  fileName: string;
  documentTypeId: string;
  performedByUserId?: number;
}): Promise<void> {
  await logClientActivity({
    clientId: params.clientId,
    actionType: 'DOC_DELETE',
    description: `تم حذف مستند: ${params.fileName} (${params.documentTypeId})`,
    meta: {
      documentId: params.documentId,
      fileName: params.fileName,
      documentTypeId: params.documentTypeId,
    },
    performedByUserId: params.performedByUserId,
  });
}

/**
 * Log status change activity
 */
export async function logStatusChange(params: {
  clientId: number;
  oldStatus: string;
  newStatus: string;
  performedByUserId?: number;
  notes?: string;
}): Promise<void> {
  await logClientActivity({
    clientId: params.clientId,
    actionType: 'STATUS_CHANGE',
    description: `تغيير الحالة من "${params.oldStatus}" إلى "${params.newStatus}"${params.notes ? ` - ${params.notes}` : ''}`,
    meta: {
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      notes: params.notes,
    },
    performedByUserId: params.performedByUserId,
  });
}

/**
 * Log WhatsApp message sent activity
 */
export async function logWhatsAppSent(params: {
  clientId: number;
  phoneNumber: string;
  message: string;
  performedByUserId?: number;
}): Promise<void> {
  await logClientActivity({
    clientId: params.clientId,
    actionType: 'WHATSAPP_SENT',
    description: `تم إرسال رسالة واتساب إلى ${params.phoneNumber}`,
    meta: {
      phoneNumber: params.phoneNumber,
      message: params.message,
    },
    performedByUserId: params.performedByUserId,
  });
}

/**
 * Log note addition activity
 */
export async function logNoteAdded(params: {
  clientId: number;
  noteId: number;
  notePreview: string;
  performedByUserId?: number;
}): Promise<void> {
  await logClientActivity({
    clientId: params.clientId,
    actionType: 'NOTE_ADD',
    description: `تم إضافة ملاحظة: ${params.notePreview.substring(0, 100)}${params.notePreview.length > 100 ? '...' : ''}`,
    meta: {
      noteId: params.noteId,
      notePreview: params.notePreview.substring(0, 500),
    },
    performedByUserId: params.performedByUserId,
  });
}

/**
 * Get client activity logs
 */
export async function getClientActivityLogs(clientId: number, limit = 50) {
  try {
    const logs = await dbGetClientActivityLogs(clientId, limit);
    return logs;
  } catch (error) {
    logger.error('Failed to get client activity logs', {
      clientId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
