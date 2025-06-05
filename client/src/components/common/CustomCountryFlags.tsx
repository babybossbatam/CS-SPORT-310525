
import React from 'react';

interface CountryFlagColors {
  background: string;
  accent: string;
  center: string;
  highlight?: string;
}

// Authentic country flag designs
const createFranceFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="21.33" height="64" fill="#002654"/>
  <rect x="21.33" y="0" width="21.34" height="64" fill="#FFFFFF"/>
  <rect x="42.67" y="0" width="21.33" height="64" fill="#ED2939"/>
`;

const createGermanyFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="21.33" fill="#000000"/>
  <rect x="0" y="21.33" width="64" height="21.34" fill="#DD0000"/>
  <rect x="0" y="42.67" width="64" height="21.33" fill="#FFCE00"/>
`;

const createItalyFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="21.33" height="64" fill="#009246"/>
  <rect x="21.33" y="0" width="21.34" height="64" fill="#FFFFFF"/>
  <rect x="42.67" y="0" width="21.33" height="64" fill="#CE2B37"/>
`;

const createSpainFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="16" fill="#AA151B"/>
  <rect x="0" y="16" width="64" height="32" fill="#F1BF00"/>
  <rect x="0" y="48" width="64" height="16" fill="#AA151B"/>
`;

const createNetherlandsFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="21.33" fill="#21468B"/>
  <rect x="0" y="21.33" width="64" height="21.34" fill="#FFFFFF"/>
  <rect x="0" y="42.67" width="64" height="21.33" fill="#AE1C28"/>
`;

const createBrazilFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#009739"/>
  <polygon points="32,12 52,32 32,52 12,32" fill="#FEDD00"/>
  <circle cx="32" cy="32" r="8" fill="#002776"/>
`;

const createArgentinaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="21.33" fill="#74ACDF"/>
  <rect x="0" y="21.33" width="64" height="21.34" fill="#FFFFFF"/>
  <rect x="0" y="42.67" width="64" height="21.33" fill="#74ACDF"/>
  <circle cx="32" cy="32" r="6" fill="none" stroke="#FCBF49" stroke-width="1"/>
`;

const createUSAFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#B22234"/>
  <rect x="0" y="4.9" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="14.7" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="24.5" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="34.3" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="44.1" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="53.9" width="64" height="4.9" fill="#FFFFFF"/>
  <rect x="0" y="0" width="25.6" height="34.3" fill="#3C3B6E"/>
`;

const createUKFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#012169"/>
  <polygon points="0,0 64,0 64,26.67 37.33,26.67 0,0" fill="#FFFFFF"/>
  <polygon points="0,64 26.67,64 64,37.33 64,64 0,64" fill="#FFFFFF"/>
  <polygon points="64,0 64,26.67 26.67,64 0,64 0,37.33 37.33,0 64,0" fill="#FFFFFF"/>
  <line x1="0" y1="0" x2="64" y2="64" stroke="#C8102E" stroke-width="4"/>
  <line x1="64" y1="0" x2="0" y2="64" stroke="#C8102E" stroke-width="4"/>
  <line x1="32" y1="0" x2="32" y2="64" stroke="#FFFFFF" stroke-width="10.67"/>
  <line x1="0" y1="32" x2="64" y2="32" stroke="#FFFFFF" stroke-width="10.67"/>
  <line x1="32" y1="0" x2="32" y2="64" stroke="#C8102E" stroke-width="6.4"/>
  <line x1="0" y1="32" x2="64" y2="32" stroke="#C8102E" stroke-width="6.4"/>
`;

const createCanadaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="16" height="64" fill="#FF0000"/>
  <rect x="16" y="0" width="32" height="64" fill="#FFFFFF"/>
  <rect x="48" y="0" width="16" height="64" fill="#FF0000"/>
  <polygon points="32,20 34,26 40,26 35,30 37,36 32,32 27,36 29,30 24,26 30,26" fill="#FF0000"/>
`;

const createJapanFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#FFFFFF"/>
  <circle cx="32" cy="32" r="12.8" fill="#BC002D"/>
`;

const createChinaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#DE2910"/>
  <polygon points="16,12 18,18 24,18 19.5,22 21.5,28 16,24 10.5,28 12.5,22 8,18 14,18" fill="#FFDE00"/>
`;

const createMexicoFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="21.33" height="64" fill="#006847"/>
  <rect x="21.33" y="0" width="21.34" height="64" fill="#FFFFFF"/>
  <rect x="42.67" y="0" width="21.33" height="64" fill="#CE1126"/>
`;

const createRussiaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="21.33" fill="#FFFFFF"/>
  <rect x="0" y="21.33" width="64" height="21.34" fill="#0039A6"/>
  <rect x="0" y="42.67" width="64" height="21.33" fill="#D52B1E"/>
`;

const createIndiaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="21.33" fill="#FF9933"/>
  <rect x="0" y="21.33" width="64" height="21.34" fill="#FFFFFF"/>
  <rect x="0" y="42.67" width="64" height="21.33" fill="#138808"/>
  <circle cx="32" cy="32" r="6" fill="none" stroke="#000080" stroke-width="1"/>
`;

const createAustraliaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#012169"/>
  <rect x="0" y="0" width="32" height="32" fill="#012169"/>
  <polygon points="0,0 32,0 32,10.67 12.44,10.67 0,0" fill="#FFFFFF"/>
  <polygon points="0,32 10.67,32 32,21.33 32,32 0,32" fill="#FFFFFF"/>
  <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" stroke-width="2"/>
  <line x1="32" y1="0" x2="0" y2="32" stroke="#C8102E" stroke-width="2"/>
  <line x1="16" y1="0" x2="16" y2="32" stroke="#FFFFFF" stroke-width="5.33"/>
  <line x1="0" y1="16" x2="32" y2="16" stroke="#FFFFFF" stroke-width="5.33"/>
  <line x1="16" y1="0" x2="16" y2="32" stroke="#C8102E" stroke-width="3.2"/>
  <line x1="0" y1="16" x2="32" y2="16" stroke="#C8102E" stroke-width="3.2"/>
`;

const createSouthKoreaFlag = (uniqueId: string) => `
  <rect x="0" y="0" width="64" height="64" fill="#FFFFFF"/>
  <circle cx="32" cy="32" r="8" fill="#C60C30"/>
  <path d="M 32 24 A 8 8 0 0 0 32 40 A 4 4 0 0 1 32 32 A 4 4 0 0 0 32 24" fill="#003478"/>
`;

// Country-specific flag renderers
const countryFlagRenderers: Record<string, (uniqueId: string) => string> = {
  'France': createFranceFlag,
  'Germany': createGermanyFlag,
  'Italy': createItalyFlag,
  'Spain': createSpainFlag,
  'Netherlands': createNetherlandsFlag,
  'Brazil': createBrazilFlag,
  'Argentina': createArgentinaFlag,
  'United States': createUSAFlag,
  'USA': createUSAFlag,
  'United Kingdom': createUKFlag,
  'UK': createUKFlag,
  'England': createUKFlag,
  'Canada': createCanadaFlag,
  'Japan': createJapanFlag,
  'China': createChinaFlag,
  'Mexico': createMexicoFlag,
  'Russia': createRussiaFlag,
  'India': createIndiaFlag,
  'Australia': createAustraliaFlag,
  'South Korea': createSouthKoreaFlag,
  'South-Korea': createSouthKoreaFlag,
};

// Fallback color scheme for unmapped countries
const getDefaultColors = (countryName: string): CountryFlagColors => {
  const hash = countryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080'
  ];
  
  return {
    background: colors[Math.abs(hash) % colors.length],
    accent: colors[Math.abs(hash + 1) % colors.length],
    center: colors[Math.abs(hash + 2) % colors.length]
  };
};

// Generic flag template for unmapped countries
const createGenericFlag = (colors: CountryFlagColors, uniqueId: string) => `
  <rect width="64" height="64" fill="${colors.background}"/>
  <polygon points="32,8 60,32 32,56 4,32" fill="${colors.accent}"/>
  <ellipse cx="32" cy="32" rx="16" ry="16" fill="${colors.center}"/>
`;

interface CustomCountryFlagProps {
  country: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const CustomCountryFlag: React.FC<CustomCountryFlagProps> = ({ 
  country, 
  size = 64, 
  className = '',
  onClick 
}) => {
  const uniqueId = `flag-${country.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Check if we have a specific flag renderer for this country
  const flagRenderer = countryFlagRenderers[country];
  
  let flagContent;
  if (flagRenderer) {
    // Use authentic flag design
    flagContent = flagRenderer(uniqueId);
  } else {
    // Use generic template with country-specific colors
    const colors = getDefaultColors(country);
    flagContent = createGenericFlag(colors, uniqueId);
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64"
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <defs>
        <clipPath id={`circleView-${uniqueId}`}>
          <circle cx="32" cy="32" r="32"/>
        </clipPath>
      </defs>
      <g clipPath={`url(#circleView-${uniqueId})`}>
        {/* Parse and inject the flag content */}
        <g dangerouslySetInnerHTML={{ __html: flagContent }} />
      </g>
      {/* Glossy effect */}
      <ellipse cx="32" cy="20" rx="22" ry="10" fill="white" opacity="0.2"/>
    </svg>
  );
};

export default CustomCountryFlag;

// Export a function to get all available countries
export const getAllSupportedCountries = (): string[] => {
  return Object.keys(countryFlagRenderers);
};

// Export function to check if a country has a custom design
export const hasCustomFlag = (country: string): boolean => {
  return country in countryFlagRenderers;
};
