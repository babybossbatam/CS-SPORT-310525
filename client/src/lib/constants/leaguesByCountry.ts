
export interface LeagueInfo {
  id: number;
  name: string;
  logo: string;
  country: string;
  priority: number;
}

export const LEAGUES_BY_COUNTRY: Record<string, LeagueInfo[]> = {
  "England": [
    { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England", priority: 1 },
    { id: 40, name: "Community Shield", logo: "https://media.api-sports.io/football/leagues/40.png", country: "England", priority: 2 },
    { id: 45, name: "FA Cup", logo: "https://media.api-sports.io/football/leagues/45.png", country: "England", priority: 3 },
    { id: 48, name: "EFL Cup", logo: "https://media.api-sports.io/football/leagues/48.png", country: "England", priority: 4 },
    { id: 41, name: "Championship", logo: "https://media.api-sports.io/football/leagues/41.png", country: "England", priority: 5 }
  ],
  "Spain": [
    { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain", priority: 1 },
    { id: 143, name: "Copa del Rey", logo: "https://media.api-sports.io/football/leagues/143.png", country: "Spain", priority: 2 },
    { id: 556, name: "Spanish Super Cup", logo: "https://media.api-sports.io/football/leagues/556.png", country: "Spain", priority: 3 },
    { id: 141, name: "Segunda División", logo: "https://media.api-sports.io/football/leagues/141.png", country: "Spain", priority: 4 }
  ],
  "Italy": [
    { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Italy", priority: 1 },
    { id: 137, name: "Coppa Italia", logo: "https://media.api-sports.io/football/leagues/137.png", country: "Italy", priority: 2 },
    { id: 547, name: "Super Cup", logo: "https://media.api-sports.io/football/leagues/547.png", country: "Italy", priority: 3 },
    { id: 136, name: "Serie B", logo: "https://media.api-sports.io/football/leagues/136.png", country: "Italy", priority: 4 }
  ],
  "Germany": [
    { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Germany", priority: 1 },
    { id: 81, name: "DFB Pokal", logo: "https://media.api-sports.io/football/leagues/81.png", country: "Germany", priority: 2 },
    { id: 507, name: "German Super Cup", logo: "https://media.api-sports.io/football/leagues/507.png", country: "Germany", priority: 3 },
    { id: 79, name: "2. Bundesliga", logo: "https://media.api-sports.io/football/leagues/79.png", country: "Germany", priority: 4 }
  ],
  "France": [
    { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: "France", priority: 1 },
    { id: 66, name: "Coupe de France", logo: "https://media.api-sports.io/football/leagues/66.png", country: "France", priority: 2 },
    { id: 526, name: "Trophée des Champions", logo: "https://media.api-sports.io/football/leagues/526.png", country: "France", priority: 3 },
    { id: 62, name: "Ligue 2", logo: "https://media.api-sports.io/football/leagues/62.png", country: "France", priority: 4 }
  ],
  "Brazil": [
    { id: 71, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/71.png", country: "Brazil", priority: 1 },
    { id: 72, name: "Serie B", logo: "https://media.api-sports.io/football/leagues/72.png", country: "Brazil", priority: 2 },
    { id: 73, name: "Copa do Brasil", logo: "https://media.api-sports.io/football/leagues/73.png", country: "Brazil", priority: 3 }
  ],
  "Argentina": [
    { id: 128, name: "Primera División", logo: "https://media.api-sports.io/football/leagues/128.png", country: "Argentina", priority: 1 },
    { id: 130, name: "Copa Argentina", logo: "https://media.api-sports.io/football/leagues/130.png", country: "Argentina", priority: 2 }
  ],
  "World": [
    { id: 2, name: "UEFA Champions League", logo: "https://media.api-sports.io/football/leagues/2.png", country: "World", priority: 1 },
    { id: 3, name: "UEFA Europa League", logo: "https://media.api-sports.io/football/leagues/3.png", country: "World", priority: 2 },
    { id: 848, name: "UEFA Conference League", logo: "https://media.api-sports.io/football/leagues/848.png", country: "World", priority: 3 },
    { id: 4, name: "UEFA Nations League", logo: "https://media.api-sports.io/football/leagues/4.png", country: "World", priority: 4 },
    { id: 1, name: "World Cup", logo: "https://media.api-sports.io/football/leagues/1.png", country: "World", priority: 5 },
    { id: 5, name: "UEFA Euro", logo: "https://media.api-sports.io/football/leagues/5.png", country: "World", priority: 6 },
    { id: 15, name: "FIFA Club World Cup", logo: "https://media.api-sports.io/football/leagues/15.png", country: "World", priority: 7 }
  ]
};

// Helper function to get leagues for a specific country
export function getLeaguesForCountry(country: string): LeagueInfo[] {
  return LEAGUES_BY_COUNTRY[country] || [];
}

// Helper function to get all countries with leagues
export function getCountriesWithLeagues(): string[] {
  return Object.keys(LEAGUES_BY_COUNTRY);
}

// Helper function to merge static leagues with dynamic fixture data
export function mergeStaticWithDynamicLeagues(
  staticLeagues: LeagueInfo[],
  fixtureLeagues: any[]
): any[] {
  const merged = [...staticLeagues];
  
  // Add any leagues from fixtures that aren't in static data
  fixtureLeagues.forEach(fixtureLeague => {
    const exists = staticLeagues.some(static => static.id === fixtureLeague.league.id);
    if (!exists) {
      merged.push({
        id: fixtureLeague.league.id,
        name: fixtureLeague.league.name,
        logo: fixtureLeague.league.logo,
        country: fixtureLeague.league.country,
        priority: 999 // Lower priority for dynamic leagues
      });
    }
  });
  
  return merged.sort((a, b) => a.priority - b.priority);
}
