/**
 * Color Extractor Utility
 * Uses dominant color extraction algorithm to generate team color palettes
 */

// Simple color mapping for common team names
export const teamColorMap: Record<string, { primary: string, secondary: string, accent: string }> = {
  // Premier League
  'manchester united': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(198, 22, 36)' },
  'manchester city': { primary: 'from-sky-600', secondary: 'to-sky-400', accent: 'rgb(108, 171, 221)' },
  'liverpool': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(200, 16, 46)' },
  'chelsea': { primary: 'from-blue-700', secondary: 'to-blue-500', accent: 'rgb(3, 70, 148)' },
  'arsenal': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(239, 1, 7)' },
  'tottenham': { primary: 'from-indigo-900', secondary: 'to-indigo-700', accent: 'rgb(19, 34, 87)' },
  
  // La Liga
  'barcelona': { primary: 'from-blue-700', secondary: 'to-red-700', accent: 'rgb(165, 0, 80)' },
  'real madrid': { primary: 'from-blue-600', secondary: 'to-blue-400', accent: 'rgb(54, 116, 191)' },
  'atletico madrid': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(193, 2, 48)' },
  
  // Serie A
  'juventus': { primary: 'from-purple-700', secondary: 'to-purple-500', accent: 'rgb(0, 0, 0)' },
  'ac milan': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(198, 12, 48)' },
  'inter': { primary: 'from-blue-800', secondary: 'to-blue-600', accent: 'rgb(0, 51, 153)' },
  
  // Bundesliga
  'bayern': { primary: 'from-red-700', secondary: 'to-red-500', accent: 'rgb(220, 5, 45)' },
  'dortmund': { primary: 'from-yellow-500', secondary: 'to-yellow-300', accent: 'rgb(247, 173, 0)' },
  
  // Ligue 1
  'paris': { primary: 'from-blue-800', secondary: 'to-blue-600', accent: 'rgb(0, 36, 125)' },
  
  // Default gradient
  'default': { primary: 'from-blue-700', secondary: 'to-blue-500', accent: 'rgb(59, 130, 246)' }
};

// Type for RGB color
interface RGB {
  r: number;
  g: number;
  b: number;
}

// Calculate luminance of a color (for contrast)
function calculateLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
}

// Convert hex to RGB
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Check if color is too dark, too light, or is black/white
function isValidColor(rgb: RGB): boolean {
  const { r, g, b } = rgb;
  const luminance = calculateLuminance(rgb);
  
  // Check if it's too close to black or white
  const isNearBlack = r < 30 && g < 30 && b < 30;
  const isNearWhite = r > 225 && g > 225 && b > 225;
  
  // Check if it's grayscale (all RGB values are very close)
  const isGrayscale = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
  
  // Valid colors: not too dark, not too light, not black/white, and not grayscale
  return luminance > 0.1 && luminance < 0.9 && !isNearBlack && !isNearWhite && !isGrayscale;
}

// Extract vibrant color from RGB
function enhanceColor(rgb: RGB): RGB {
  const { r, g, b } = rgb;
  const luminance = calculateLuminance(rgb);
  
  // Ensure color is vibrant enough
  let enhancedR = r;
  let enhancedG = g;
  let enhancedB = b;
  
  // If color is too dark, brighten it
  if (luminance < 0.3) {
    const factor = 0.3 / luminance;
    enhancedR = Math.min(255, r * factor);
    enhancedG = Math.min(255, g * factor);
    enhancedB = Math.min(255, b * factor);
  }
  
  // Increase saturation for more vibrant colors
  const max = Math.max(enhancedR, enhancedG, enhancedB);
  const satFactor = 1.2; // Saturation increase
  
  enhancedR = enhancedR + (max - enhancedR) * (1 - satFactor);
  enhancedG = enhancedG + (max - enhancedG) * (1 - satFactor);
  enhancedB = enhancedB + (max - enhancedB) * (1 - satFactor);
  
  return {
    r: Math.round(Math.max(0, Math.min(255, enhancedR))),
    g: Math.round(Math.max(0, Math.min(255, enhancedG))),
    b: Math.round(Math.max(0, Math.min(255, enhancedB))),
  };
}

// Convert RGB to CSS color string
function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

