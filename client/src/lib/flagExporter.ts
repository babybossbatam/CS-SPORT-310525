
import { countryCodeMap } from './flagUtils';

// Country-specific color schemes (same as in CustomCountryFlags.tsx)
const countryColorSchemes: Record<string, any> = {
  // Europe
  'England': { background: '#FFFFFF', accent: '#FF0000', center: '#FF0000' },
  'Scotland': { background: '#005EB8', accent: '#FFFFFF', center: '#005EB8' },
  'Wales': { background: '#00B04F', accent: '#FFFFFF', center: '#FF0000' },
  'Northern Ireland': { background: '#FFFFFF', accent: '#FF0000', center: '#005EB8' },
  'Spain': { background: '#FFD700', accent: '#FF0000', center: '#FF0000' },
  'Germany': { background: '#000000', accent: '#FFD700', center: '#FF0000' },
  'France': { background: '#002654', accent: '#FFFFFF', center: '#FF0000' },
  'Italy': { background: '#009246', accent: '#FFFFFF', center: '#CE2B37' },
  'Netherlands': { background: '#FF0000', accent: '#FFFFFF', center: '#002654' },
  'Portugal': { background: '#006600', accent: '#FFD700', center: '#FF0000' },
  'Belgium': { background: '#000000', accent: '#FFD700', center: '#FF0000' },
  'Turkey': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Switzerland': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Austria': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Denmark': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Sweden': { background: '#005B99', accent: '#FFD700', center: '#005B99' },
  'Norway': { background: '#FF0000', accent: '#FFFFFF', center: '#002654' },
  'Poland': { background: '#FFFFFF', accent: '#FF0000', center: '#FF0000' },
  'Czech Republic': { background: '#FFFFFF', accent: '#FF0000', center: '#11457E' },
  'Croatia': { background: '#FF0000', accent: '#FFFFFF', center: '#171796' },
  'Serbia': { background: '#FF0000', accent: '#FFFFFF', center: '#0C4076' },
  'Greece': { background: '#004C98', accent: '#FFFFFF', center: '#004C98' },
  'Ukraine': { background: '#005BBB', accent: '#FFD500', center: '#005BBB' },
  'Russia': { background: '#FFFFFF', accent: '#0039A6', center: '#D52B1E' },

  // South America
  'Brazil': { background: '#009739', accent: '#FEDD00', center: '#002776' },
  'Argentina': { background: '#74ACDF', accent: '#FFFFFF', center: '#FCBF49' },
  'Colombia': { background: '#FFCD00', accent: '#003893', center: '#CE1126' },
  'Peru': { background: '#FFFFFF', accent: '#FF0000', center: '#FF0000' },
  'Chile': { background: '#0039A6', accent: '#FFFFFF', center: '#FF0000' },
  'Uruguay': { background: '#FFFFFF', accent: '#0038A8', center: '#FCBF49' },
  'Paraguay': { background: '#FF0000', accent: '#FFFFFF', center: '#0038A8' },
  'Bolivia': { background: '#FF0000', accent: '#FFCD00', center: '#007A33' },
  'Ecuador': { background: '#FFCD00', accent: '#0072CE', center: '#FF0000' },
  'Venezuela': { background: '#FFCD00', accent: '#00247D', center: '#CF142B' },

  // North America
  'United States': { background: '#FF0000', accent: '#FFFFFF', center: '#002868' },
  'USA': { background: '#FF0000', accent: '#FFFFFF', center: '#002868' },
  'Canada': { background: '#FFFFFF', accent: '#FF0000', center: '#FF0000' },
  'Mexico': { background: '#006847', accent: '#FFFFFF', center: '#CE1126' },
  'Costa Rica': { background: '#002B7F', accent: '#FFFFFF', center: '#CE1126' },
  'Panama': { background: '#FFFFFF', accent: '#FF0000', center: '#0033A0' },

  // Asia
  'Japan': { background: '#FFFFFF', accent: '#BC002D', center: '#BC002D' },
  'South Korea': { background: '#FFFFFF', accent: '#FF0000', center: '#0047A0' },
  'China': { background: '#DE2910', accent: '#FFDE00', center: '#FFDE00' },
  'India': { background: '#FF9933', accent: '#FFFFFF', center: '#138808' },
  'Thailand': { background: '#FF0000', accent: '#FFFFFF', center: '#241D4F' },
  'Vietnam': { background: '#DA020E', accent: '#FFFF00', center: '#DA020E' },
  'Indonesia': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Malaysia': { background: '#FF0000', accent: '#FFFFFF', center: '#010066' },
  'Singapore': { background: '#FF0000', accent: '#FFFFFF', center: '#FF0000' },
  'Philippines': { background: '#0038A8', accent: '#FFFFFF', center: '#CE1126' },

  // Africa
  'Egypt': { background: '#FF0000', accent: '#FFFFFF', center: '#000000' },
  'Nigeria': { background: '#008751', accent: '#FFFFFF', center: '#008751' },
  'South Africa': { background: '#007A4D', accent: '#FFFFFF', center: '#DE3831' },
  'Morocco': { background: '#C1272D', accent: '#006233', center: '#C1272D' },
  'Algeria': { background: '#006233', accent: '#FFFFFF', center: '#D21034' },
  'Tunisia': { background: '#E70013', accent: '#FFFFFF', center: '#E70013' },
  'Ghana': { background: '#FF0000', accent: '#FFCD00', center: '#006B3F' },
  'Kenya': { background: '#000000', accent: '#FF0000', center: '#FFFFFF' },

  // Oceania
  'Australia': { background: '#012169', accent: '#FFFFFF', center: '#FF0000' },
  'New Zealand': { background: '#012169', accent: '#FFFFFF', center: '#FF0000' },

  // Special cases
  'World': { background: '#3EAE46', accent: '#FFCC29', center: '#3E4095' },
  'Europe': { background: '#003399', accent: '#FFCC00', center: '#003399' },
};

