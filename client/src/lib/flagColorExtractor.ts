
import { flagCache } from './flagUtils';

interface FlagColors {
  primary: string;
  secondary: string;
  accent?: string;
}

/**
 * Extract dominant colors from cached flag URLs with enhanced support
 */
export async function extractColorsFromCachedFlag(country: string): Promise<FlagColors> {
  const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = flagCache.getCached(cacheKey);
  
  if (!cached?.url) {
    console.log(`No cached flag found for ${country}, using default colors`);
    return getDefaultCountryColors(country);
  }

  console.log(`Extracting colors from cached flag for ${country}: ${cached.url}`);

  try {
    // Skip already processed custom flags
    if (cached.url.startsWith('data:image/svg+xml') && cached.url.includes('flagGradient')) {
      console.log(`${country} already has custom SVG flag, using default colors for regeneration`);
      return getDefaultCountryColors(country);
    }

    // For SVG flags, we can parse common color patterns
    if (cached.url.includes('.svg')) {
      return await extractColorsFromSVG(cached.url, country);
    }
    
    // For PNG flags, use canvas-based color extraction
    if (cached.url.includes('.png') || cached.url.includes('.jpg') || cached.url.includes('.jpeg')) {
      return await extractColorsFromImage(cached.url, country);
    }

    // For data URLs or other formats
    if (cached.url.startsWith('data:')) {
      return await extractColorsFromDataURL(cached.url, country);
    }

    // Fallback to known country colors
    return getDefaultCountryColors(country);
  } catch (error) {
    console.warn(`Failed to extract colors from ${country} flag:`, error);
    return getDefaultCountryColors(country);
  }
}

/**
 * Extract colors from SVG flag URLs with enhanced parsing
 */
async function extractColorsFromSVG(svgUrl: string, country: string): Promise<FlagColors> {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    // Extract fill and stroke colors from SVG with improved regex
    const colorMatches = svgText.match(/(fill|stroke)="([^"]+)"/g) || [];
    const styleMatches = svgText.match(/fill:\s*([^;]+)/g) || [];
    const pathMatches = svgText.match(/fill="([^"]+)"/g) || [];
    
    const allMatches = [...colorMatches, ...styleMatches, ...pathMatches];
    
    const colors = allMatches
      .map(match => {
        const colorMatch = match.match(/"([^"]+)"/) || match.match(/:\s*([^;]+)/);
        return colorMatch?.[1];
      })
      .filter(color => color && color !== 'none' && color !== 'transparent' && color !== 'inherit')
      .filter(color => color.startsWith('#') || color.startsWith('rgb') || isNamedColor(color))
      .map(color => isNamedColor(color) ? namedColorToHex(color) : color)
      .filter((color, index, self) => self.indexOf(color) === index) // Remove duplicates
      .slice(0, 5); // Take first 5 unique colors

    if (colors.length >= 2) {
      return {
        primary: colors[0],
        secondary: colors[1],
        accent: colors[2]
      };
    }
  } catch (error) {
    console.warn(`Failed to extract SVG colors for ${country}:`, error);
  }

  return getDefaultCountryColors(country);
}

/**
 * Extract colors from data URLs
 */
async function extractColorsFromDataURL(dataUrl: string, country: string): Promise<FlagColors> {
  try {
    if (dataUrl.includes('svg+xml')) {
      // Decode SVG data URL
      const svgData = decodeURIComponent(dataUrl.split(',')[1]);
      
      const colorMatches = svgData.match(/(fill|stroke)="([^"]+)"/g) || [];
      const colors = colorMatches
        .map(match => match.match(/"([^"]+)"/)?.[1])
        .filter(color => color && color !== 'none' && color !== 'transparent')
        .filter(color => color.startsWith('#') || color.startsWith('rgb'))
        .slice(0, 3);

      if (colors.length >= 2) {
        return {
          primary: colors[0],
          secondary: colors[1],
          accent: colors[2]
        };
      }
    }
  } catch (error) {
    console.warn(`Failed to extract colors from data URL for ${country}:`, error);
  }

  return getDefaultCountryColors(country);
}

/**
 * Check if color is a named CSS color
 */
function isNamedColor(color: string): boolean {
  const namedColors = ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];
  return namedColors.includes(color.toLowerCase());
}

/**
 * Convert named color to hex
 */
function namedColorToHex(color: string): string {
  const namedColorMap: { [key: string]: string } = {
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'white': '#FFFFFF',
    'black': '#000000',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080'
  };
  
  return namedColorMap[color.toLowerCase()] || color;
}

/**
 * Extract colors from PNG/JPG flag images using canvas
 */
async function extractColorsFromImage(imageUrl: string, country: string): Promise<FlagColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(getDefaultCountryColors(country));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData.data);

        resolve({
          primary: colors[0] || '#FF0000',
          secondary: colors[1] || '#0000FF',
          accent: colors[2]
        });
      } catch (error) {
        console.warn(`Canvas extraction failed for ${country}:`, error);
        resolve(getDefaultCountryColors(country));
      }
    };

    img.onerror = () => {
      console.warn(`Failed to load image for ${country}:`, imageUrl);
      resolve(getDefaultCountryColors(country));
    };

    img.src = imageUrl;
  });
}

