
export const getTeamLogoClassName = (
  baseSize: string = 'w-6 h-6',
  countryContext?: string,
  leagueName?: string
): string => {
  // Check if this is a country/international competition
  const isCountryTeam = countryContext === 'World' || 
                       countryContext === 'Europe' || 
                       countryContext === 'South America' || 
                       countryContext === 'International' ||
                       leagueName?.toLowerCase().includes('international') ||
                       leagueName?.toLowerCase().includes('friendlies') ||
                       leagueName?.toLowerCase().includes('nations league') ||
                       leagueName?.toLowerCase().includes('world cup') ||
                       leagueName?.toLowerCase().includes('euro') ||
                       leagueName?.toLowerCase().includes('copa america') ||
                       leagueName?.toLowerCase().includes('uefa') ||
                       leagueName?.toLowerCase().includes('conmebol') ||
                       leagueName?.toLowerCase().includes('fifa');

  return `${baseSize} ${isCountryTeam ? 'object-cover country-flag-ball' : 'object-contain'}`;
};
