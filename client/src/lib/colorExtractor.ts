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
  
  // South American Teams
  'sportivo': { primary: 'from-yellow-600', secondary: 'to-red-600', accent: 'rgb(204, 85, 0)' },
  'sportivo trinidense': { primary: 'from-red-600', secondary: 'to-yellow-500', accent: 'rgb(204, 85, 0)' },
  'sportivo luqueño': { primary: 'from-blue-500', secondary: 'to-yellow-500', accent: 'rgb(0, 85, 184)' },
  'sportivo belgrano': { primary: 'from-green-600', secondary: 'to-white', accent: 'rgb(0, 102, 51)' },
  'flamengo': { primary: 'from-red-700', secondary: 'to-black', accent: 'rgb(157, 0, 0)' },
  'palmeiras': { primary: 'from-green-700', secondary: 'to-green-500', accent: 'rgb(0, 102, 37)' },
  'santos': { primary: 'from-white', secondary: 'to-black', accent: 'rgb(0, 0, 0)' },
  'corinthians': { primary: 'from-black', secondary: 'to-white', accent: 'rgb(0, 0, 0)' },
  'gremio': { primary: 'from-blue-700', secondary: 'to-blue-500', accent: 'rgb(25, 63, 121)' },
  'river plate': { primary: 'from-red-600', secondary: 'to-white', accent: 'rgb(209, 36, 33)' },
  'boca juniors': { primary: 'from-blue-600', secondary: 'to-yellow-500', accent: 'rgb(0, 34, 104)' },
  
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
 * Get an enhanced version of the team color with 10% more intensity
 * This is specifically for home teams to make their colors more prominent
 */
export function getEnhancedHomeTeamGradient(teamName: string, direction: 'to-r' | 'to-l' = 'to-r'): string {
  // Extract the regular gradient classes
  const regularGradient = getTeamGradient(teamName, direction);
  
  // Parse out the color classes
  const fromMatch = regularGradient.match(/from-([a-z]+-[0-9]+)/);
  const toMatch = regularGradient.match(/to-([a-z]+-[0-9]+)/);
  
  if (!fromMatch || !toMatch) return regularGradient; // Fallback if can't parse
  
  const fromClass = fromMatch[1];
  const toClass = toMatch[1];
  
  // Extract color name and intensity number
  const [fromColor, fromIntensity] = fromClass.split('-');
  const [toColor, toIntensity] = toClass.split('-');
  
  // Increase intensity by approx 10% (going 100 points higher in tailwind scale if possible)
  // For example, from-red-500 becomes from-red-600
  const enhancedFromIntensity = Math.min(900, parseInt(fromIntensity) + 100);
  // Make secondary color slightly more intense too
  const enhancedToIntensity = Math.min(900, parseInt(toIntensity) + 50);
  
  // Build enhanced gradient
  return direction === 'to-r'
    ? `bg-gradient-to-r from-${fromColor}-${enhancedFromIntensity} to-${toColor}-${enhancedToIntensity}`
    : `bg-gradient-to-l from-${toColor}-${enhancedToIntensity} to-${fromColor}-${enhancedFromIntensity}`;
}

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
    return direction === 'to-r'
      ? 'bg-gradient-to-r from-purple-700 to-purple-500'
      : 'bg-gradient-to-l from-purple-500 to-purple-700';
  }
  
  // Check if we have cached the result
  if (colorCache[teamName]) {
    const { primary, secondary } = colorCache[teamName];
    // Extract the color values without the from-/to- prefixes
    const primaryColor = primary.replace('from-', '');
    const secondaryColor = secondary.replace('to-', '');
    
    return direction === 'to-r'
      ? `bg-gradient-to-r from-${primaryColor} to-${secondaryColor}`
      : `bg-gradient-to-l from-${secondaryColor} to-${primaryColor}`;
  }
  
  // Try to find an exact match in our predefined map
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    const colors = teamColorMap[exactMatch];
    // Extract the color values without the from-/to- prefixes
    const primaryColor = colors.primary.replace('from-', '');
    const secondaryColor = colors.secondary.replace('to-', '');
    
    // Cache the result without prefixes
    colorCache[teamName] = { 
      primary: primaryColor, 
      secondary: secondaryColor 
    };
    
    return direction === 'to-r'
      ? `bg-gradient-to-r from-${primaryColor} to-${secondaryColor}`
      : `bg-gradient-to-l from-${secondaryColor} to-${primaryColor}`;
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
  
  // Map to the closest tailwind color classes (without from-/to- prefixes)
  const primaryClass = getTailwindColorFromHue(primaryHue, 600);
  const secondaryClass = getTailwindColorFromHue(secondaryHue, 500);
  
  // Extract colors without prefixes
  const primaryColor = primaryClass.replace('from-', '');
  const secondaryColor = secondaryClass.replace('to-', '');
  
  // Cache the result without prefixes
  colorCache[teamName] = { primary: primaryColor, secondary: secondaryColor };
  
  return direction === 'to-r'
    ? `bg-gradient-to-r from-${primaryColor} to-${secondaryColor}`
    : `bg-gradient-to-l from-${secondaryColor} to-${primaryColor}`;
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