/**
 * Extract dominant colors from image data
 */
function extractDominantColors(imageData: Uint8ClampedArray): string[] {
  const colorCount: { [key: string]: number } = {};
  
  // Sample every 10th pixel to improve performance
  for (let i = 0; i < imageData.length; i += 40) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Group similar colors
    const colorKey = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
    colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
  }

  // Sort by frequency and convert to hex
  return Object.entries(colorCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });
}

/**
 * Generate custom SVG flag using extracted colors and our design template
 */
export function generateCustomSVGFlag(country: string, colors: FlagColors): string {
  const { primary, secondary, accent } = colors;
  const countryId = country.toLowerCase().replace(/\s+/g, '-');
  
  // Use our custom logo design template with enhanced design
  const customSVG = `
    <svg width="32" height="24" viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flagGradient-${countryId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${accent || secondary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="centerGradient-${countryId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${primary};stop-opacity:0.8" />
        </radialGradient>
        <filter id="shadow-${countryId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        <filter id="glow-${countryId}">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Flag background with enhanced gradient -->
      <rect x="1" y="1" width="30" height="22" rx="3" ry="3" 
            fill="url(#flagGradient-${countryId})" 
            stroke="${accent || secondary}" 
            stroke-width="0.5"
            filter="url(#shadow-${countryId})"/>
      
      <!-- Central emblem inspired by our custom logo with better design -->
      <circle cx="16" cy="12" r="7" fill="url(#centerGradient-${countryId})" opacity="0.9"/>
      <circle cx="16" cy="12" r="5" fill="${accent || primary}" opacity="0.7"/>
      <circle cx="16" cy="12" r="3" fill="${secondary}" opacity="0.9"/>
      <circle cx="16" cy="12" r="1.5" fill="${primary}" filter="url(#glow-${countryId})"/>
      
      <!-- Decorative elements around center -->
      <circle cx="10" cy="12" r="1" fill="${accent || secondary}" opacity="0.6"/>
      <circle cx="22" cy="12" r="1" fill="${accent || secondary}" opacity="0.6"/>
      <circle cx="16" cy="6" r="1" fill="${accent || secondary}" opacity="0.6"/>
      <circle cx="16" cy="18" r="1" fill="${accent || secondary}" opacity="0.6"/>
      
      <!-- Corner star-like accents -->
      <polygon points="6,4 7,6 9,6 7.5,7.5 8,10 6,8.5 4,10 4.5,7.5 3,6 5,6" 
               fill="${accent || secondary}" opacity="0.5" transform="scale(0.5)"/>
      <polygon points="26,4 27,6 29,6 27.5,7.5 28,10 26,8.5 24,10 24.5,7.5 23,6 25,6" 
               fill="${accent || secondary}" opacity="0.5" transform="scale(0.5)"/>
      <polygon points="6,18 7,20 9,20 7.5,21.5 8,24 6,22.5 4,24 4.5,21.5 3,20 5,20" 
               fill="${accent || secondary}" opacity="0.5" transform="scale(0.5)"/>
      <polygon points="26,18 27,20 29,20 27.5,21.5 28,24 26,22.5 24,24 24.5,21.5 23,20 25,20" 
               fill="${accent || secondary}" opacity="0.5" transform="scale(0.5)"/>
      
      <!-- Enhanced border with double line effect -->
      <rect x="1" y="1" width="30" height="22" rx="3" ry="3" 
            fill="none" 
            stroke="${primary}" 
            stroke-width="1" 
            opacity="0.9"/>
      <rect x="2" y="2" width="28" height="20" rx="2" ry="2" 
            fill="none" 
            stroke="${secondary}" 
            stroke-width="0.5" 
            opacity="0.6"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(customSVG)}`;
}

/**
 * Get default colors for known countries
 */
