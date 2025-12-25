/**
 * Utility functions for agency date calculations and validation
 */

import { Client } from "../../drizzle/schema.js";

/** دالة تحويل مركزية لكل التواريخ */
function toValidDate(
  input: Date | string | number | null | undefined,
): Date | null {
  if (input == null) return null;

  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate remaining days until agency end date
 * Returns null if agencyEndDate is missing or invalid
 */
export function calculateAgencyStatus(
  client: Pick<Client, "agencyEndDate">,
): {
  remainingDays: number | null;
  status: "VALID" | "EXPIRED" | "MISSING";
  message: string;
} {
  const endDate = toValidDate(client.agencyEndDate);

  if (!endDate) {
    return {
      remainingDays: null,
      status: "MISSING",
      message: "تاريخ انتهاء الوكالة غير موجود أو غير صالح",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (remainingDays < 0) {
    return {
      remainingDays,
      status: "EXPIRED",
      message: `انتهت الوكالة منذ ${Math.abs(remainingDays)} يوم`,
    };
  }

  return {
    remainingDays,
    status: "VALID",
    message: `متبقي ${remainingDays} يوم حتى انتهاء الوكالة`,
  };
}

/**
 * Calculate agency end date based on issue date and duration
 * Returns null if missing required fields
 */
export function calculateAgencyEndDate(
  agencyIssueDate?: Date | string | number | null,
  agencyDurationDays?: number | null,
): Date | null {
  if (!agencyIssueDate || !agencyDurationDays) {
    return null;
  }

  const issueDate = toValidDate(agencyIssueDate);
  if (!issueDate || agencyDurationDays <= 0) {
    return null;
  }

  const endDate = new Date(issueDate);
  endDate.setDate(endDate.getDate() + agencyDurationDays);

  return endDate;
}

/**
 * Format phone number to WhatsApp format (9665XXXXXXXX)
 * Returns null if number cannot be formatted
 */
export function formatWhatsAppNumber(
  phoneNumber: string | null | undefined,
): string | null {
  if (!phoneNumber) {
    return null;
  }

  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (digitsOnly.startsWith("966") && digitsOnly.length === 12) {
    return digitsOnly;
  }

  if (digitsOnly.startsWith("05") && digitsOnly.length === 10) {
    return "966" + digitsOnly.substring(1);
  }

  if (digitsOnly.startsWith("5") && digitsOnly.length === 9) {
    return "966" + digitsOnly;
  }

  if (digitsOnly.length === 12) {
    return digitsOnly;
  }

  if (digitsOnly.length === 10 && digitsOnly.startsWith("05")) {
    return "966" + digitsOnly.substring(1);
  }

  return null;
}

/**
 * Validate agency dates and calculate end date if possible
 */
export function validateAndCalculateAgencyDates(
  agencyIssueDate?: Date | string | number | null,
  agencyDurationDays?: number | null,
  agencyEndDate?: Date | string | number | null,
): {
  agencyEndDate: Date | null;
  calculatedEndDate: Date | null;
  isValid: boolean;
  messages: string[];
} {
  const messages: string[] = [];
  let isValid = true;

  const calculatedEndDate = calculateAgencyEndDate(
    agencyIssueDate,
    agencyDurationDays,
  );

  let finalEndDate = toValidDate(agencyEndDate);

  if (agencyEndDate && !finalEndDate) {
    messages.push("تاريخ انتهاء الوكالة المقدم غير صالح");
  }

  if (calculatedEndDate && finalEndDate) {
    const calculatedStr = calculatedEndDate.toISOString().split("T")[0];
    const finalStr = finalEndDate.toISOString().split("T")[0];

    if (calculatedStr !== finalStr) {
      messages.push("تناقض بين تاريخ انتهاء الوكالة المحسوب والمقدم");
      isValid = false;
    }
  }

  if (!finalEndDate && calculatedEndDate) {
    finalEndDate = calculatedEndDate;
    messages.push("تم حساب تاريخ انتهاء الوكالة تلقائياً");
  }

  if (agencyIssueDate) {
    const issueDate = toValidDate(agencyIssueDate);
    if (!issueDate) {
      messages.push("تاريخ إصدار الوكالة غير صالح");
      isValid = false;
    } else if (issueDate > new Date()) {
      messages.push("تاريخ إصدار الوكالة في المستقبل");
      isValid = false;
    }
  }

  if (agencyDurationDays !== undefined && agencyDurationDays !== null) {
    if (agencyDurationDays <= 0) {
      messages.push("مدة الوكالة يجب أن تكون أكبر من صفر");
      isValid = false;
    }
    if (agencyDurationDays > 3650) {
      messages.push("مدة الوكالة طويلة جداً (الحد الأقصى 10 سنوات)");
      isValid = false;
    }
  }

  return {
    agencyEndDate: finalEndDate,
    calculatedEndDate,
    isValid,
    messages,
  };
}

/**
 * Get agency status summary for display
 */
export function getAgencyStatusSummary(
  client: Pick<
    Client,
    "agencyIssueDate" | "agencyDurationDays" | "agencyEndDate"
  >,
): {
  status: string;
  daysRemaining: number | null;
  endDate: Date | null;
  issueDate: Date | null;
  durationDays: number | null;
  isValid: boolean;
  warnings: string[];
} {
  const validation = validateAndCalculateAgencyDates(
    client.agencyIssueDate,
    client.agencyDurationDays,
    client.agencyEndDate,
  );

  const statusCheck = calculateAgencyStatus({
    agencyEndDate: validation.agencyEndDate,
  });

  const warnings = [...validation.messages];
  if (statusCheck.status === "EXPIRED") {
    warnings.push(statusCheck.message);
  }

  return {
    status: statusCheck.status,
    daysRemaining: statusCheck.remainingDays,
    endDate: validation.agencyEndDate,
    issueDate: toValidDate(client.agencyIssueDate),
    durationDays: client.agencyDurationDays ?? null,
    isValid: validation.isValid && statusCheck.status !== "EXPIRED",
    warnings,
  };
}
