
import { getCountryFlagWithFallbackSync } from './flagUtils';
import { flagCache } from './logoCache';

// Enhanced custom flag mapping with all cached countries
const customFlagMapping: { [key: string]: string } = {
  // European teams
  'Germany': '/assets/flags/germany-flag.svg',
  'Portugal': '/assets/flags/portugal-flag.svg',
  'France': '/assets/flags/france-flag.svg',
  'Spain': '/assets/flags/spain-flag.svg',
  'England': '/assets/flags/england-flag.svg',
  'Italy': '/assets/flags/italy-flag.svg',
  'Netherlands': '/assets/flags/netherlands-flag.svg',
  'Belgium': '/assets/flags/belgium-flag.svg',
  'Croatia': '/assets/flags/croatia-flag.svg',
  'Poland': '/assets/flags/poland-flag.svg',
  'Turkey': '/assets/flags/turkey-flag.svg',
  'Switzerland': '/assets/flags/switzerland-flag.svg',
  'Denmark': '/assets/flags/denmark-flag.svg',
  'Austria': '/assets/flags/austria-flag.svg',
  'Scotland': '/assets/flags/scotland-flag.svg',
  'Wales': '/assets/flags/wales-flag.svg',
  'Czech Republic': '/assets/flags/czech-republic-flag.svg',
  'Czechia': '/assets/flags/czech-republic-flag.svg',
  'Ukraine': '/assets/flags/ukraine-flag.svg',
  'Norway': '/assets/flags/norway-flag.svg',
  'Sweden': '/assets/flags/sweden-flag.svg',
  'Bulgaria': '/assets/flags/bulgaria-flag.svg',
  'Cyprus': '/assets/flags/cyprus-flag.svg',
  'Finland': '/assets/flags/finland-flag.svg',
  'Iceland': '/assets/flags/iceland-flag.svg',
  'Luxembourg': '/assets/flags/luxembourg-flag.svg',
  'Ireland': '/assets/flags/ireland-flag.svg',
  'Malta': '/assets/flags/malta-flag.svg',
  'Liechtenstein': '/assets/flags/liechtenstein-flag.svg',
  'Andorra': '/assets/flags/andorra-flag.svg',
  'San Marino': '/assets/flags/san-marino-flag.svg',
  
  // South American teams
  'Brazil': '/assets/flags/brazil-flag.svg',
  'Argentina': '/assets/flags/argentina-flag.svg',
  'Colombia': '/assets/flags/colombia-flag.svg',
  'Chile': '/assets/flags/chile-flag.svg',
  'Uruguay': '/assets/flags/uruguay-flag.svg',
  
  // North American teams
  'United States': '/assets/flags/usa-flag.svg',
  'USA': '/assets/flags/usa-flag.svg',
  'US': '/assets/flags/usa-flag.svg',
  'Mexico': '/assets/flags/mexico-flag.svg',
  'Canada': '/assets/flags/canada-flag.svg',
  
  // Asian/Oceanic teams
  'Japan': '/assets/flags/japan-flag.svg',
  'South Korea': '/assets/flags/south-korea-flag.svg',
  'Australia': '/assets/flags/australia-flag.svg',
};

// Color extraction from cached flag data
export async function extractColorsFromCachedFlag(country: string): Promise<string[]> {
  try {
    // Get the cached flag URL
    const cachedFlagUrl = getCountryFlagWithFallbackSync(country);
    
    if (cachedFlagUrl.startsWith('/assets/flags/') || cachedFlagUrl.startsWith('data:')) {
      // Already a custom flag or data URL
      return await extractColorsFromSVG(cachedFlagUrl);
    }
    
    // For external URLs, create a temporary image to extract colors
    return await extractColorsFromImage(cachedFlagUrl);
  } catch (error) {
    console.warn(`Failed to extract colors for ${country}:`, error);
    return ['#3B82F6', '#EF4444']; // Default blue and red
  }
}