// Generate a secondary color that complements the primary
function generateComplementaryColor(primary: RGB): RGB {
  // Simple complementary color (opposite on color wheel)
  return {
    r: 255 - primary.r,
    g: 255 - primary.g,
    b: 255 - primary.b,
  };
}

// Store extracted colors in cache to avoid redundant computation
const colorCache: Record<string, { primary: string, secondary: string }> = {};

/**
 * Get tailwind gradient classes based on team name
 */
export function getTeamGradient(teamName: string, direction: 'to-r' | 'to-l' = 'to-r'): string {
  // Special case for teams with black and white colors
  if (
    teamName.toLowerCase().includes('juventus') ||
    teamName.toLowerCase().includes('newcastle') ||
    teamName.toLowerCase().includes('fulham') 
  ) {
    return `bg-gradient-${direction} from-purple-700 to-purple-500`;
  }
  
  // Check if we have cached the result
  if (colorCache[teamName]) {
    return `bg-gradient-${direction} ${colorCache[teamName].primary} ${colorCache[teamName].secondary}`;
  }
  
  // Try to find an exact match in our predefined map
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    const colors = teamColorMap[exactMatch];
    // Cache the result
    colorCache[teamName] = { 
      primary: colors.primary, 
      secondary: colors.secondary 
    };
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Get colors based on team name (deterministic but with visual variety)
  // This creates a stable hash from the team name
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a hue value between 0-360 based on the hash
  const hue = Math.abs(hash) % 360;
  
  // Get two adjacent hues for a nice gradient
  const primaryHue = hue;
  const secondaryHue = (hue + 30) % 360; // Slightly offset for complementary feel
  
  // Map to the closest tailwind color classes
  const primary = getTailwindColorFromHue(primaryHue, 600);
  const secondary = getTailwindColorFromHue(secondaryHue, 500);
  
  // Cache the result
  colorCache[teamName] = { primary, secondary };
  
  return `bg-gradient-${direction} ${primary} ${secondary}`;
}

/**
 * Maps a hue value (0-360) to the closest Tailwind color class
 */
function getTailwindColorFromHue(hue: number, intensity: number): string {
  // Map hue ranges to tailwind color families
  if (hue >= 0 && hue < 20) return `from-red-${intensity}`;
  if (hue >= 20 && hue < 40) return `from-orange-${intensity}`;
  if (hue >= 40 && hue < 65) return `from-amber-${intensity}`;
  if (hue >= 65 && hue < 80) return `from-yellow-${intensity}`;
  if (hue >= 80 && hue < 140) return `from-green-${intensity}`;
  if (hue >= 140 && hue < 170) return `from-emerald-${intensity}`;
  if (hue >= 170 && hue < 195) return `from-teal-${intensity}`;
  if (hue >= 195 && hue < 220) return `from-cyan-${intensity}`;
  if (hue >= 220 && hue < 255) return `from-blue-${intensity}`;
  if (hue >= 255 && hue < 270) return `from-indigo-${intensity}`;
  if (hue >= 270 && hue < 295) return `from-purple-${intensity}`;
  if (hue >= 295 && hue < 335) return `from-pink-${intensity}`;
  return `from-rose-${intensity}`;
}

// Cache for solid colors
const solidColorCache: Record<string, string> = {};

/**
 * Get a solid CSS color for a team (for charts, accents, etc.)
 */
export function getTeamColor(teamName: string): string {
  // Check cache first
  if (solidColorCache[teamName]) {
    return solidColorCache[teamName];
  }
  
  // Try predefined map
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    const color = teamColorMap[exactMatch].accent;
    solidColorCache[teamName] = color;
    return color;
  }
  
  // Generate dynamic color based on team name hash (same algorithm as gradient)
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Create a vibrant RGB color
  const saturation = 80; // 0-100
  const lightness = 45;  // 0-100
  
  // Convert HSL to RGB
  const color = hslToRgb(hue, saturation, lightness);
  solidColorCache[teamName] = color;
  
  return color;
}

/**
 * Convert HSL values to RGB string
 */
function hslToRgb(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate contrast text color based on background
 */
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'text-white';
  
  const luminance = calculateLuminance(rgb);
  return luminance > 0.5 ? 'text-gray-900' : 'text-white';
}