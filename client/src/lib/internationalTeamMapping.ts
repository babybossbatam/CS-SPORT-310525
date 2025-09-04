
/**
 * International team name mapping for Circle Flags
 * Based on https://hatscripts.github.io/circle-flags/gallery.html
 */

export interface CountryMapping {
  name: string;
  code: string;
  aliases?: string[];
}

// Comprehensive country mapping based on Circle Flags gallery
export const INTERNATIONAL_TEAMS: CountryMapping[] = [
  // Europe
  { name: 'Albania', code: 'al', aliases: ['Albania U21', 'Albania U20', 'Albania U19'] },
  { name: 'Andorra', code: 'ad', aliases: ['Andorra U21', 'Andorra U20'] },
  { name: 'Armenia', code: 'am', aliases: ['Armenia U21', 'Armenia U20'] },
  { name: 'Austria', code: 'at', aliases: ['Austria U21', 'Austria U20', 'Austria U19'] },
  { name: 'Azerbaijan', code: 'az', aliases: ['Azerbaijan U21', 'Azerbaijan U20'] },
  { name: 'Belarus', code: 'by', aliases: ['Belarus U21', 'Belarus U20'] },
  { name: 'Belgium', code: 'be', aliases: ['Belgium U21', 'Belgium U20', 'Belgium U19'] },
  { name: 'Bosnia and Herzegovina', code: 'ba', aliases: ['Bosnia U21', 'Bosnia U20', 'Bosnia & Herzegovina'] },
  { name: 'Bulgaria', code: 'bg', aliases: ['Bulgaria U21', 'Bulgaria U20'] },
  { name: 'Croatia', code: 'hr', aliases: ['Croatia U21', 'Croatia U20', 'Croatia U19'] },
  { name: 'Cyprus', code: 'cy', aliases: ['Cyprus U21', 'Cyprus U20'] },
  { name: 'Czech Republic', code: 'cz', aliases: ['Czech Republic U21', 'Czech U21', 'Czech Republic U20', 'Czechia'] },
  { name: 'Denmark', code: 'dk', aliases: ['Denmark U21', 'Denmark U20', 'Denmark U19'] },
  { name: 'England', code: 'gb-eng', aliases: ['England U21', 'England U20', 'England U19'] },
  { name: 'Estonia', code: 'ee', aliases: ['Estonia U21', 'Estonia U20'] },
  { name: 'Finland', code: 'fi', aliases: ['Finland U21', 'Finland U20'] },
  { name: 'France', code: 'fr', aliases: ['France U21', 'France U20', 'France U19'] },
  { name: 'Georgia', code: 'ge', aliases: ['Georgia U21', 'Georgia U20'] },
  { name: 'Germany', code: 'de', aliases: ['Germany U21', 'Germany U20', 'Germany U19'] },
  { name: 'Greece', code: 'gr', aliases: ['Greece U21', 'Greece U20'] },
  { name: 'Hungary', code: 'hu', aliases: ['Hungary U21', 'Hungary U20'] },
  { name: 'Iceland', code: 'is', aliases: ['Iceland U21', 'Iceland U20'] },
  { name: 'Ireland', code: 'ie', aliases: ['Ireland U21', 'Ireland U20', 'Republic of Ireland'] },
  { name: 'Italy', code: 'it', aliases: ['Italy U21', 'Italy U20', 'Italy U19'] },
  { name: 'Kosovo', code: 'xk', aliases: ['Kosovo U21', 'Kosovo U20'] },
  { name: 'Latvia', code: 'lv', aliases: ['Latvia U21', 'Latvia U20'] },
  { name: 'Lithuania', code: 'lt', aliases: ['Lithuania U21', 'Lithuania U20'] },
  { name: 'Luxembourg', code: 'lu', aliases: ['Luxembourg U21', 'Luxembourg U20'] },
  { name: 'Malta', code: 'mt', aliases: ['Malta U21', 'Malta U20'] },
  { name: 'Moldova', code: 'md', aliases: ['Moldova U21', 'Moldova U20'] },
  { name: 'Montenegro', code: 'me', aliases: ['Montenegro U21', 'Montenegro U20'] },
  { name: 'Netherlands', code: 'nl', aliases: ['Netherlands U21', 'Netherlands U20', 'Netherlands U19', 'Holland'] },
  { name: 'North Macedonia', code: 'mk', aliases: ['North Macedonia U21', 'Macedonia', 'FYR Macedonia'] },
  { name: 'Northern Ireland', code: 'gb-nir', aliases: ['Northern Ireland U21', 'Northern Ireland U20'] },
  { name: 'Norway', code: 'no', aliases: ['Norway U21', 'Norway U20'] },
  { name: 'Poland', code: 'pl', aliases: ['Poland U21', 'Poland U20', 'Poland U19'] },
  { name: 'Portugal', code: 'pt', aliases: ['Portugal U21', 'Portugal U20', 'Portugal U19'] },
  { name: 'Romania', code: 'ro', aliases: ['Romania U21', 'Romania U20'] },
  { name: 'Russia', code: 'ru', aliases: ['Russia U21', 'Russia U20'] },
  { name: 'Scotland', code: 'gb-sct', aliases: ['Scotland U21', 'Scotland U20'] },
  { name: 'Serbia', code: 'rs', aliases: ['Serbia U21', 'Serbia U20'] },
  { name: 'Slovakia', code: 'sk', aliases: ['Slovakia U21', 'Slovakia U20'] },
  { name: 'Slovenia', code: 'si', aliases: ['Slovenia U21', 'Slovenia U20'] },
  { name: 'Spain', code: 'es', aliases: ['Spain U21', 'Spain U20', 'Spain U19'] },
  { name: 'Sweden', code: 'se', aliases: ['Sweden U21', 'Sweden U20'] },
  { name: 'Switzerland', code: 'ch', aliases: ['Switzerland U21', 'Switzerland U20'] },
  { name: 'Turkey', code: 'tr', aliases: ['Turkey U21', 'Turkey U20', 'Türkiye'] },
  { name: 'Ukraine', code: 'ua', aliases: ['Ukraine U21', 'Ukraine U20'] },
  { name: 'Wales', code: 'gb-wls', aliases: ['Wales U21', 'Wales U20'] },

  // South America
  { name: 'Argentina', code: 'ar', aliases: ['Argentina U21', 'Argentina U20'] },
  { name: 'Bolivia', code: 'bo', aliases: ['Bolivia U21', 'Bolivia U20'] },
  { name: 'Brazil', code: 'br', aliases: ['Brazil U21', 'Brazil U20', 'Brazil U19'] },
  { name: 'Chile', code: 'cl', aliases: ['Chile U21', 'Chile U20'] },
  { name: 'Colombia', code: 'co', aliases: ['Colombia U21', 'Colombia U20'] },
  { name: 'Ecuador', code: 'ec', aliases: ['Ecuador U21', 'Ecuador U20'] },
  { name: 'Paraguay', code: 'py', aliases: ['Paraguay U21', 'Paraguay U20'] },
  { name: 'Peru', code: 'pe', aliases: ['Peru U21', 'Peru U20'] },
  { name: 'Uruguay', code: 'uy', aliases: ['Uruguay U21', 'Uruguay U20'] },
  { name: 'Venezuela', code: 've', aliases: ['Venezuela U21', 'Venezuela U20'] },

  // North & Central America
  { name: 'Canada', code: 'ca', aliases: ['Canada U21', 'Canada U20'] },
  { name: 'Costa Rica', code: 'cr', aliases: ['Costa Rica U21', 'Costa Rica U20'] },
  { name: 'El Salvador', code: 'sv', aliases: ['El Salvador U21', 'El Salvador U20'] },
  { name: 'Guatemala', code: 'gt', aliases: ['Guatemala U21', 'Guatemala U20'] },
  { name: 'Honduras', code: 'hn', aliases: ['Honduras U21', 'Honduras U20'] },
  { name: 'Jamaica', code: 'jm', aliases: ['Jamaica U21', 'Jamaica U20'] },
  { name: 'Mexico', code: 'mx', aliases: ['Mexico U21', 'Mexico U20'] },
  { name: 'Nicaragua', code: 'ni', aliases: ['Nicaragua U21', 'Nicaragua U20'] },
  { name: 'Panama', code: 'pa', aliases: ['Panama U21', 'Panama U20'] },
  { name: 'Trinidad and Tobago', code: 'tt', aliases: ['Trinidad & Tobago', 'Trinidad U20'] },
  { name: 'United States', code: 'us', aliases: ['USA', 'United States U21', 'USA U21', 'USA U20'] },

  // Asia
  { name: 'Afghanistan', code: 'af', aliases: ['Afghanistan U21', 'Afghanistan U20'] },
  { name: 'Australia', code: 'au', aliases: ['Australia U21', 'Australia U20'] },
  { name: 'Bahrain', code: 'bh', aliases: ['Bahrain U21', 'Bahrain U20'] },
  { name: 'Bangladesh', code: 'bd', aliases: ['Bangladesh U21', 'Bangladesh U20'] },
  { name: 'Bhutan', code: 'bt', aliases: ['Bhutan U21', 'Bhutan U20'] },
  { name: 'Brunei', code: 'bn', aliases: ['Brunei U21', 'Brunei U20'] },
  { name: 'Cambodia', code: 'kh', aliases: ['Cambodia U21', 'Cambodia U20'] },
  { name: 'China', code: 'cn', aliases: ['China U21', 'China U20'] },
  { name: 'Hong Kong', code: 'hk', aliases: ['Hong Kong U21', 'Hong Kong U20'] },
  { name: 'India', code: 'in', aliases: ['India U21', 'India U20'] },
  { name: 'Indonesia', code: 'id', aliases: ['Indonesia U21', 'Indonesia U20'] },
  { name: 'Iran', code: 'ir', aliases: ['Iran U21', 'Iran U20'] },
  { name: 'Iraq', code: 'iq', aliases: ['Iraq U21', 'Iraq U20'] },
  { name: 'Israel', code: 'il', aliases: ['Israel U21', 'Israel U20'] },
  { name: 'Japan', code: 'jp', aliases: ['Japan U21', 'Japan U20'] },
  { name: 'Jordan', code: 'jo', aliases: ['Jordan U21', 'Jordan U20'] },
  { name: 'Kazakhstan', code: 'kz', aliases: ['Kazakhstan U21', 'Kazakhstan U20'] },
  { name: 'Kuwait', code: 'kw', aliases: ['Kuwait U21', 'Kuwait U20'] },
  { name: 'Kyrgyzstan', code: 'kg', aliases: ['Kyrgyzstan U21', 'Kyrgyzstan U20'] },
  { name: 'Laos', code: 'la', aliases: ['Laos U21', 'Laos U20'] },
  { name: 'Lebanon', code: 'lb', aliases: ['Lebanon U21', 'Lebanon U20'] },
  { name: 'Maldives', code: 'mv', aliases: ['Maldives U21', 'Maldives U20'] },
  { name: 'Malaysia', code: 'my', aliases: ['Malaysia U21', 'Malaysia U20'] },
  { name: 'Mongolia', code: 'mn', aliases: ['Mongolia U21', 'Mongolia U20'] },
  { name: 'Myanmar', code: 'mm', aliases: ['Myanmar U21', 'Myanmar U20'] },
  { name: 'Nepal', code: 'np', aliases: ['Nepal U21', 'Nepal U20'] },
  { name: 'New Zealand', code: 'nz', aliases: ['New Zealand U21', 'New Zealand U20'] },
  { name: 'North Korea', code: 'kp', aliases: ['North Korea U21', 'North Korea U20'] },
  { name: 'Oman', code: 'om', aliases: ['Oman U21', 'Oman U20'] },
  { name: 'Pakistan', code: 'pk', aliases: ['Pakistan U21', 'Pakistan U20'] },
  { name: 'Palestine', code: 'ps', aliases: ['Palestine U21', 'Palestine U20'] },
  { name: 'Philippines', code: 'ph', aliases: ['Philippines U21', 'Philippines U20'] },
  { name: 'Qatar', code: 'qa', aliases: ['Qatar U21', 'Qatar U20'] },
  { name: 'Saudi Arabia', code: 'sa', aliases: ['Saudi Arabia U21', 'Saudi Arabia U20'] },
  { name: 'Singapore', code: 'sg', aliases: ['Singapore U21', 'Singapore U20'] },
  { name: 'South Korea', code: 'kr', aliases: ['South Korea U21', 'South Korea U20', 'Korea Republic'] },
  { name: 'Sri Lanka', code: 'lk', aliases: ['Sri Lanka U21', 'Sri Lanka U20'] },
  { name: 'Syria', code: 'sy', aliases: ['Syria U21', 'Syria U20'] },
  { name: 'Tajikistan', code: 'tj', aliases: ['Tajikistan U21', 'Tajikistan U20'] },
  { name: 'Thailand', code: 'th', aliases: ['Thailand U21', 'Thailand U20'] },
  { name: 'Timor-Leste', code: 'tl', aliases: ['Timor-Leste U21', 'Timor-Leste U20'] },
  { name: 'Turkmenistan', code: 'tm', aliases: ['Turkmenistan U21', 'Turkmenistan U20'] },
  { name: 'United Arab Emirates', code: 'ae', aliases: ['UAE', 'United Arab Emirates U21', 'UAE U21', 'UAE U20'] },
  { name: 'Uzbekistan', code: 'uz', aliases: ['Uzbekistan U21', 'Uzbekistan U20'] },
  { name: 'Vietnam', code: 'vn', aliases: ['Vietnam U21', 'Vietnam U20'] },
  { name: 'Yemen', code: 'ye', aliases: ['Yemen U21', 'Yemen U20'] },

  // Africa
  { name: 'Algeria', code: 'dz', aliases: ['Algeria U21', 'Algeria U20'] },
  { name: 'Angola', code: 'ao', aliases: ['Angola U21', 'Angola U20'] },
  { name: 'Benin', code: 'bj', aliases: ['Benin U21', 'Benin U20'] },
  { name: 'Botswana', code: 'bw', aliases: ['Botswana U21', 'Botswana U20'] },
  { name: 'Burkina Faso', code: 'bf', aliases: ['Burkina Faso U21', 'Burkina Faso U20'] },
  { name: 'Burundi', code: 'bi', aliases: ['Burundi U21', 'Burundi U20'] },
  { name: 'Cameroon', code: 'cm', aliases: ['Cameroon U21', 'Cameroon U20'] },
  { name: 'Cape Verde', code: 'cv', aliases: ['Cape Verde U21', 'Cape Verde U20'] },
  { name: 'Central African Republic', code: 'cf', aliases: ['Central African Republic U21', 'CAR'] },
  { name: 'Chad', code: 'td', aliases: ['Chad U21', 'Chad U20'] },
  { name: 'Comoros', code: 'km', aliases: ['Comoros U21', 'Comoros U20'] },
  { name: 'Congo', code: 'cg', aliases: ['Congo U21', 'Congo U20'] },
  { name: 'DR Congo', code: 'cd', aliases: ['DR Congo U21', 'Democratic Republic of the Congo', 'Congo DR'] },
  { name: 'Djibouti', code: 'dj', aliases: ['Djibouti U21', 'Djibouti U20'] },
  { name: 'Egypt', code: 'eg', aliases: ['Egypt U21', 'Egypt U20'] },
  { name: 'Equatorial Guinea', code: 'gq', aliases: ['Equatorial Guinea U21', 'Equatorial Guinea U20'] },
  { name: 'Eritrea', code: 'er', aliases: ['Eritrea U21', 'Eritrea U20'] },
  { name: 'Eswatini', code: 'sz', aliases: ['Eswatini U21', 'Swaziland'] },
  { name: 'Ethiopia', code: 'et', aliases: ['Ethiopia U21', 'Ethiopia U20'] },
  { name: 'Gabon', code: 'ga', aliases: ['Gabon U21', 'Gabon U20'] },
  { name: 'Gambia', code: 'gm', aliases: ['Gambia U21', 'Gambia U20'] },
  { name: 'Ghana', code: 'gh', aliases: ['Ghana U21', 'Ghana U20'] },
  { name: 'Guinea', code: 'gn', aliases: ['Guinea U21', 'Guinea U20'] },
  { name: 'Guinea-Bissau', code: 'gw', aliases: ['Guinea-Bissau U21', 'Guinea-Bissau U20'] },
  { name: 'Ivory Coast', code: 'ci', aliases: ['Ivory Coast U21', 'Cote d\'Ivoire', 'Côte d\'Ivoire'] },
  { name: 'Kenya', code: 'ke', aliases: ['Kenya U21', 'Kenya U20'] },
  { name: 'Lesotho', code: 'ls', aliases: ['Lesotho U21', 'Lesotho U20'] },
  { name: 'Liberia', code: 'lr', aliases: ['Liberia U21', 'Liberia U20'] },
  { name: 'Libya', code: 'ly', aliases: ['Libya U21', 'Libya U20'] },
  { name: 'Madagascar', code: 'mg', aliases: ['Madagascar U21', 'Madagascar U20'] },
  { name: 'Malawi', code: 'mw', aliases: ['Malawi U21', 'Malawi U20'] },
  { name: 'Mali', code: 'ml', aliases: ['Mali U21', 'Mali U20'] },
  { name: 'Mauritania', code: 'mr', aliases: ['Mauritania U21', 'Mauritania U20'] },
  { name: 'Mauritius', code: 'mu', aliases: ['Mauritius U21', 'Mauritius U20'] },
  { name: 'Morocco', code: 'ma', aliases: ['Morocco U21', 'Morocco U20'] },
  { name: 'Mozambique', code: 'mz', aliases: ['Mozambique U21', 'Mozambique U20'] },
  { name: 'Namibia', code: 'na', aliases: ['Namibia U21', 'Namibia U20'] },
  { name: 'Niger', code: 'ne', aliases: ['Niger U21', 'Niger U20'] },
  { name: 'Nigeria', code: 'ng', aliases: ['Nigeria U21', 'Nigeria U20'] },
  { name: 'Rwanda', code: 'rw', aliases: ['Rwanda U21', 'Rwanda U20'] },
  { name: 'Sao Tome and Principe', code: 'st', aliases: ['Sao Tome U21', 'São Tomé and Príncipe'] },
  { name: 'Senegal', code: 'sn', aliases: ['Senegal U21', 'Senegal U20'] },
  { name: 'Seychelles', code: 'sc', aliases: ['Seychelles U21', 'Seychelles U20'] },
  { name: 'Sierra Leone', code: 'sl', aliases: ['Sierra Leone U21', 'Sierra Leone U20'] },
  { name: 'Somalia', code: 'so', aliases: ['Somalia U21', 'Somalia U20'] },
  { name: 'South Africa', code: 'za', aliases: ['South Africa U21', 'South Africa U20'] },
  { name: 'South Sudan', code: 'ss', aliases: ['South Sudan U21', 'South Sudan U20'] },
  { name: 'Sudan', code: 'sd', aliases: ['Sudan U21', 'Sudan U20'] },
  { name: 'Tanzania', code: 'tz', aliases: ['Tanzania U21', 'Tanzania U20'] },
  { name: 'Togo', code: 'tg', aliases: ['Togo U21', 'Togo U20'] },
  { name: 'Tunisia', code: 'tn', aliases: ['Tunisia U21', 'Tunisia U20'] },
  { name: 'Uganda', code: 'ug', aliases: ['Uganda U21', 'Uganda U20'] },
  { name: 'Zambia', code: 'zm', aliases: ['Zambia U21', 'Zambia U20'] },
  { name: 'Zimbabwe', code: 'zw', aliases: ['Zimbabwe U21', 'Zimbabwe U20'] }
];