function getDefaultCountryColors(country: string): FlagColors {
  const countryColors: { [key: string]: FlagColors } = {
    // European countries
    'Germany': { primary: '#000000', secondary: '#DD0000', accent: '#FFCE00' },
    'France': { primary: '#0055A4', secondary: '#FFFFFF', accent: '#EF4135' },
    'England': { primary: '#CE1124', secondary: '#FFFFFF' },
    'Spain': { primary: '#AA151B', secondary: '#F1BF00' },
    'Italy': { primary: '#009246', secondary: '#FFFFFF', accent: '#CE2B37' },
    'Netherlands': { primary: '#21468B', secondary: '#FFFFFF', accent: '#AE1C28' },
    'Portugal': { primary: '#046A38', secondary: '#DA020E' },
    'Belgium': { primary: '#000000', secondary: '#FED100', accent: '#EF3340' },
    'Croatia': { primary: '#171796', secondary: '#FFFFFF', accent: '#DD0000' },
    'Poland': { primary: '#FFFFFF', secondary: '#DD0000' },
    'Turkey': { primary: '#E30A17', secondary: '#FFFFFF' },
    'Switzerland': { primary: '#DA020E', secondary: '#FFFFFF' },
    'Denmark': { primary: '#C60C30', secondary: '#FFFFFF' },
    'Austria': { primary: '#C8102E', secondary: '#FFFFFF' },
    'Scotland': { primary: '#0065BD', secondary: '#FFFFFF' },
    'Wales': { primary: '#00AB39', secondary: '#FFFFFF', accent: '#DD0000' },
    'Ukraine': { primary: '#0057B7', secondary: '#FFD700' },
    'Norway': { primary: '#BA0C2F', secondary: '#FFFFFF', accent: '#00205B' },
    'Sweden': { primary: '#004B87', secondary: '#FFCD00' },
    
    // South American countries
    'Brazil': { primary: '#009B3A', secondary: '#FEDF00', accent: '#002776' },
    'Argentina': { primary: '#74ACDF', secondary: '#FFFFFF', accent: '#F6B40E' },
    'Colombia': { primary: '#FCDD09', secondary: '#003893', accent: '#CE1126' },
    'Chile': { primary: '#0033A0', secondary: '#FFFFFF', accent: '#DA020E' },
    'Uruguay': { primary: '#0038A8', secondary: '#FFFFFF', accent: '#FFC72A' },
    
    // North American countries
    'United States': { primary: '#B22234', secondary: '#FFFFFF', accent: '#3C3B6E' },
    'USA': { primary: '#B22234', secondary: '#FFFFFF', accent: '#3C3B6E' },
    'Mexico': { primary: '#006847', secondary: '#FFFFFF', accent: '#CE1126' },
    'Canada': { primary: '#FF0000', secondary: '#FFFFFF' },
    
    // Asian/Oceanic countries
    'Japan': { primary: '#BC002D', secondary: '#FFFFFF' },
    'South Korea': { primary: '#003478', secondary: '#FFFFFF', accent: '#CD2E3A' },
    'Australia': { primary: '#012169', secondary: '#FFFFFF', accent: '#E4002B' },
  };

  return countryColors[country] || { primary: '#0066CC', secondary: '#FFFFFF', accent: '#FF6600' };
}

/**
 * Create custom flag for any country using cached flag data
 */
export async function createCustomFlagFromCache(country: string): Promise<string> {
  console.log(`Creating custom flag for ${country} using cached data`);
  
  try {
    const colors = await extractColorsFromCachedFlag(country);
    const customSVG = generateCustomSVGFlag(country, colors);
    
    console.log(`Generated custom flag for ${country} with colors:`, colors);
    return customSVG;
  } catch (error) {
    console.warn(`Failed to create custom flag for ${country}:`, error);
    
    // Fallback to default colors
    const defaultColors = getDefaultCountryColors(country);
    return generateCustomSVGFlag(country, defaultColors);
  }
}

/**
 * Recreate all national team flags using custom SVG design from cached data
 */
export async function recreateAllNationalTeamFlags(): Promise<{ [country: string]: string }> {
  console.log('🎨 Starting recreation of all national team flags with custom SVG design...');
  
  // Get all cached flags
  const cache = (flagCache as any).cache;
  if (!(cache instanceof Map)) {
    console.warn('Flag cache not available');
    return {};
  }

  const customFlags: { [country: string]: string } = {};
  const countries = Array.from(cache.keys())
    .filter(key => key.startsWith('flag_'))
    .map(key => key.replace('flag_', '').replace(/_/g, ' '))
    .filter(country => country !== 'world' && country !== 'europe'); // Skip special cases

  console.log(`🌍 Found ${countries.length} countries in cache to process`);

  // Process countries in batches to avoid overwhelming the browser
  const batchSize = 10;
  for (let i = 0; i < countries.length; i += batchSize) {
    const batch = countries.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(countries.length / batchSize)}: ${batch.join(', ')}`);

    const batchPromises = batch.map(async (country) => {
      try {
        const customFlag = await createCustomFlagFromCache(country);
        customFlags[country] = customFlag;
        
        // Update the cache with the new custom flag
        const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;
        flagCache.setCached(cacheKey, customFlag, 'custom-generated', true);
        
        console.log(`✅ Generated custom flag for ${country}`);
        return { country, success: true };
      } catch (error) {
        console.warn(`❌ Failed to generate custom flag for ${country}:`, error);
        return { country, success: false };
      }
    });

    await Promise.allSettled(batchPromises);

    // Small delay between batches to prevent browser blocking
    if (i + batchSize < countries.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const successCount = Object.keys(customFlags).length;
  console.log(`🎉 Completed! Generated ${successCount}/${countries.length} custom flags`);
  
  return customFlags;
}

/**
 * Generate custom flag for a specific country and save to cache
 */
export async function generateAndCacheCustomFlag(country: string): Promise<string> {
  try {
    const customFlag = await createCustomFlagFromCache(country);
    
    // Update the cache
    const cacheKey = `flag_${country.toLowerCase().replace(/\s+/g, '_')}`;
    flagCache.setCached(cacheKey, customFlag, 'custom-generated', true);
    
    console.log(`✅ Generated and cached custom flag for ${country}`);
    return customFlag;
  } catch (error) {
    console.warn(`❌ Failed to generate custom flag for ${country}:`, error);
    throw error;
  }
}
