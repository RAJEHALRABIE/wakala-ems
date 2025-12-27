function extractCoordinates(url) {
  if (!url) return null;
  
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { latitude: lat, longitude: lng };
      }
    }
  }
  return null;
}

// Test with common Google Maps URL formats
const testUrls = [
  "https://maps.google.com/?q=24.7136,46.6753",
  "https://www.google.com/maps/@24.7136,46.6753,15z",
  "https://goo.gl/maps/abc123",
  "https://maps.app.goo.gl/xyz789",
  "https://www.google.com/maps/place/24.7136,46.6753",
  "https://www.google.com/maps/place/Riyadh/@24.7136,46.6753,12z",
  "https://maps.google.com/maps?ll=24.7136,46.6753",
  "https://www.google.com/maps/dir//24.7136,46.6753",
];

console.log("Testing coordinate extraction:\n");
testUrls.forEach(url => {
  const result = extractCoordinates(url);
  console.log(`URL: ${url.substring(0, 50)}...`);
  console.log(`Result: ${result ? JSON.stringify(result) : "NULL ❌"}\n`);
});
