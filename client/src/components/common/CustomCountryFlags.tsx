
import React from 'react';

interface CountryFlagColors {
  background: string;
  accent: string;
  center: string;
  highlight?: string;
}

// Country-specific color schemes based on actual flag colors
const countryColorSchemes: Record<string, CountryFlagColors> = {
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
  const colors = countryColorSchemes[country] || getDefaultColors(country);
  const uniqueId = `flag-${country.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;

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
        <rect width="64" height="64" fill={colors.background}/>
        <polygon points="32,8 60,32 32,56 4,32" fill={colors.accent}/>
        <ellipse cx="32" cy="32" rx="16" ry="16" fill={colors.center}/>
        {/* Country-specific pattern overlay */}
        {country === 'United States' || country === 'USA' ? (
          <>
            <rect x="0" y="0" width="64" height="8" fill="#FFFFFF"/>
            <rect x="0" y="16" width="64" height="8" fill="#FFFFFF"/>
            <rect x="0" y="32" width="64" height="8" fill="#FFFFFF"/>
            <rect x="0" y="48" width="64" height="8" fill="#FFFFFF"/>
            <rect x="0" y="0" width="28" height="36" fill="#002868"/>
          </>
        ) : country === 'United Kingdom' || country === 'UK' ? (
          <>
            <line x1="0" y1="0" x2="64" y2="64" stroke="#FFFFFF" strokeWidth="4"/>
            <line x1="64" y1="0" x2="0" y2="64" stroke="#FFFFFF" strokeWidth="4"/>
            <line x1="32" y1="0" x2="32" y2="64" stroke="#FFFFFF" strokeWidth="8"/>
            <line x1="0" y1="32" x2="64" y2="32" stroke="#FFFFFF" strokeWidth="8"/>
          </>
        ) : country === 'Canada' ? (
          <polygon points="32,16 36,24 44,24 38,30 40,38 32,34 24,38 26,30 20,24 28,24" fill="#FF0000"/>
        ) : null}
      </g>
      {/* Glossy effect */}
      <ellipse cx="32" cy="20" rx="22" ry="10" fill="white" opacity="0.2"/>
    </svg>
  );
};

export default CustomCountryFlag;

// Export a function to get all available countries
export const getAllSupportedCountries = (): string[] => {
  return Object.keys(countryColorSchemes);
};

// Export function to check if a country has a custom design
export const hasCustomFlag = (country: string): boolean => {
  return country in countryColorSchemes;
};
