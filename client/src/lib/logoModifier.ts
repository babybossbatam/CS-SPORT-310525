
/**
 * Logo Modifier Utility
 * Applies custom SVG styling to original logos while preserving their identity
 */

interface CustomLogoStyle {
  baseColor: string;
  accentColor: string;
  overlayOpacity: number;
  pattern: 'diamond' | 'circle' | 'geometric';
}

// Default style based on your custom flags
const DEFAULT_STYLE: CustomLogoStyle = {
  baseColor: '#3EAE46',
  accentColor: '#FFCC29',
  overlayOpacity: 0.6,
  pattern: 'diamond'
};

// Country-specific color schemes
const COUNTRY_COLOR_SCHEMES: { [key: string]: Partial<CustomLogoStyle> } = {
  'Germany': { baseColor: '#000000', accentColor: '#FFD700' },
  'Brazil': { baseColor: '#009B3A', accentColor: '#FFDF00' },
  'France': { baseColor: '#0055A4', accentColor: '#FFFFFF' },
  'Spain': { baseColor: '#C60B1E', accentColor: '#FFC400' },
  'England': { baseColor: '#012169', accentColor: '#FFFFFF' },
  'Italy': { baseColor: '#009246', accentColor: '#FFFFFF' },
  'Portugal': { baseColor: '#006600', accentColor: '#FF0000' },
  'Netherlands': { baseColor: '#FF4F00', accentColor: '#FFFFFF' },
  'Argentina': { baseColor: '#74ACDF', accentColor: '#FFFFFF' },
  'Croatia': { baseColor: '#FF0000', accentColor: '#FFFFFF' },
  'Poland': { baseColor: '#FFFFFF', accentColor: '#DC143C' },
  'Belgium': { baseColor: '#000000', accentColor: '#FFCD00' },
  'Switzerland': { baseColor: '#FF0000', accentColor: '#FFFFFF' },
  'Denmark': { baseColor: '#C60C30', accentColor: '#FFFFFF' },
  'Austria': { baseColor: '#ED2939', accentColor: '#FFFFFF' },
  'Turkey': { baseColor: '#E30A17', accentColor: '#FFFFFF' },
  'Ukraine': { baseColor: '#0057B7', accentColor: '#FFD700' },
  'Wales': { baseColor: '#00A651', accentColor: '#FFFFFF' },
  'Scotland': { baseColor: '#005EB8', accentColor: '#FFFFFF' },
  'Czech Republic': { baseColor: '#11457E', accentColor: '#FFFFFF' },
  'United States': { baseColor: '#B22234', accentColor: '#FFFFFF' },
  'USA': { baseColor: '#B22234', accentColor: '#FFFFFF' },
};

/**
 * Generate SVG overlay pattern based on custom style
 */
export const generateCustomOverlay = (
  style: CustomLogoStyle = DEFAULT_STYLE,
  size: number = 64
): string => {
  const centerX = size / 2;
  const centerY = size / 2;
  
  switch (style.pattern) {
    case 'diamond':
      return `
        <defs>
          <clipPath id="circleClip">
            <circle cx="${centerX}" cy="${centerY}" r="${size / 2}"/>
          </clipPath>
        </defs>
        <g clip-path="url(#circleClip)">
          <rect width="${size}" height="${size}" fill="${style.baseColor}"/>
          <polygon points="${centerX},${size * 0.125} ${size * 0.9375},${centerY} ${centerX},${size * 0.875} ${size * 0.0625},${centerY}" 
                   fill="${style.accentColor}" opacity="${style.overlayOpacity}"/>
          <ellipse cx="${centerX}" cy="${centerY}" rx="${size * 0.25}" ry="${size * 0.25}" 
                   fill="#3E4095" opacity="0.8"/>
          <!-- Glossy effect -->
          <ellipse cx="${centerX}" cy="${size * 0.3125}" rx="${size * 0.34375}" ry="${size * 0.15625}" 
                   fill="white" opacity="0.2"/>
        </g>
      `;
    
    case 'circle':
      return `
        <defs>
          <clipPath id="circleClip">
            <circle cx="${centerX}" cy="${centerY}" r="${size / 2}"/>
          </clipPath>
        </defs>
        <g clip-path="url(#circleClip)">
          <circle cx="${centerX}" cy="${centerY}" r="${size / 2}" fill="${style.baseColor}"/>
          <circle cx="${centerX}" cy="${centerY}" r="${size * 0.375}" 
                  fill="${style.accentColor}" opacity="${style.overlayOpacity}"/>
          <circle cx="${centerX}" cy="${centerY}" r="${size * 0.1875}" 
                  fill="#3E4095" opacity="0.8"/>
          <ellipse cx="${centerX}" cy="${size * 0.3125}" rx="${size * 0.34375}" ry="${size * 0.15625}" 
                   fill="white" opacity="0.2"/>
        </g>
      `;
    
    case 'geometric':
    default:
      return `
        <defs>
          <clipPath id="circleClip">
            <circle cx="${centerX}" cy="${centerY}" r="${size / 2}"/>
          </clipPath>
        </defs>
        <g clip-path="url(#circleClip)">
          <rect width="${size}" height="${size}" fill="${style.baseColor}"/>
          <polygon points="${centerX},${size * 0.125} ${size * 0.9375},${centerY} ${centerX},${size * 0.875} ${size * 0.0625},${centerY}" 
                   fill="${style.accentColor}" opacity="${style.overlayOpacity}"/>
          <ellipse cx="${centerX}" cy="${centerY}" rx="${size * 0.25}" ry="${size * 0.25}" 
                   fill="#3E4095" opacity="0.8"/>
          <ellipse cx="${centerX}" cy="${size * 0.3125}" rx="${size * 0.34375}" ry="${size * 0.15625}" 
                   fill="white" opacity="0.2"/>
        </g>
      `;
  }
};