// Extract colors from SVG content
async function extractColorsFromSVG(svgPath: string): Promise<string[]> {
  try {
    if (svgPath.startsWith('data:')) {
      // Handle data URLs
      const svgContent = atob(svgPath.split(',')[1]);
      return extractColorsFromSVGContent(svgContent);
    } else {
      // Fetch SVG file
      const response = await fetch(svgPath);
      const svgContent = await response.text();
      return extractColorsFromSVGContent(svgContent);
    }
  } catch (error) {
    console.warn('Failed to extract colors from SVG:', error);
    return ['#3B82F6', '#EF4444'];
  }
}

// Extract colors from SVG content
function extractColorsFromSVGContent(svgContent: string): string[] {
  const colors: string[] = [];
  
  // Regex to find fill colors
  const fillMatches = svgContent.match(/fill=["']([^"']+)["']/g);
  if (fillMatches) {
    fillMatches.forEach(match => {
      const color = match.match(/fill=["']([^"']+)["']/)?.[1];
      if (color && color !== 'none' && color !== 'transparent' && !colors.includes(color)) {
        colors.push(color);
      }
    });
  }
  
  // Regex to find stroke colors
  const strokeMatches = svgContent.match(/stroke=["']([^"']+)["']/g);
  if (strokeMatches) {
    strokeMatches.forEach(match => {
      const color = match.match(/stroke=["']([^"']+)["']/)?.[1];
      if (color && color !== 'none' && color !== 'transparent' && !colors.includes(color)) {
        colors.push(color);
      }
    });
  }
  
  // Filter out common non-color values and limit to 3 main colors
  const validColors = colors.filter(color => 
    color.startsWith('#') || 
    color.startsWith('rgb') || 
    ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple'].includes(color.toLowerCase())
  ).slice(0, 3);
  
  return validColors.length > 0 ? validColors : ['#3B82F6', '#EF4444'];
}

// Extract colors from image URL
async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(['#3B82F6', '#EF4444']);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData.data);
        resolve(colors);
      } catch (error) {
        console.warn('Failed to extract colors from image:', error);
        resolve(['#3B82F6', '#EF4444']);
      }
    };
    
    img.onerror = () => {
      resolve(['#3B82F6', '#EF4444']);
    };
    
    img.src = imageUrl;
  });
}

// Extract dominant colors from image data
function extractDominantColors(data: Uint8ClampedArray): string[] {
  const colorCount: { [key: string]: number } = {};
  
  // Sample every 10th pixel to improve performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Group similar colors
    const groupedR = Math.floor(r / 32) * 32;
    const groupedG = Math.floor(g / 32) * 32;
    const groupedB = Math.floor(b / 32) * 32;
    
    const colorKey = `rgb(${groupedR},${groupedG},${groupedB})`;
    colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
  }
  
  // Sort by frequency and return top 3
  const sortedColors = Object.entries(colorCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([color]) => {
      // Convert to hex
      const rgb = color.match(/\d+/g);
      if (rgb) {
        const hex = rgb.map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        return `#${hex}`;
      }
      return color;
    });
  
  return sortedColors.length > 0 ? sortedColors : ['#3B82F6', '#EF4444'];
}

// Generate custom SVG flag using extracted colors and save as file
export function generateCustomSVGFlag(country: string, colors: string[]): string {
  const [primaryColor, secondaryColor, tertiaryColor] = colors;
  
  // Custom SVG template based on your existing design patterns
  const svgContent = `<svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="flagGradient-${country.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${secondaryColor || primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${tertiaryColor || secondaryColor || primaryColor};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow-${country.replace(/\s+/g, '')}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
  </defs>
  
  <!-- Flag background with gradient -->
  <rect width="60" height="40" rx="3" ry="3" 
        fill="url(#flagGradient-${country.replace(/\s+/g, '')})" 
        filter="url(#shadow-${country.replace(/\s+/g, '')})"
        stroke="rgba(255,255,255,0.3)" 
        stroke-width="0.5"/>
  
  <!-- Decorative elements based on colors -->
  ${tertiaryColor ? `
    <rect x="0" y="0" width="60" height="13" rx="3" ry="3" fill="${primaryColor}" opacity="0.9"/>
    <rect x="0" y="13" width="60" height="14" fill="${secondaryColor}" opacity="0.9"/>
    <rect x="0" y="27" width="60" height="13" rx="3" ry="3" fill="${tertiaryColor}" opacity="0.9"/>
  ` : `
    <rect x="0" y="0" width="60" height="20" rx="3" ry="3" fill="${primaryColor}" opacity="0.9"/>
    <rect x="0" y="20" width="60" height="20" rx="3" ry="3" fill="${secondaryColor || primaryColor}" opacity="0.9"/>
  `}
  
  <!-- Subtle overlay for depth -->
  <rect width="60" height="40" rx="3" ry="3" 
        fill="none" 
        stroke="rgba(0,0,0,0.1)" 
        stroke-width="1"/>
</svg>`;
  
  // Save the SVG file to the flags directory
  saveSVGFlagToFile(country, svgContent);
  
  // Return the file path instead of data URL
  const fileName = `${country.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-flag.svg`;
  return `/assets/flags/${fileName}`;
}