// Create lookup maps for faster searching
const createLookupMaps = () => {
  const nameToCountry = new Map<string, CountryMapping>();
  const aliasToCountry = new Map<string, CountryMapping>();

  INTERNATIONAL_TEAMS.forEach(country => {
    // Map main name (case-insensitive)
    nameToCountry.set(country.name.toLowerCase(), country);
    
    // Map aliases (case-insensitive)
    if (country.aliases) {
      country.aliases.forEach(alias => {
        aliasToCountry.set(alias.toLowerCase(), country);
      });
    }
  });

  return { nameToCountry, aliasToCountry };
};

const { nameToCountry, aliasToCountry } = createLookupMaps();

/**
 * Check if a team name is a national/international team
 */
export function isNationalTeam(teamName: string): boolean {
  if (!teamName) return false;
  
  const cleanName = teamName.trim().toLowerCase();
  
  // Direct name match
  if (nameToCountry.has(cleanName)) {
    return true;
  }
  
  // Alias match
  if (aliasToCountry.has(cleanName)) {
    return true;
  }
  
  // Check for youth team patterns (U15, U16, U17, U18, U19, U20, U21, U23)
  const youthPattern = /^(.+?)\s+u(15|16|17|18|19|20|21|23)$/i;
  const youthMatch = cleanName.match(youthPattern);
  if (youthMatch) {
    const baseCountryName = youthMatch[1].trim();
    if (nameToCountry.has(baseCountryName) || aliasToCountry.has(baseCountryName)) {
      return true;
    }
  }
  
  // Check for women's team patterns
  const womenPattern = /^(.+?)\s+(women?|w)$/i;
  const womenMatch = cleanName.match(womenPattern);
  if (womenMatch) {
    const baseCountryName = womenMatch[1].trim();
    if (nameToCountry.has(baseCountryName) || aliasToCountry.has(baseCountryName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get country code for a team name
 */
export function getCountryCodeForTeam(teamName: string): string | null {
  if (!teamName) return null;
  
  const cleanName = teamName.trim().toLowerCase();
  
  // Direct name match
  const directMatch = nameToCountry.get(cleanName);
  if (directMatch) {
    return directMatch.code;
  }
  
  // Alias match
  const aliasMatch = aliasToCountry.get(cleanName);
  if (aliasMatch) {
    return aliasMatch.code;
  }
  
  // Check for youth team patterns
  const youthPattern = /^(.+?)\s+u(15|16|17|18|19|20|21|23)$/i;
  const youthMatch = cleanName.match(youthPattern);
  if (youthMatch) {
    const baseCountryName = youthMatch[1].trim();
    const baseCountry = nameToCountry.get(baseCountryName) || aliasToCountry.get(baseCountryName);
    if (baseCountry) {
      return baseCountry.code;
    }
  }
  
  // Check for women's team patterns
  const womenPattern = /^(.+?)\s+(women?|w)$/i;
  const womenMatch = cleanName.match(womenPattern);
  if (womenMatch) {
    const baseCountryName = womenMatch[1].trim();
    const baseCountry = nameToCountry.get(baseCountryName) || aliasToCountry.get(baseCountryName);
    if (baseCountry) {
      return baseCountry.code;
    }
  }
  
  return null;
}

/**
 * Get country information for a team name
 */
export function getCountryInfoForTeam(teamName: string): CountryMapping | null {
  if (!teamName) return null;
  
  const cleanName = teamName.trim().toLowerCase();
  
  // Direct name match
  const directMatch = nameToCountry.get(cleanName);
  if (directMatch) {
    return directMatch;
  }
  
  // Alias match
  const aliasMatch = aliasToCountry.get(cleanName);
  if (aliasMatch) {
    return aliasMatch;
  }
  
  // Check for youth team patterns
  const youthPattern = /^(.+?)\s+u(15|16|17|18|19|20|21|23)$/i;
  const youthMatch = cleanName.match(youthPattern);
  if (youthMatch) {
    const baseCountryName = youthMatch[1].trim();
    const baseCountry = nameToCountry.get(baseCountryName) || aliasToCountry.get(baseCountryName);
    if (baseCountry) {
      return baseCountry;
    }
  }
  
  // Check for women's team patterns
  const womenPattern = /^(.+?)\s+(women?|w)$/i;
  const womenMatch = cleanName.match(womenPattern);
  if (womenMatch) {
    const baseCountryName = womenMatch[1].trim();
    const baseCountry = nameToCountry.get(baseCountryName) || aliasToCountry.get(baseCountryName);
    if (baseCountry) {
      return baseCountry;
    }
  }
  
  return null;
}

/**
 * Transform league context for Friendlies Clubs containing national teams
 */
export function transformLeagueContextForNationalTeams(
  leagueContext: { name?: string; country?: string } | undefined,
  teamName: string
): { name?: string; country?: string } | undefined {
  if (!leagueContext || !teamName) return leagueContext;
  
  const leagueName = leagueContext.name?.toLowerCase() || '';
  
  // Check if this is Friendlies Clubs league
  const isFriendliesClubs = 
    leagueName.includes('friendlies clubs') || 
    leagueName.includes('friendlies club') || 
    leagueName === 'friendlies clubs';
  
  if (isFriendliesClubs && isNationalTeam(teamName)) {
    // Transform to Friendlies International for national teams
    return {
      ...leagueContext,
      name: 'Friendlies International',
      country: 'World'
    };
  }
  
  return leagueContext;
}