/**
 * Create custom styled logo URL that combines original logo with custom overlay
 */
export const createCustomStyledLogo = (
  originalLogoUrl: string,
  countryName?: string,
  teamName?: string,
  size: number = 64
): string => {
  // Get country-specific color scheme
  const colorScheme = countryName ? COUNTRY_COLOR_SCHEMES[countryName] : {};
  const style: CustomLogoStyle = { ...DEFAULT_STYLE, ...colorScheme };
  
  // Generate the custom overlay
  const overlay = generateCustomOverlay(style, size);
  
  // Create composite SVG
  const compositeSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="logoClip">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}"/>
        </clipPath>
      </defs>
      
      <!-- Original logo as background -->
      <foreignObject x="0" y="0" width="${size}" height="${size}" clip-path="url(#logoClip)">
        <img src="${originalLogoUrl}" width="${size}" height="${size}" 
             style="object-fit: cover; opacity: 0.7;" 
             xmlns="http://www.w3.org/1999/xhtml"/>
      </foreignObject>
      
      <!-- Custom overlay -->
      ${overlay}
    </svg>
  `;
  
  // Convert to data URL
  return `data:image/svg+xml;base64,${btoa(compositeSvg)}`;
};

/**
 * Get custom styled logo for national teams and clubs
 */
export const getCustomStyledTeamLogo = (
  team: any,
  league: any,
  originalLogoUrl: string,
  size: number = 36
): string => {
  // Check if it's a national team
  const isNational = league?.name?.toLowerCase().includes('nations league') ||
                    league?.name?.toLowerCase().includes('international') ||
                    league?.name?.toLowerCase().includes('friendlies') ||
                    league?.name?.toLowerCase().includes('world cup') ||
                    league?.country === 'World' ||
                    league?.country === 'Europe';
  
  if (isNational) {
    return createCustomStyledLogo(originalLogoUrl, team.name, team.name, size);
  }
  
  // For club teams, use a subtler overlay
  const clubStyle: CustomLogoStyle = {
    ...DEFAULT_STYLE,
    overlayOpacity: 0.3,
    pattern: 'circle'
  };
  
  const overlay = generateCustomOverlay(clubStyle, size);
  
  const compositeSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="logoClip">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}"/>
        </clipPath>
      </defs>
      
      <!-- Original logo -->
      <foreignObject x="0" y="0" width="${size}" height="${size}" clip-path="url(#logoClip)">
        <img src="${originalLogoUrl}" width="${size}" height="${size}" 
             style="object-fit: cover;" 
             xmlns="http://www.w3.org/1999/xhtml"/>
      </foreignObject>
      
      <!-- Subtle overlay for clubs -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" 
              fill="${DEFAULT_STYLE.baseColor}" opacity="0.1"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(compositeSvg)}`;
};
