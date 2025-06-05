// Country-specific color schemes
const COUNTRY_COLOR_SCHEMES: { [key: string]: Partial<CustomLogoStyle> } = {
  // European countries
  'Germany': { baseColor: '#000000', accentColor: '#FFD700' },
  'France': { baseColor: '#0055A4', accentColor: '#FFFFFF' },
  'Spain': { baseColor: '#C60B1E', accentColor: '#FFC400' },
  'England': { baseColor: '#012169', accentColor: '#FFFFFF' },
  'Italy': { baseColor: '#009246', accentColor: '#FFFFFF' },
  'Portugal': { baseColor: '#006600', accentColor: '#FF0000' },
  'Netherlands': { baseColor: '#FF4F00', accentColor: '#FFFFFF' },
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
  'Norway': { baseColor: '#EF2B2D', accentColor: '#002868' },
  'Sweden': { baseColor: '#006AA7', accentColor: '#FECC00' },

  // South American countries
  'Brazil': { baseColor: '#009B3A', accentColor: '#FFDF00' },
  'Argentina': { baseColor: '#6CACE4', accentColor: '#FFD700' },
  'Colombia': { baseColor: '#FFCD00', accentColor: '#003893' },
  'Chile': { baseColor: '#0039A6', accentColor: '#D52B1E' },
  'Uruguay': { baseColor: '#0038A8', accentColor: '#FCDD09' },

  // North American countries
  'United States': { baseColor: '#B22234', accentColor: '#FFFFFF' },
  'USA': { baseColor: '#B22234', accentColor: '#FFFFFF' },
  'Mexico': { baseColor: '#006847', accentColor: '#CE1126' },
  'Canada': { baseColor: '#FF0000', accentColor: '#FFFFFF' },

  // Asian/Oceanic countries
  'Japan': { baseColor: '#FFFFFF', accentColor: '#FF0000' },
  'South Korea': { baseColor: '#003478', accentColor: '#CD2E3A' },
  'Australia': { baseColor: '#012169', accentColor: '#FFFFFF' },

  // Special Friendlies scheme
  'Friendlies': { baseColor: '#4CAF50', accentColor: '#FFD700', pattern: 'geometric' },
};