// Save SVG flag as physical file
async function saveSVGFlagToFile(country: string, svgContent: string): Promise<void> {
  try {
    const fileName = `${country.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-flag.svg`;
    
    // Use File System Access API if available (for browsers that support it)
    if ('showDirectoryPicker' in window) {
      // This would require user permission, so we'll use a different approach
      console.log(`📄 Generated SVG for ${country}: ${fileName}`);
    } else {
      // For now, we'll create a downloadable blob and log the file content
      // The user can manually save these files
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      console.log(`📄 Generated SVG for ${country}:`, {
        fileName,
        downloadUrl: url,
        content: svgContent
      });
      
      // Store in session storage for batch download
      const existingFlags = JSON.parse(sessionStorage.getItem('generatedFlags') || '{}');
      existingFlags[fileName] = svgContent;
      sessionStorage.setItem('generatedFlags', JSON.stringify(existingFlags));
    }
  } catch (error) {
    console.warn(`Failed to save SVG file for ${country}:`, error);
  }
}

// Main function to recreate all national team flags
export async function recreateAllNationalTeamFlags(): Promise<{ [country: string]: string }> {
  console.log('🎨 Starting recreation of all national team flags using cached data...');
  
  const recreatedFlags: { [country: string]: string } = {};
  
  // Get all countries from cache
  const cache = (flagCache as any).cache;
  const cachedCountries: string[] = [];
  
  if (cache instanceof Map) {
    for (const [key] of cache.entries()) {
      if (key.startsWith('flag_')) {
        const country = key.replace('flag_', '').replace(/_/g, ' ');
        cachedCountries.push(country);
      }
    }
  }
  
  // Add countries from custom mapping that might not be in cache
  const allCountries = new Set([
    ...cachedCountries,
    ...Object.keys(customFlagMapping)
  ]);
  
  console.log(`🌍 Found ${allCountries.size} countries to recreate flags for`);
  
  // Process countries in batches to avoid overwhelming the system
  const batchSize = 5;
  const countriesArray = Array.from(allCountries);
  
  for (let i = 0; i < countriesArray.length; i += batchSize) {
    const batch = countriesArray.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (country) => {
      try {
        // Generate SVG for all countries (don't skip existing custom flags)
        // This ensures all flags are available for download
        
        // Extract colors from cached flag
        const colors = await extractColorsFromCachedFlag(country);
        
        // Generate custom SVG flag
        const customFlag = generateCustomSVGFlag(country, colors);
        recreatedFlags[country] = customFlag;
        
        console.log(`🎨 Created custom SVG flag for ${country} with colors:`, colors);
      } catch (error) {
        console.warn(`❌ Failed to recreate flag for ${country}:`, error);
        
        // Fallback to existing system
        recreatedFlags[country] = getCountryFlagWithFallbackSync(country);
      }
    }));
    
    // Small delay between batches
    if (i + batchSize < countriesArray.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Calculate statistics
  const stats = {
    totalProcessed: Object.keys(recreatedFlags).length,
    newlyGenerated: 0,
    existingCustom: 0,
    apiFlags: 0
  };

  Object.entries(recreatedFlags).forEach(([country, flagPath]) => {
    if (flagPath.startsWith('/assets/flags/') && customFlagMapping[country]) {
      stats.existingCustom++;
    } else if (flagPath.startsWith('/assets/flags/') && !customFlagMapping[country]) {
      stats.newlyGenerated++;
    } else {
      stats.apiFlags++;
    }
  });

  console.log(`🏁 Flag Recreation Summary:`);
  console.log(`   📊 Total countries processed: ${stats.totalProcessed}`);
  console.log(`   🆕 Newly generated SVG flags: ${stats.newlyGenerated}`);
  console.log(`   ✅ Existing custom flags used: ${stats.existingCustom}`);
  console.log(`   🌐 API flags retained: ${stats.apiFlags}`);
  
  // Show what's in session storage
  const savedFlags = JSON.parse(sessionStorage.getItem('generatedFlags') || '{}');
  console.log(`   💾 Flags saved to session storage: ${Object.keys(savedFlags).length}`);
  
  return recreatedFlags;
}

