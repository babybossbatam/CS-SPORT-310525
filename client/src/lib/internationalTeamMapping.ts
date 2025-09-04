
/**
 * International team mapping based on circle-flags gallery
 * Source: https://hatscripts.github.io/circle-flags/gallery.html
 */

export interface InternationalTeamMapping {
  name: string;
  code: string;
  variations: string[];
}

export const internationalTeamMappings: InternationalTeamMapping[] = [
  { name: 'Afghanistan', code: 'af', variations: ['Afghanistan'] },
  { name: 'Albania', code: 'al', variations: ['Albania'] },
  { name: 'Algeria', code: 'dz', variations: ['Algeria'] },
  { name: 'Andorra', code: 'ad', variations: ['Andorra'] },
  { name: 'Angola', code: 'ao', variations: ['Angola'] },
  { name: 'Antigua and Barbuda', code: 'ag', variations: ['Antigua and Barbuda', 'Antigua & Barbuda'] },
  { name: 'Argentina', code: 'ar', variations: ['Argentina'] },
  { name: 'Armenia', code: 'am', variations: ['Armenia'] },
  { name: 'Australia', code: 'au', variations: ['Australia'] },
  { name: 'Austria', code: 'at', variations: ['Austria'] },
  { name: 'Azerbaijan', code: 'az', variations: ['Azerbaijan'] },
  { name: 'Bahamas', code: 'bs', variations: ['Bahamas'] },
  { name: 'Bahrain', code: 'bh', variations: ['Bahrain'] },
  { name: 'Bangladesh', code: 'bd', variations: ['Bangladesh'] },
  { name: 'Barbados', code: 'bb', variations: ['Barbados'] },
  { name: 'Belarus', code: 'by', variations: ['Belarus'] },
  { name: 'Belgium', code: 'be', variations: ['Belgium'] },
  { name: 'Belize', code: 'bz', variations: ['Belize'] },
  { name: 'Benin', code: 'bj', variations: ['Benin'] },
  { name: 'Bhutan', code: 'bt', variations: ['Bhutan'] },
  { name: 'Bolivia', code: 'bo', variations: ['Bolivia'] },
  { name: 'Bosnia and Herzegovina', code: 'ba', variations: ['Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnia'] },
  { name: 'Botswana', code: 'bw', variations: ['Botswana'] },
  { name: 'Brazil', code: 'br', variations: ['Brazil'] },
  { name: 'Brunei', code: 'bn', variations: ['Brunei'] },
  { name: 'Bulgaria', code: 'bg', variations: ['Bulgaria'] },
  { name: 'Burkina Faso', code: 'bf', variations: ['Burkina Faso'] },
  { name: 'Burundi', code: 'bi', variations: ['Burundi'] },
  { name: 'Cambodia', code: 'kh', variations: ['Cambodia'] },
  { name: 'Cameroon', code: 'cm', variations: ['Cameroon'] },
  { name: 'Canada', code: 'ca', variations: ['Canada'] },
  { name: 'Cape Verde', code: 'cv', variations: ['Cape Verde'] },
  { name: 'Central African Republic', code: 'cf', variations: ['Central African Republic', 'CAR'] },
  { name: 'Chad', code: 'td', variations: ['Chad'] },
  { name: 'Chile', code: 'cl', variations: ['Chile'] },
  { name: 'China', code: 'cn', variations: ['China'] },
  { name: 'Colombia', code: 'co', variations: ['Colombia'] },
  { name: 'Comoros', code: 'km', variations: ['Comoros'] },
  { name: 'Congo', code: 'cg', variations: ['Congo', 'Republic of Congo'] },
  { name: 'Costa Rica', code: 'cr', variations: ['Costa Rica'] },
  { name: 'Croatia', code: 'hr', variations: ['Croatia'] },
  { name: 'Cuba', code: 'cu', variations: ['Cuba'] },
  { name: 'Cyprus', code: 'cy', variations: ['Cyprus'] },
  { name: 'Czech Republic', code: 'cz', variations: ['Czech Republic', 'Czechia'] },
  { name: 'Denmark', code: 'dk', variations: ['Denmark'] },
  { name: 'Djibouti', code: 'dj', variations: ['Djibouti'] },
  { name: 'Dominica', code: 'dm', variations: ['Dominica'] },
  { name: 'Dominican Republic', code: 'do', variations: ['Dominican Republic'] },
  { name: 'Ecuador', code: 'ec', variations: ['Ecuador'] },
  { name: 'Egypt', code: 'eg', variations: ['Egypt'] },
  { name: 'El Salvador', code: 'sv', variations: ['El Salvador'] },
  { name: 'England', code: 'gb-eng', variations: ['England'] },
  { name: 'Equatorial Guinea', code: 'gq', variations: ['Equatorial Guinea'] },
  { name: 'Eritrea', code: 'er', variations: ['Eritrea'] },
  { name: 'Estonia', code: 'ee', variations: ['Estonia'] },
  { name: 'Eswatini', code: 'sz', variations: ['Eswatini', 'Swaziland'] },
  { name: 'Ethiopia', code: 'et', variations: ['Ethiopia'] },
  { name: 'Fiji', code: 'fj', variations: ['Fiji'] },
  { name: 'Finland', code: 'fi', variations: ['Finland'] },
  { name: 'France', code: 'fr', variations: ['France'] },
  { name: 'FYR Macedonia', code: 'mk', variations: ['FYR Macedonia', 'North Macedonia', 'Macedonia'] },
  { name: 'Gabon', code: 'ga', variations: ['Gabon'] },
  { name: 'Gambia', code: 'gm', variations: ['Gambia'] },
  { name: 'Georgia', code: 'ge', variations: ['Georgia'] },
  { name: 'Germany', code: 'de', variations: ['Germany'] },
  { name: 'Ghana', code: 'gh', variations: ['Ghana'] },
  { name: 'Greece', code: 'gr', variations: ['Greece'] },
  { name: 'Grenada', code: 'gd', variations: ['Grenada'] },
  { name: 'Guatemala', code: 'gt', variations: ['Guatemala'] },
  { name: 'Guinea', code: 'gn', variations: ['Guinea'] },
  { name: 'Guinea-Bissau', code: 'gw', variations: ['Guinea-Bissau'] },
  { name: 'Guyana', code: 'gy', variations: ['Guyana'] },
  { name: 'Haiti', code: 'ht', variations: ['Haiti'] },
  { name: 'Honduras', code: 'hn', variations: ['Honduras'] },
  { name: 'Hong Kong', code: 'hk', variations: ['Hong Kong'] },
  { name: 'Hungary', code: 'hu', variations: ['Hungary'] },
  { name: 'Iceland', code: 'is', variations: ['Iceland'] },
  { name: 'India', code: 'in', variations: ['India'] },
  { name: 'Indonesia', code: 'id', variations: ['Indonesia'] },
  { name: 'Iran', code: 'ir', variations: ['Iran'] },
  { name: 'Iraq', code: 'iq', variations: ['Iraq'] },
  { name: 'Ireland', code: 'ie', variations: ['Ireland', 'Republic of Ireland'] },
  { name: 'Israel', code: 'il', variations: ['Israel'] },
  { name: 'Italy', code: 'it', variations: ['Italy'] },
  { name: 'Jamaica', code: 'jm', variations: ['Jamaica'] },
  { name: 'Japan', code: 'jp', variations: ['Japan'] },
  { name: 'Jordan', code: 'jo', variations: ['Jordan'] },
  { name: 'Kazakhstan', code: 'kz', variations: ['Kazakhstan'] },
  { name: 'Kenya', code: 'ke', variations: ['Kenya'] },
  { name: 'Kiribati', code: 'ki', variations: ['Kiribati'] },
  { name: 'Kuwait', code: 'kw', variations: ['Kuwait'] },
  { name: 'Kyrgyzstan', code: 'kg', variations: ['Kyrgyzstan'] },
  { name: 'Laos', code: 'la', variations: ['Laos'] },
  { name: 'Latvia', code: 'lv', variations: ['Latvia'] },
  { name: 'Lebanon', code: 'lb', variations: ['Lebanon'] },
  { name: 'Lesotho', code: 'ls', variations: ['Lesotho'] },
  { name: 'Liberia', code: 'lr', variations: ['Liberia'] },
  { name: 'Libya', code: 'ly', variations: ['Libya'] },
  { name: 'Liechtenstein', code: 'li', variations: ['Liechtenstein'] },
  { name: 'Lithuania', code: 'lt', variations: ['Lithuania'] },
  { name: 'Luxembourg', code: 'lu', variations: ['Luxembourg'] },
  { name: 'Madagascar', code: 'mg', variations: ['Madagascar'] },
  { name: 'Malawi', code: 'mw', variations: ['Malawi'] },
  { name: 'Malaysia', code: 'my', variations: ['Malaysia'] },
  { name: 'Maldives', code: 'mv', variations: ['Maldives'] },
  { name: 'Mali', code: 'ml', variations: ['Mali'] },
  { name: 'Malta', code: 'mt', variations: ['Malta'] },
  { name: 'Marshall Islands', code: 'mh', variations: ['Marshall Islands'] },
  { name: 'Mauritania', code: 'mr', variations: ['Mauritania'] },
  { name: 'Mauritius', code: 'mu', variations: ['Mauritius'] },
  { name: 'Mexico', code: 'mx', variations: ['Mexico'] },
  { name: 'Micronesia', code: 'fm', variations: ['Micronesia'] },
  { name: 'Moldova', code: 'md', variations: ['Moldova'] },
  { name: 'Monaco', code: 'mc', variations: ['Monaco'] },
  { name: 'Mongolia', code: 'mn', variations: ['Mongolia'] },
  { name: 'Montenegro', code: 'me', variations: ['Montenegro'] },
  { name: 'Morocco', code: 'ma', variations: ['Morocco'] },
  { name: 'Mozambique', code: 'mz', variations: ['Mozambique'] },
  { name: 'Myanmar', code: 'mm', variations: ['Myanmar', 'Burma'] },
  { name: 'Namibia', code: 'na', variations: ['Namibia'] },
  { name: 'Nauru', code: 'nr', variations: ['Nauru'] },
  { name: 'Nepal', code: 'np', variations: ['Nepal'] },
  { name: 'Netherlands', code: 'nl', variations: ['Netherlands', 'Holland'] },
  { name: 'New Zealand', code: 'nz', variations: ['New Zealand'] },
  { name: 'Nicaragua', code: 'ni', variations: ['Nicaragua'] },
  { name: 'Niger', code: 'ne', variations: ['Niger'] },
  { name: 'Nigeria', code: 'ng', variations: ['Nigeria'] },
  { name: 'North Korea', code: 'kp', variations: ['North Korea', 'DPR Korea'] },
  { name: 'North Macedonia', code: 'mk', variations: ['North Macedonia', 'FYR Macedonia', 'Macedonia'] },
  { name: 'Norway', code: 'no', variations: ['Norway'] },
  { name: 'Oman', code: 'om', variations: ['Oman'] },
  { name: 'Pakistan', code: 'pk', variations: ['Pakistan'] },
  { name: 'Palau', code: 'pw', variations: ['Palau'] },
  { name: 'Palestine', code: 'ps', variations: ['Palestine'] },
  { name: 'Panama', code: 'pa', variations: ['Panama'] },
  { name: 'Papua New Guinea', code: 'pg', variations: ['Papua New Guinea', 'PNG'] },
  { name: 'Paraguay', code: 'py', variations: ['Paraguay'] },
  { name: 'Peru', code: 'pe', variations: ['Peru'] },
  { name: 'Philippines', code: 'ph', variations: ['Philippines'] },
  { name: 'Poland', code: 'pl', variations: ['Poland'] },
  { name: 'Portugal', code: 'pt', variations: ['Portugal'] },
  { name: 'Qatar', code: 'qa', variations: ['Qatar'] },
  { name: 'Romania', code: 'ro', variations: ['Romania'] },
  { name: 'Russia', code: 'ru', variations: ['Russia', 'Russian Federation'] },
  { name: 'Rwanda', code: 'rw', variations: ['Rwanda'] },
  { name: 'Saint Kitts and Nevis', code: 'kn', variations: ['Saint Kitts and Nevis', 'St Kitts and Nevis'] },
  { name: 'Saint Lucia', code: 'lc', variations: ['Saint Lucia', 'St Lucia'] },
  { name: 'Saint Vincent and the Grenadines', code: 'vc', variations: ['Saint Vincent and the Grenadines', 'St Vincent and the Grenadines'] },
  { name: 'Samoa', code: 'ws', variations: ['Samoa'] },
  { name: 'San Marino', code: 'sm', variations: ['San Marino'] },
  { name: 'Sao Tome and Principe', code: 'st', variations: ['Sao Tome and Principe'] },
  { name: 'Saudi Arabia', code: 'sa', variations: ['Saudi Arabia'] },
  { name: 'Scotland', code: 'gb-sct', variations: ['Scotland'] },
  { name: 'Senegal', code: 'sn', variations: ['Senegal'] },
  { name: 'Serbia', code: 'rs', variations: ['Serbia'] },
  { name: 'Seychelles', code: 'sc', variations: ['Seychelles'] },
  { name: 'Sierra Leone', code: 'sl', variations: ['Sierra Leone'] },
  { name: 'Singapore', code: 'sg', variations: ['Singapore'] },
  { name: 'Slovakia', code: 'sk', variations: ['Slovakia'] },
  { name: 'Slovenia', code: 'si', variations: ['Slovenia'] },
  { name: 'Solomon Islands', code: 'sb', variations: ['Solomon Islands'] },
  { name: 'Somalia', code: 'so', variations: ['Somalia'] },
  { name: 'South Africa', code: 'za', variations: ['South Africa'] },
  { name: 'South Korea', code: 'kr', variations: ['South Korea', 'Korea Republic'] },
  { name: 'South Sudan', code: 'ss', variations: ['South Sudan'] },
  { name: 'Spain', code: 'es', variations: ['Spain'] },
  { name: 'Sri Lanka', code: 'lk', variations: ['Sri Lanka'] },
  { name: 'Sudan', code: 'sd', variations: ['Sudan'] },
  { name: 'Suriname', code: 'sr', variations: ['Suriname'] },
  { name: 'Sweden', code: 'se', variations: ['Sweden'] },
  { name: 'Switzerland', code: 'ch', variations: ['Switzerland'] },
  { name: 'Syria', code: 'sy', variations: ['Syria'] },
  { name: 'Taiwan', code: 'tw', variations: ['Taiwan', 'Chinese Taipei'] },
  { name: 'Tajikistan', code: 'tj', variations: ['Tajikistan'] },
  { name: 'Tanzania', code: 'tz', variations: ['Tanzania'] },
  { name: 'Thailand', code: 'th', variations: ['Thailand'] },
  { name: 'Timor-Leste', code: 'tl', variations: ['Timor-Leste', 'East Timor'] },
  { name: 'Togo', code: 'tg', variations: ['Togo'] },
  { name: 'Tonga', code: 'to', variations: ['Tonga'] },
  { name: 'Trinidad and Tobago', code: 'tt', variations: ['Trinidad and Tobago', 'Trinidad & Tobago'] },
  { name: 'Tunisia', code: 'tn', variations: ['Tunisia'] },
  { name: 'Turkey', code: 'tr', variations: ['Turkey'] },
  { name: 'Turkmenistan', code: 'tm', variations: ['Turkmenistan'] },
  { name: 'Tuvalu', code: 'tv', variations: ['Tuvalu'] },
  { name: 'Uganda', code: 'ug', variations: ['Uganda'] },
  { name: 'Ukraine', code: 'ua', variations: ['Ukraine'] },
  { name: 'United Arab Emirates', code: 'ae', variations: ['United Arab Emirates', 'UAE'] },
  { name: 'United Kingdom', code: 'gb', variations: ['United Kingdom', 'UK'] },
  { name: 'United States', code: 'us', variations: ['United States', 'USA', 'US'] },
  { name: 'Uruguay', code: 'uy', variations: ['Uruguay'] },
  { name: 'Uzbekistan', code: 'uz', variations: ['Uzbekistan'] },
  { name: 'Vanuatu', code: 'vu', variations: ['Vanuatu'] },
  { name: 'Vatican City', code: 'va', variations: ['Vatican City', 'Vatican'] },
  { name: 'Venezuela', code: 've', variations: ['Venezuela'] },
  { name: 'Vietnam', code: 'vn', variations: ['Vietnam'] },
  { name: 'Wales', code: 'gb-wls', variations: ['Wales'] },
  { name: 'Yemen', code: 'ye', variations: ['Yemen'] },
  { name: 'Zambia', code: 'zm', variations: ['Zambia'] },
  { name: 'Zimbabwe', code: 'zw', variations: ['Zimbabwe'] }
];