// Cache for solid colors and team color pairings
const solidColorCache: Record<string, string> = {};
const opposingTeamColors: Record<string, string> = {};

/**
 * Ensure the second team gets a different color compared to the first team
 */
export function getOpposingTeamColor(homeTeam: string, awayTeam: string): string {
  const homeColor = getTeamColor(homeTeam);
  
  // Create a unique key for the pairing
  const pairingKey = `${homeTeam}-${awayTeam}`;
  
  // Check if we already calculated an opposing color
  if (opposingTeamColors[pairingKey]) {
    return opposingTeamColors[pairingKey];
  }
  
  // Get the base color for away team
  let awayColor = getTeamColor(awayTeam);
  
  // Convert colors to RGB objects
  const homeRgb = parseRgb(homeColor);
  const awayRgb = parseRgb(awayColor);
  
  // If colors are too similar, generate a clearly different one
  if (colorSimilarity(homeRgb, awayRgb) > 75) {
    // Create a complementary color to ensure difference
    const hue = extractHue(homeRgb);
    const oppositeHue = (hue + 180) % 360; // opposite on color wheel
    
    // Create a new color with opposite hue but similar saturation/lightness
    awayColor = hslToRgb(oppositeHue, 80, 45);
  }
  
  // Cache the result
  opposingTeamColors[pairingKey] = awayColor;
  return awayColor;
}

/**
 * Extract the approximate hue from RGB values
 */
function extractHue(rgb: RGB): number {
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) return 0;
  
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  return hue;
}

/**
 * Parse RGB string into RGB object
 */
function parseRgb(rgbStr: string): RGB {
  const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10)
  };
}

/**
 * Calculate color similarity percentage between two RGB colors
 * Higher value = more similar
 */
function colorSimilarity(color1: RGB, color2: RGB): number {
  const rDiff = Math.abs(color1.r - color2.r);
  const gDiff = Math.abs(color1.g - color2.g);
  const bDiff = Math.abs(color1.b - color2.b);
  
  // Max difference would be 255 for each channel
  const maxDiff = 255 * 3;
  const actualDiff = rDiff + gDiff + bDiff;
  
  // Convert to a similarity percentage
  return 100 - (actualDiff * 100 / maxDiff);
}

/**
 * Get a solid CSS color for a team (for charts, accents, etc.)
 * @param teamName - The team name
 * @param enhance - Optional. If true, makes color 10% more intense for home teams
 */
export function getTeamColor(teamName: string, enhance = false): string {
  // Create cache key that includes enhancement info
  const cacheKey = enhance ? `${teamName}_enhanced` : teamName;
  
  // Check cache first
  if (solidColorCache[cacheKey]) {
    return solidColorCache[cacheKey];
  }
  
  // Try predefined map
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    const color = teamColorMap[exactMatch].accent;
    // Apply strong enhancement for home teams if requested - make colors much more vibrant
    if (enhance) {
      const rgb = parseRgb(color);
      // Make colors more saturated and vibrant by increasing contrast
      const enhancedRgb = {
        r: Math.min(255, Math.round(rgb.r * 0.75)), // Make notably darker for more saturation
        g: Math.min(255, Math.round(rgb.g * 0.75)), 
        b: Math.min(255, Math.round(rgb.b * 0.75))
      };
      
      // Find dominant color channel and boost it slightly to increase vibrancy
      const maxChannel = Math.max(rgb.r, rgb.g, rgb.b);
      if (maxChannel === rgb.r) enhancedRgb.r = Math.min(255, Math.round(enhancedRgb.r * 1.4));
      if (maxChannel === rgb.g) enhancedRgb.g = Math.min(255, Math.round(enhancedRgb.g * 1.4));
      if (maxChannel === rgb.b) enhancedRgb.b = Math.min(255, Math.round(enhancedRgb.b * 1.4));
      
      const enhancedColor = `rgb(${enhancedRgb.r}, ${enhancedRgb.g}, ${enhancedRgb.b})`;
      solidColorCache[cacheKey] = enhancedColor;
      return enhancedColor;
    }
    
    solidColorCache[cacheKey] = color;
    return color;
  }
  
  // Generate dynamic color based on team name hash (same algorithm as gradient)
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Create a vibrant RGB color with much more intensity
  const saturation = enhance ? 100 : 90; // 0-100, higher saturation for more vivid colors
  const lightness = enhance ? 35 : 40;   // 0-100, darker for more intense colors
  
  // Convert HSL to RGB
  const color = hslToRgb(hue, saturation, lightness);
  solidColorCache[cacheKey] = color;
  
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