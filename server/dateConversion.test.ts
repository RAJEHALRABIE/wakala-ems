import { describe, expect, it } from "vitest";
import { 
  gregorianToHijri, 
  hijriToGregorian, 
  formatHijriDate,
  validateConversion,
  parseHijriString,
  toISODateString
} from "../shared/dateUtils";

describe("Date Conversion - Umm al-Qura Calendar", () => {
  
  describe("Gregorian to Hijri Conversion", () => {
    it("converts 1976-02-18 to 1396-02-18 correctly (validation test case)", () => {
      const gregorianDate = new Date(1976, 1, 18); // Feb 18, 1976
      const hijri = gregorianToHijri(gregorianDate);
      
      expect(hijri.year).toBe(1396);
      expect(hijri.month).toBe(2);
      expect(hijri.day).toBe(18);
    });

    it("converts current date without errors", () => {
      const now = new Date();
      const hijri = gregorianToHijri(now);
      
      expect(hijri.year).toBeGreaterThan(1400);
      expect(hijri.month).toBeGreaterThanOrEqual(1);
      expect(hijri.month).toBeLessThanOrEqual(12);
      expect(hijri.day).toBeGreaterThanOrEqual(1);
      expect(hijri.day).toBeLessThanOrEqual(30);
    });

    it("handles ISO date string input", () => {
      const hijri = gregorianToHijri("1976-02-18");
      
      expect(hijri.year).toBe(1396);
      expect(hijri.month).toBe(2);
      expect(hijri.day).toBe(18);
    });
  });

  describe("Hijri to Gregorian Conversion", () => {
    it("converts 1396-02-18 to 1976-02-18 correctly", () => {
      const gregorian = hijriToGregorian(1396, 2, 18);
      
      expect(gregorian.getFullYear()).toBe(1976);
      expect(gregorian.getMonth()).toBe(1); // February (0-indexed)
      expect(gregorian.getDate()).toBe(18);
    });

    it("round-trip conversion maintains accuracy", () => {
      const originalDate = new Date(1976, 1, 18);
      const hijri = gregorianToHijri(originalDate);
      const backToGregorian = hijriToGregorian(hijri.year, hijri.month, hijri.day);
      
      expect(backToGregorian.getFullYear()).toBe(originalDate.getFullYear());
      expect(backToGregorian.getMonth()).toBe(originalDate.getMonth());
      expect(backToGregorian.getDate()).toBe(originalDate.getDate());
    });
  });

  describe("Date Formatting", () => {
    it("formats Hijri date in short format", () => {
      const hijri = { year: 1396, month: 2, day: 18 };
      const formatted = formatHijriDate(hijri, 'short');
      
      expect(formatted).toBe("1396/02/18");
    });

    it("formats Hijri date in long format with Arabic month name", () => {
      const hijri = { year: 1396, month: 2, day: 18 };
      const formatted = formatHijriDate(hijri, 'long');
      
      expect(formatted).toBe("18 صفر 1396");
    });
  });

  describe("Parse Hijri String", () => {
    it("parses YYYY/MM/DD format", () => {
      const gregorian = parseHijriString("1396/02/18");
      
      expect(gregorian.getFullYear()).toBe(1976);
      expect(gregorian.getMonth()).toBe(1);
      expect(gregorian.getDate()).toBe(18);
    });

    it("parses YYYY-MM-DD format", () => {
      const gregorian = parseHijriString("1396-02-18");
      
      expect(gregorian.getFullYear()).toBe(1976);
      expect(gregorian.getMonth()).toBe(1);
      expect(gregorian.getDate()).toBe(18);
    });
  });

  describe("ISO Date String", () => {
    it("converts date to ISO format for database storage", () => {
      const date = new Date(1976, 1, 18);
      const iso = toISODateString(date);
      
      expect(iso).toBe("1976-02-18");
    });
  });

  describe("Validation Function", () => {
    it("validation test passes", () => {
      const result = validateConversion();
      
      expect(result.passed).toBe(true);
      expect(result.details).toContain("✓");
    });
  });

  describe("Additional Test Cases", () => {
    it("converts Ramadan 1, 1445 correctly", () => {
      // Ramadan 1, 1445 = March 11, 2024
      const gregorian = hijriToGregorian(1445, 9, 1);
      
      expect(gregorian.getFullYear()).toBe(2024);
      expect(gregorian.getMonth()).toBe(2); // March (0-indexed)
    });

    it("converts Eid al-Fitr 1445 correctly", () => {
      // Shawwal 1, 1445 = April 10, 2024
      const gregorian = hijriToGregorian(1445, 10, 1);
      
      expect(gregorian.getFullYear()).toBe(2024);
      expect(gregorian.getMonth()).toBe(3); // April (0-indexed)
    });
  });
});