/**
 * Check if a team name matches an international team
 */
export function isInternationalTeam(teamName: string): boolean {
  if (!teamName) return false;
  
  const cleanTeamName = teamName.toLowerCase().trim().replace(/\s+(u21|u20|u19|u23|national team)$/i, '');
  
  return internationalTeamMappings.some(mapping => {
    return mapping.variations.some(variation => {
      const cleanVariation = variation.toLowerCase().trim();
      return cleanTeamName === cleanVariation || cleanTeamName.includes(cleanVariation);
    });
  });
}

/**
 * Get country code for an international team
 */
export function getCountryCodeForTeam(teamName: string): string | null {
  if (!teamName) return null;
  
  const cleanTeamName = teamName.toLowerCase().trim().replace(/\s+(u21|u20|u19|u23|national team)$/i, '');
  
  const mapping = internationalTeamMappings.find(mapping => {
    return mapping.variations.some(variation => {
      const cleanVariation = variation.toLowerCase().trim();
      return cleanTeamName === cleanVariation || cleanTeamName.includes(cleanVariation);
    });
  });
  
  return mapping?.code || null;
}

/**
 * Transform league name from "Friendlies Clubs" to "Friendlies International" for national teams
 */
export function transformLeagueNameForInternationalTeam(leagueName: string, teamName: string): string {
  if (leagueName?.toLowerCase().includes('friendlies clubs') && isInternationalTeam(teamName)) {
    return 'Friendlies International';
  }
  return leagueName;
}
