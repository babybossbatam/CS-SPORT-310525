
interface ProcessCountryDataMessage {
  type: 'PROCESS_COUNTRY_DATA';
  fixtures: any[];
  selectedDate: string;
  popularLeagues: number[];
}

interface ProcessedCountryDataResponse {
  type: 'COUNTRY_DATA_PROCESSED';
  data: any;
  cacheKey: string;
}

self.onmessage = function(e: MessageEvent<ProcessCountryDataMessage>) {
  const { fixtures, selectedDate, popularLeagues } = e.data;
  
  if (!fixtures?.length) {
    self.postMessage({
      type: 'COUNTRY_DATA_PROCESSED',
      data: {},
      cacheKey: `processed-country-data-${selectedDate}`
    });
    return;
  }

  const countryMap = new Map<string, any>();
  const seenFixtures = new Set<number>();

  // Single pass processing with optimizations
  for (const fixture of fixtures) {
    if (!fixture?.fixture?.id || !fixture?.teams || !fixture?.league || 
        seenFixtures.has(fixture.fixture.id)) continue;

    const fixtureDate = fixture.fixture.date;
    if (!fixtureDate || !fixtureDate.startsWith(selectedDate)) continue;

    const country = fixture.league.country;
    if (!country) continue;

    seenFixtures.add(fixture.fixture.id);

    const leagueId = fixture.league.id;
    const leagueName = fixture.league.name || "";
    
    // Build country data structure
    if (!countryMap.has(country)) {
      countryMap.set(country, {
        country,
        leagues: {},
        hasPopularLeague: false
      });
    }

    const countryData = countryMap.get(country);
    if (!countryData.leagues[leagueId]) {
      const isPopular = popularLeagues.includes(leagueId);
      countryData.leagues[leagueId] = {
        league: fixture.league,
        matches: [],
        isPopular
      };
      if (isPopular) countryData.hasPopularLeague = true;
    }

    countryData.leagues[leagueId].matches.push(fixture);
  }

  const result = Object.fromEntries(countryMap);
  
  self.postMessage({
    type: 'COUNTRY_DATA_PROCESSED',
    data: result,
    cacheKey: `processed-country-data-${selectedDate}`
  });
};