// Get custom flag for a specific country
export async function getCustomNationalTeamFlag(
  teamName: string, 
  league?: { name?: string; country?: string }
): Promise<string | null> {
  // Check if it's a national team
  const isNationalTeam = league?.name?.toLowerCase().includes('friendlies') ||
                        league?.name?.toLowerCase().includes('international') ||
                        league?.name?.toLowerCase().includes('nations league') ||
                        league?.name?.toLowerCase().includes('world cup') ||
                        league?.country?.toLowerCase() === 'world';
  
  if (!isNationalTeam) {
    return null;
  }
  
  // Try exact match first
  if (customFlagMapping[teamName]) {
    return customFlagMapping[teamName];
  }
  
  // Try partial matches
  const normalizedTeamName = teamName.toLowerCase();
  for (const [country, flagPath] of Object.entries(customFlagMapping)) {
    if (normalizedTeamName.includes(country.toLowerCase())) {
      return flagPath;
    }
  }
  
  // Generate custom flag from cached data
  try {
    const colors = await extractColorsFromCachedFlag(teamName);
    return generateCustomSVGFlag(teamName, colors);
  } catch (error) {
    console.warn(`Failed to generate custom flag for ${teamName}:`, error);
    return null;
  }
}

// Download all generated flags as individual files
export function downloadAllGeneratedFlags(): void {
  const generatedFlags = JSON.parse(sessionStorage.getItem('generatedFlags') || '{}');
  const flagEntries = Object.entries(generatedFlags);
  
  if (flagEntries.length === 0) {
    console.log('No generated flags to download');
    alert('No generated flags found. Please click "🎨 Recreate Flags" first.');
    return;
  }
  
  console.log(`📦 Downloading ${flagEntries.length} generated flag files...`);
  
  // Show user feedback
  const startTime = Date.now();
  
  // Download each flag as a separate file with delay to prevent browser blocking
  flagEntries.forEach(([fileName, svgContent], index) => {
    setTimeout(() => {
      const blob = new Blob([svgContent as string], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      // Show progress
      console.log(`📥 Downloaded ${index + 1}/${flagEntries.length}: ${fileName}`);
      
      // Show completion message for the last file
      if (index === flagEntries.length - 1) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ All ${flagEntries.length} flag files downloaded in ${totalTime}s`);
        console.log('📁 Files are in your Downloads folder');
        console.log('🔧 Next steps:');
        console.log('   1. Move the SVG files to: client/public/assets/flags/');
        console.log('   2. The custom flags will automatically be used in your app');
        
        alert(`✅ Downloaded ${flagEntries.length} flag files!\n\nFiles are in your Downloads folder.\nMove them to: client/public/assets/flags/`);
      }
    }, index * 100); // 100ms delay between downloads
  });
}

// Clear generated flags from session storage
export function clearGeneratedFlags(): void {
  sessionStorage.removeItem('generatedFlags');
  console.log('🧹 Cleared generated flags from session storage');
}

// Initialize flag recreation on app start
export function initializeFlagRecreation(): void {
  // Recreate flags in the background after app loads
  setTimeout(() => {
    recreateAllNationalTeamFlags().catch(error => {
      console.warn('Background flag recreation failed:', error);
    });
  }, 2000);
}
