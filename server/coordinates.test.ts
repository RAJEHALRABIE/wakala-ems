import { describe, it, expect } from "vitest";
import { extractCoordinates, formatCoordinates, isValidCoordinates } from "@shared/coordinates";

describe("extractCoordinates", () => {
  it("should extract coordinates from @lat,lng format", () => {
    const url = "https://www.google.com/maps/@24.7136,46.6753,15z";
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(24.7136, 4);
    expect(result?.longitude).toBeCloseTo(46.6753, 4);
  });

  it("should extract coordinates from q=lat,lng format", () => {
    const url = "https://maps.google.com/?q=24.7136,46.6753";
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(24.7136, 4);
    expect(result?.longitude).toBeCloseTo(46.6753, 4);
  });

  it("should extract coordinates from !3d!4d format", () => {
    const url = "https://www.google.com/maps/place/Riyadh/!3d24.7136!4d46.6753";
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(24.7136, 4);
    expect(result?.longitude).toBeCloseTo(46.6753, 4);
  });

  it("should extract coordinates from ll=lat,lng format", () => {
    const url = "https://maps.google.com/?ll=24.7136,46.6753";
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(24.7136, 4);
    expect(result?.longitude).toBeCloseTo(46.6753, 4);
  });

  it("should extract coordinates from place/lat,lng format", () => {
    const url = "https://www.google.com/maps/place/24.7136,46.6753";
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(24.7136, 4);
    expect(result?.longitude).toBeCloseTo(46.6753, 4);
  });

  it("should return null for invalid URL", () => {
    const url = "https://example.com/no-coordinates";
    const result = extractCoordinates(url);
    expect(result).toBeNull();
  });

  it("should return null for null input", () => {
    const result = extractCoordinates(null);
    expect(result).toBeNull();
  });

  it("should return null for undefined input", () => {
    const result = extractCoordinates(undefined);
    expect(result).toBeNull();
  });

  it("should reject invalid latitude (>90)", () => {
    const url = "https://maps.google.com/?q=100,46.6753";
    const result = extractCoordinates(url);
    expect(result).toBeNull();
  });

  it("should reject invalid longitude (>180)", () => {
    const url = "https://maps.google.com/?q=24.7136,200";
    const result = extractCoordinates(url);
    expect(result).toBeNull();
  });

  it("should handle negative coordinates", () => {
    const url = "https://maps.google.com/?q=-33.8688,151.2093"; // Sydney
    const result = extractCoordinates(url);
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(-33.8688, 4);
    expect(result?.longitude).toBeCloseTo(151.2093, 4);
  });
});

describe("formatCoordinates", () => {
  it("should format coordinates correctly", () => {
    const coords = { latitude: 24.7136, longitude: 46.6753 };
    const result = formatCoordinates(coords);
    expect(result).toBe("24.713600, 46.675300");
  });

  it("should return empty string for null", () => {
    const result = formatCoordinates(null);
    expect(result).toBe("");
  });
});

describe("isValidCoordinates", () => {
  it("should return true for valid coordinates", () => {
    expect(isValidCoordinates(24.7136, 46.6753)).toBe(true);
  });

  it("should return false for null latitude", () => {
    expect(isValidCoordinates(null, 46.6753)).toBe(false);
  });

  it("should return false for null longitude", () => {
    expect(isValidCoordinates(24.7136, null)).toBe(false);
  });

  it("should return false for out of range latitude", () => {
    expect(isValidCoordinates(100, 46.6753)).toBe(false);
  });

  it("should return false for out of range longitude", () => {
    expect(isValidCoordinates(24.7136, 200)).toBe(false);
  });
});