// Generate SVG content for a country
export const generateCountrySVG = (country: string, size: number = 64): string => {
  const colors = countryColorSchemes[country] || {
    background: '#CCCCCC',
    accent: '#666666',
    center: '#333333'
  };

  const uniqueId = `flag-${country.toLowerCase().replace(/\s+/g, '-')}`;

  let specialPatterns = '';
  
  // Add country-specific patterns
  if (country === 'United States' || country === 'USA') {
    specialPatterns = `
      <rect x="0" y="0" width="64" height="8" fill="#FFFFFF"/>
      <rect x="0" y="16" width="64" height="8" fill="#FFFFFF"/>
      <rect x="0" y="32" width="64" height="8" fill="#FFFFFF"/>
      <rect x="0" y="48" width="64" height="8" fill="#FFFFFF"/>
      <rect x="0" y="0" width="28" height="36" fill="#002868"/>
    `;
  } else if (country === 'United Kingdom' || country === 'UK') {
    specialPatterns = `
      <line x1="0" y1="0" x2="64" y2="64" stroke="#FFFFFF" stroke-width="4"/>
      <line x1="64" y1="0" x2="0" y2="64" stroke="#FFFFFF" stroke-width="4"/>
      <line x1="32" y1="0" x2="32" y2="64" stroke="#FFFFFF" stroke-width="8"/>
      <line x1="0" y1="32" x2="64" y2="32" stroke="#FFFFFF" stroke-width="8"/>
    `;
  } else if (country === 'Canada') {
    specialPatterns = `
      <polygon points="32,16 36,24 44,24 38,30 40,38 32,34 24,38 26,30 20,24 28,24" fill="#FF0000"/>
    `;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleView-${uniqueId}">
      <circle cx="32" cy="32" r="32"/>
    </clipPath>
  </defs>
  <g clip-path="url(#circleView-${uniqueId})">
    <rect width="64" height="64" fill="${colors.background}"/>
    <polygon points="32,8 60,32 32,56 4,32" fill="${colors.accent}"/>
    <ellipse cx="32" cy="32" rx="16" ry="16" fill="${colors.center}"/>
    ${specialPatterns}
  </g>
  <!-- Glossy effect -->
  <ellipse cx="32" cy="20" rx="22" ry="10" fill="white" opacity="0.2"/>
</svg>`;
};

// Export all country flags as downloadable files
export const exportAllCountryFlags = (): void => {
  const allCountries = Object.keys(countryCodeMap);
  
  allCountries.forEach(country => {
    const svgContent = generateCountrySVG(country);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${country.toLowerCase().replace(/\s+/g, '-')}-flag.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
  
  console.log(`Exported ${allCountries.length} custom SVG flags`);
};

// Export a single country flag
export const exportSingleCountryFlag = (country: string): void => {
  const svgContent = generateCountrySVG(country);
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${country.toLowerCase().replace(/\s+/g, '-')}-flag.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`Exported custom SVG flag for ${country}`);
};

// Get SVG as data URL for immediate use
export const getCountryFlagDataURL = (country: string): string => {
  const svgContent = generateCountrySVG(country);
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Create a directory of all supported countries
export const getSupportedCountries = (): string[] => {
  return Object.keys(countryCodeMap);
};

// Generate a preview of all flags (for testing)
export const generateFlagPreview = (): string => {
  const countries = Object.keys(countryColorSchemes).slice(0, 20); // First 20 for demo
  let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px; padding: 20px;">';
  
  countries.forEach(country => {
    const svgContent = generateCountrySVG(country, 48);
    html += `
      <div style="text-align: center; margin: 10px;">
        ${svgContent}
        <div style="font-size: 12px; margin-top: 5px;">${country}</div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
};
