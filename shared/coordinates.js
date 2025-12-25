/**
 * Extract coordinates from various Google Maps URL formats
 * استخراج الإحداثيات من روابط خرائط جوجل المختلفة
 */
/**
 * Check if URL is a shortened Google Maps link
 * التحقق من كون الرابط مختصراً
 */
export function isShortUrl(url) {
    return /goo\.gl|maps\.app\.goo\.gl|bit\.ly|tinyurl/i.test(url);
}
export function extractCoordinates(url) {
    if (!url)
        return null;
    // Warn about shortened URLs (they need server-side expansion)
    if (isShortUrl(url)) {
        console.warn('[Coordinates] Shortened URL detected. Please use full Google Maps URL with coordinates.');
        // Still try to extract in case coordinates are somehow present
    }
    const patterns = [
        // Standard formats
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @24.7136,46.6753
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3d24.7136!4d46.6753
        /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=24.7136,46.6753
        /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=24.7136,46.6753
        /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/, // place/24.7136,46.6753
        /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // center=24.7136,46.6753
        // Additional formats
        /destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // destination=24.7136,46.6753
        /origin=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // origin=24.7136,46.6753
        /dir\/(-?\d+\.?\d*),(-?\d+\.?\d*)/, // dir/24.7136,46.6753
        /search\/(-?\d+\.?\d*),(-?\d+\.?\d*)/, // search/24.7136,46.6753
        /data=.*!3d(-?\d+\.?\d*).*!4d(-?\d+\.?\d*)/, // data=...!3d24.7136...!4d46.6753
        // Generic (last resort - any coordinate-like pattern)
        /(-?\d{1,3}\.\d{4,8})[,\s]+(-?\d{1,3}\.\d{4,8})/, // 24.7136, 46.6753
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            // Validate coordinates are within valid ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Additional check: Saudi Arabia is roughly between lat 16-32, lng 34-56
                // But we don't enforce this to allow flexibility
                return { latitude: lat, longitude: lng };
            }
        }
    }
    return null;
}
/**
 * Parse direct coordinate input (manual entry)
 * تحليل الإحداثيات المدخلة يدوياً
 */
export function parseDirectCoordinates(input) {
    if (!input)
        return null;
    // Clean the input
    const cleaned = input.trim().replace(/\s+/g, ' ');
    // Try to match: "24.7136, 46.6753" or "24.7136 46.6753"
    const match = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { latitude: lat, longitude: lng };
        }
    }
    return null;
}
/**
 * Format coordinates for display
 * تنسيق الإحداثيات للعرض
 */
export function formatCoordinates(coords) {
    if (!coords)
        return "";
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}
/**
 * Check if coordinates are valid
 * التحقق من صحة الإحداثيات
 */
export function isValidCoordinates(lat, lng) {
    if (lat === null || lat === undefined || lng === null || lng === undefined)
        return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
