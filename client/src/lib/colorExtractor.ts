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

// Check if color is too dark or too light
function isValidColor(rgb: RGB): boolean {
  const luminance = calculateLuminance(rgb);
  return luminance > 0.1 && luminance < 0.9;
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
  
  // Try to find an exact match
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    const colors = teamColorMap[exactMatch];
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Default fallback based on team name first character
  const firstChar = teamName.charAt(0).toLowerCase();
  if ('abc'.includes(firstChar)) {
    return `bg-gradient-${direction} from-red-700 to-red-500`;
  } else if ('def'.includes(firstChar)) {
    return `bg-gradient-${direction} from-blue-700 to-blue-500`;
  } else if ('ghi'.includes(firstChar)) {
    return `bg-gradient-${direction} from-green-700 to-green-500`;
  } else if ('jkl'.includes(firstChar)) {
    return `bg-gradient-${direction} from-purple-700 to-purple-500`;
  } else if ('mno'.includes(firstChar)) {
    return `bg-gradient-${direction} from-yellow-600 to-yellow-400`;
  } else if ('pqr'.includes(firstChar)) {
    return `bg-gradient-${direction} from-orange-600 to-orange-400`;
  } else if ('stu'.includes(firstChar)) {
    return `bg-gradient-${direction} from-indigo-600 to-indigo-400`;
  } else {
    return `bg-gradient-${direction} from-cyan-600 to-cyan-400`;
  }
}

/**
 * Get a solid CSS color for a team (for charts, accents, etc.)
 */
export function getTeamColor(teamName: string): string {
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatch) {
    return teamColorMap[exactMatch].accent;
  }
  
  // Default fallback
  return 'rgb(59, 130, 246)'; // blue
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