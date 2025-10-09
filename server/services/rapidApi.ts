import axios from "axios";
import { FixtureResponse, LeagueResponse, PlayerStatistics } from "../types";
//import { b365ApiService } from './b365Api'; // Removed B365 API import

// Define standings type
interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: any[][];
  };
}

// Initialize API client
const apiKey = process.env.RAPID_API_KEY || "";
console.log(
  `Using RapidAPI Key: ${apiKey ? apiKey.substring(0, 5) + "..." : "NOT SET"}`,
);

const apiClient = axios.create({
  baseURL: "https://api-football-v1.p.rapidapi.com/v3",
  headers: {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
  },
});

// Optimized cache durations for performance
const LIVE_DATA_CACHE_DURATION = 30 * 1000; // 30 seconds for live data
const TODAY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for today
const FUTURE_CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour for future dates
const PAST_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for past dates
const STATIC_DATA_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for static data

// Lightweight cache objects with size limits
const fixturesCache = new Map<string, { data: any; timestamp: number }>();
const leaguesCache = new Map<string, { data: any; timestamp: number }>();
const playersCache = new Map<string, { data: any; timestamp: number }>();

// Cache cleanup to prevent memory leaks
const cleanupCache = (cache: Map<string, any>, maxSize: number = 100) => {
  if (cache.size > maxSize) {
    const entries = Array.from(cache.entries());
    const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    cache.clear();
    sortedEntries.slice(0, maxSize / 2).forEach(([key, value]) => {
      cache.set(key, value);
    });
  }
};

// Clean caches every 5 minutes
setInterval(() => {
  cleanupCache(fixturesCache, 50);
  cleanupCache(leaguesCache, 30);
  cleanupCache(playersCache, 40);
}, 5 * 60 * 1000);

// Mock data for popular leagues and teams
const popularLeagues: { [leagueId: number]: string[] } = {
  2: ["Real Madrid", "Manchester City", "Bayern Munich", "PSG", "Inter"], // Champions League
  3: ["Liverpool", "Atalanta", "Marseille", "Roma", "Leverkusen"], // Europa League
  39: [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Man United",
    "Man City",
    "Tottenham",
  ], // Premier League
  140: [
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Athletic Bilbao",
    "Sevilla",
  ], // La Liga
  135: ["Inter", "Milan", "Juventus", "Roma", "Napoli"], // Serie A
  78: ["Bayern Munich", "Dortmund", "Leipzig", "Leverkusen", "Frankfurt"], // Bundesliga
};

export const rapidApiService = {
  /**
   * Get match predictions from RapidAPI
   */
  async getMatchPredictions(fixtureId: number): Promise<any> {
    const cacheKey = `predictions-${fixtureId}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Cache predictions for 2 hours
    if (cached && now - cached.timestamp < 2 * 60 * 60 * 1000) {
      console.log(`📊 [RapidAPI] Using cached predictions for fixture ${fixtureId}`);
      return cached.data;
    }

    try {
      console.log(`📊 [RapidAPI] Fetching predictions for fixture ${fixtureId}`);

      const response = await apiClient.get("/predictions", {
        params: { 
          fixture: fixtureId
        },
      });

      console.log(`📊 [RapidAPI] Predictions API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response && response.data.response.length > 0) {
        const predictionsData = response.data.response[0];
        playersCache.set(cacheKey, {
          data: predictionsData,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Successfully cached predictions for fixture ${fixtureId}`);
        return predictionsData;
      }

      console.log(`❌ [RapidAPI] No predictions data for fixture ${fixtureId}`);
      return null;
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching predictions for fixture ${fixtureId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  /**
   * Get odds for a specific fixture
   */
  async getFixtureOdds(fixtureId: number): Promise<any> {
    const cacheKey = `odds-${fixtureId}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Cache odds for 1 hour (they change more frequently)
    if (cached && now - cached.timestamp < 60 * 60 * 1000) {
      console.log(`📊 [RapidAPI] Using cached odds for fixture ${fixtureId}`);
      return cached.data;
    }

    try {
      console.log(`📊 [RapidAPI] Fetching odds for fixture ${fixtureId}`);

      const response = await apiClient.get("/odds", {
        params: { 
          fixture: fixtureId
        },
      });

      console.log(`📊 [RapidAPI] Odds API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response && response.data.response.length > 0) {
        const oddsData = response.data.response;
        playersCache.set(cacheKey, {
          data: oddsData,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Successfully cached odds for fixture ${fixtureId}`);
        return oddsData;
      }

      console.log(`❌ [RapidAPI] No odds data for fixture ${fixtureId}`);
      return null;
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching odds for fixture ${fixtureId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  /**
   * Get player statistics for a specific player, team, and season
   */
  async getPlayerStatistics(playerId?: number, teamId?: number, season: number = 2024): Promise<any> {
    const cacheKey = `player-stats-${playerId || 'team'}-${teamId || 'all'}-${season}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Use longer cache duration for player stats (4 hours)
    if (cached && now - cached.timestamp < 4 * 60 * 60 * 1000) {
      console.log(`📦 [RapidAPI] Using cached player statistics for ${playerId ? `player ${playerId}` : `team ${teamId}`}`);
      return cached.data;
    }

    try {
      console.log(`📊 [RapidAPI] Fetching player statistics for ${playerId ? `player ${playerId}` : `team ${teamId}`}, season ${season}`);

      const params: any = {
        season: season
      };

      if (playerId) {
        params.id = playerId;
      }

      if (teamId) {
        params.team = teamId;
      }

      const response = await apiClient.get("/players", {
        params,
      });

      console.log(`📊 [RapidAPI] Player stats API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response && response.data.response.length > 0) {
        const playerData = response.data.response;
        playersCache.set(cacheKey, {
          data: playerData,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Successfully cached player statistics for ${playerId ? `player ${playerId}` : `team ${teamId}`}`);
        return playerData;
      }

      console.log(`❌ [RapidAPI] No statistics data for ${playerId ? `player ${playerId}` : `team ${teamId}`}, season ${season}`);
      return null;
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching player statistics for ${playerId ? `player ${playerId}` : `team ${teamId}`}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  /**
   * Get team statistics for a specific league and season
   */
  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<any> {
    const cacheKey = `team-stats-${teamId}-${leagueId}-${season}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Use longer cache duration for team stats (4 hours)
    if (cached && now - cached.timestamp < 4 * 60 * 60 * 1000) {
      console.log(`📦 [RapidAPI] Using cached team statistics for team ${teamId}`);
      return cached.data;
    }

    try {
      console.log(`📊 [RapidAPI] Fetching team statistics for team ${teamId}, league ${leagueId}, season ${season}`);

      const response = await apiClient.get("/teams/statistics", {
        params: { 
          team: teamId, 
          league: leagueId, 
          season: season 
        },
      });

      console.log(`📊 [RapidAPI] Team stats API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        const statsData = response.data.response;
        playersCache.set(cacheKey, {
          data: statsData,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Successfully cached team statistics for team ${teamId}`);
        return statsData;
      }

      console.log(`❌ [RapidAPI] No statistics data for team ${teamId}, league ${leagueId}, season ${season}`);
      return null;
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching team statistics for team ${teamId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },
  /**
   * Get fixtures by date with comprehensive timezone handling (365scores.com approach)
   */
  async getFixturesByDate(
    date: string,
    fetchAll: boolean = false,
  ): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-date-${date}${fetchAll ? "-all" : ""}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const isToday = date === today;
    const isPast = date < today;
    const isFuture = date > today;

    // Smart cache duration based on date type
    let cacheTime;
    if (isPast) {
      cacheTime = PAST_CACHE_DURATION; // 24 hours for past dates
    } else if (isToday) {
      cacheTime = TODAY_CACHE_DURATION; // 10 minutes for today
    } else if (isFuture) {
      cacheTime = FUTURE_CACHE_DURATION; // 2 hours for future dates
    } else {
      cacheTime = TODAY_CACHE_DURATION; // fallback
    }

    if (cached && now - cached.timestamp < cacheTime) {
      const ageMinutes = Math.round((now - cached.timestamp) / 60000);
      const cacheType = isPast ? "past" : isToday ? "today" : "future";
      const dateStr = date;

      // Enhanced logging for cache status
      console.log(`📦 [RapidAPI] Using cached fixtures for ${dateStr} (age: ${ageMinutes}min, type: ${cacheType}, size: ${cached.data.length})`);

      return cached.data;
    }

    try {
      let allFixtures: FixtureResponse[] = [];

      // For today's matches, prioritize live data first
      if (isToday) {
        try {
          console.log(`Getting live fixtures first for today (${date})`);
          const liveFixtures = await this.getLiveFixtures();

          if (liveFixtures && liveFixtures.length > 0) {
            console.log(`Found ${liveFixtures.length} live fixtures for today`);
            // Validate live fixtures before adding
            const validLiveFixtures = liveFixtures.filter(
              (fixture) =>
                fixture &&
                fixture.fixture &&
                fixture.league &&
                fixture.teams &&
                fixture.teams.home &&
                fixture.teams.away &&
                fixture.teams.home.name &&
                fixture.teams.away.name,
            );
            allFixtures = [...validLiveFixtures];
          }
        } catch (liveError) {
          console.error("Error fetching live fixtures for today:", liveError);
        }
      }

      if (fetchAll) {
        console.log(
          `[Timezone-inclusive fetching] Fetching fixtures with expanded date range for World competitions`,
        );

        // Timezone-inclusive fetching: Queries ±1 day to catch all timezone variations
        const requestedDate = new Date(date);
        const previousDay = new Date(requestedDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const nextDay = new Date(requestedDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const dateRange = [
          previousDay.toISOString().split("T")[0],
          date,
          nextDay.toISOString().split("T")[0],
        ];

        console.log(
          `[Timezone-inclusive] Querying date range: ${dateRange.join(", ")} for World competitions`,
        );

        // Fetch fixtures from all dates in range
        for (const queryDate of dateRange) {
          try {
            console.log(
              `🌍 [RapidAPI] Making API request for date: ${queryDate}`,
            );

            const response = await apiClient.get("/fixtures", {
              params: {
                date: queryDate,
              },
            });

            console.log(
              `📡 [RapidAPI] API response for ${queryDate}: status ${response.status}, results: ${response.data?.results || 0}`,
            );

            if (response.data && response.data.response) {
              const dateFixtures = response.data.response;

              // Filter fixtures for World competitions only
              const validFixtures = dateFixtures.filter((fixture: any) => {
                try {
                  // Check date validity
                  if (!fixture?.fixture?.date) {
                    return false;
                  }

                  // Simple date matching for timezone variations
                  const validDateChecks = this.isFixtureValidForDate(
                    fixture,
                    date,
                  );

                  if (!validDateChecks.isValid) {
                    return false;
                  }

                  // Check required data structure
                  if (
                    !fixture.league ||
                    !fixture.league.id ||
                    !fixture.league.name
                  )
                    return false;
                  if (
                    !fixture.teams ||
                    !fixture.teams.home ||
                    !fixture.teams.away
                  )
                    return false;
                  if (!fixture.teams.home.name || !fixture.teams.away.name)
                    return false;

                  // Set default values for missing data
                  if (!fixture.league.country)
                    fixture.league.country = "Unknown";
                  if (!fixture.league.logo)
                    fixture.league.logo =
                      "https://media.api-sports.io/football/leagues/1.png";
                  if (!fixture.teams.home.logo)
                    fixture.teams.home.logo = "/assets/fallback-logo.png";
                  if (!fixture.teams.away.logo)
                    fixture.teams.away.logo = "/assets/fallback-logo.png";

                  // Enhanced esports filtering
                  if (this.isEsportsFixture(fixture)) {
                    return false;
                  }

                  // Filter out fixtures with null/undefined country
                  if (
                    fixture.league.country === null ||
                    fixture.league.country === undefined ||
                    fixture.league.country === ""
                  ) {
                    return false;
                  }

                  // Additional check for suspicious country values
                  if (
                    typeof fixture.league.country === "string" &&
                    fixture.league.country.toLowerCase().includes("unknown")
                  ) {
                    return false;
                  }

                  return true;
                } catch (error) {
                  console.error("Error validating fixture:", error, fixture);
                  return false;
                }
              });

              console.log(
                `Retrieved ${dateFixtures.length} fixtures from ${queryDate}, ${validFixtures.length} valid for target date ${date}`,
              );

              // Merge with existing fixtures, avoiding duplicates
              const existingIds = new Set(allFixtures.map((f) => f.fixture.id));
              const newFixtures = validFixtures.filter(
                (f: any) => !existingIds.has(f.fixture.id),
              );
              allFixtures = [...allFixtures, ...newFixtures];
            }
          } catch (error) {
            console.error(
              `Error fetching fixtures for date ${queryDate}:`,
              error,
            );
            continue;
          }
        }

        console.log(
          `[Timezone-inclusive] Total fixtures collected: ${allFixtures.length} for date ${date}`,
        );
      } else {
        // Define popular leagues - matches core leagues
        const popularLeagues = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

        for (const leagueId of popularLeagues) {
          try {
            const leagueFixtures = await this.getFixturesByLeague(
              leagueId,
              2024,
            );
            const dateFixtures = leagueFixtures.filter((fixture) => {
              const validDateChecks = this.isFixtureValidForDate(fixture, date);
              return validDateChecks.isValid;
            });

            // Merge avoiding duplicates
            const existingIds = new Set(allFixtures.map((f) => f.fixture.id));
            const newFixtures = dateFixtures.filter(
              (f) => !existingIds.has(f.fixture.id),
            );
            allFixtures = [...allFixtures, ...newFixtures];
          } catch (error) {
            console.error(
              `Error fetching fixtures for league ${leagueId}:`,
              error,
            );
            continue;
          }
        }

        console.log(
          `Popular leagues: ${allFixtures.length} total fixtures for ${date}`,
        );
      }

      // Sort fixtures for today: Live first, then upcoming, then finished
      if (isToday && allFixtures.length > 0) {
        allFixtures.sort((a, b) => {
          const aStatus = a.fixture.status.short;
          const bStatus = b.fixture.status.short;

          // Live matches first
          const aLive = [
            "LIVE",
            "1H",
            "HT",
            "2H",
            "ET",
            "BT",
            "P",
            "INT",
          ].includes(aStatus);
          const bLive = [
            "LIVE",
            "1H",
            "HT",
            "2H",
            "ET",
            "BT",
            "P",
            "INT",
          ].includes(bStatus);
          if (aLive && !bLive) return -1;
          if (!aLive && bLive) return 1;

          // Then upcoming matches
          const aUpcoming =
            aStatus === "NS" && new Date(a.fixture.date) > new Date();
          const bUpcoming =
            bStatus === "NS" && new Date(b.fixture.date) > new Date();
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;

          // Finally by time
          return (
            new Date(a.fixture.date).getTime() -
            new Date(b.fixture.date).getTime()
          );
        });

        console.log(
          `Sorted ${allFixtures.length} fixtures for today - prioritizing live matches`,
        );
      }

      fixturesCache.set(cacheKey, {
        data: allFixtures,
        timestamp: now,
      });

      return allFixtures;
    } catch (error) {
      console.error("RapidAPI: Error fetching fixtures by date:", error);

      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      if (error instanceof Error) {
        throw new Error(`Failed to fetch fixtures: ${error.message}`);
      }
      throw new Error("Failed to fetch fixtures: Unknown error");
    }
  },

  /**
   * Inclusive date validation - allow fixtures from all timezones
   * Server gets all potentially relevant fixtures, client does precise filtering
   */
  isFixtureValidForDate(
    fixture: any,
    targetDate: string,
  ): { isValid: boolean; matchMethod?: string } {
    try {
      const apiDateString = fixture.fixture.date;

      // Extract UTC date from API response (YYYY-MM-DD format)
      const fixtureDate = apiDateString.split("T")[0];

      // Allow fixtures from target date and ±1 day to capture all timezone variations
      const targetDateObj = new Date(targetDate);
      const previousDay = new Date(targetDateObj);
      previousDay.setDate(previousDay.getDate() - 1);
      const nextDay = new Date(targetDateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      const validDates = [
        previousDay.toISOString().split("T")[0],
        targetDate,
        nextDay.toISOString().split("T")[0],
      ];

      if (validDates.includes(fixtureDate)) {
        return { isValid: true, matchMethod: "timezone-inclusive" };
      }

      return { isValid: false };
    } catch (error) {
      console.error("Error in date validation:", error);
      return { isValid: false };
    }
  },

  /**
   * Enhanced esports detection
   */
  isEsportsFixture(fixture: any): boolean {
    const leagueName = fixture.league?.name?.toLowerCase() || "";
    const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
    const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

    // Expanded esports exclusion terms
    const esportsTerms = [
      "esoccer",
      "ebet",
      "cyber",
      "esports",
      "e-sports",
      "virtual",
      "fifa",
      "pro evolution soccer",
      "pes",
      "efootball",
      "e-football",
      "volta",
      "ultimate team",
      "clubs",
      "gaming",
      "game",
      "simulator",
      "simulation",
      "digital",
      "online",
      "battle",
      "legend",
      "champion",
      "tournament online",
      "vs online",
      "gt sport",
      "rocket league",
      "fc online",
      "dream league",
      "top eleven",
      "football manager",
      "championship manager",
      "mobile",
      "app",
    ];

    // Check if any esports term exists in league or team names
    return esportsTerms.some(
      (term) =>
        leagueName.includes(term) ||
        homeTeamName.includes(term) ||
        awayTeamName.includes(term),
    );
  },

  /**
   * Get live fixtures - ALWAYS fetch fresh data for live matches
   */
  async getLiveFixtures(): Promise<FixtureResponse[]> {
    // NO CACHE for live fixtures - always fetch fresh data for accuracy

    try {
      console.log(
        "🔴 [RapidAPI PRO] Fetching live fixtures without timezone restriction...",
      );
      const response = await apiClient.get("/fixtures", {
        params: {
          live: "all",
          // No timezone parameter - get all live fixtures regardless of timezone
        },
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
        },
      });

      if (
        response.data &&
        response.data.response &&
        response.data.response.length > 0
      ) {
        // Enhanced esports filtering for live fixtures
        const filteredLiveFixtures = response.data.response.filter(
          (fixture: any) => {
            const leagueName = fixture.league?.name?.toLowerCase() || "";
            const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
            const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

            // Same expanded esports terms
            const esportsTerms = [
              "esoccer",
              "ebet",
              "cyber",
              "esports",
              "e-sports",
              "virtual",
              "fifa",
              "pro evolution soccer",
              "pes",
              "efootball",
              "e-football",
              "volta",
              "ultimate team",
              "clubs",
              "gaming",
              "game",
              "simulator",
              "simulation",
              "digital",
              "online",
              "battle",
              "legend",
              "champion",
              "tournament online",
              "vs online",
              "gt sport",
              "rocket league",
              "fc online",
              "dream league",
              "top eleven",
              "football manager",
              "championship manager",
              "mobile",
              "app",
            ];

            const isEsports = esportsTerms.some(
              (term) =>
                leagueName.includes(term) ||
                homeTeamName.includes(term) ||
                awayTeamName.includes(term),
            );

            // Enhanced country filtering
            const hasInvalidCountry =
              fixture.league?.country === null ||
              fixture.league?.country === undefined ||
              fixture.league?.country === "" ||
              (typeof fixture.league?.country === "string" &&
                fixture.league.country.toLowerCase().includes("unknown"));
            // Check for valid international tournaments first
            const isValidInternationalTournament =
              (fixture.league.country === "World" ||
                fixture.league.country === "Europe") &&
              (fixture.league.name.toLowerCase().includes("uefa") ||
                fixture.league.name.toLowerCase().includes("fifa") ||
                fixture.league.name.toLowerCase().includes("euro") ||
                fixture.league.name.toLowerCase().includes("championship") ||
                fixture.league.name.toLowerCase().includes("nations league") ||
                fixture.league.name.toLowerCase().includes("world cup"));

            // Allow valid international tournaments through
            if (isValidInternationalTournament) {
              return true;
            }

            if (isEsports || hasInvalidCountry) {
              console.log(
                `Filtering out esports/invalid live fixture: ${fixture.league?.name} (country: ${fixture.league?.country})`,
              );
              return false;
            }

            return true;
          },
        );

        console.log(
          `🔴 [LIVE API] Retrieved ${response.data.response.length} live fixtures, ${filteredLiveFixtures.length} after filtering (NO CACHE - always fresh)`,
        );
        // NO CACHING for live fixtures - always return fresh data
        return filteredLiveFixtures;
      }

      /*  Removed B365 API fallback
      // If RapidAPI returns no live fixtures, try B365API as fallback
      console.log('RapidAPI: No live fixtures found, trying B365API as fallback...');
      const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

      if (b365LiveMatches && b365LiveMatches.length > 0) {
        // Convert B365 matches to RapidAPI format
        const convertedMatches = b365LiveMatches.map(match => 
          b365ApiService.convertToRapidApiFormat(match)
        );

        console.log(`B365API Fallback: Retrieved ${convertedMatches.length} live fixtures`);
        fixturesCache.set(cacheKey, { 
          data: convertedMatches, 
          timestamp: now 
        });
        return convertedMatches;
      }
      */

      return [];
    } catch (error) {
      console.error("RapidAPI: Error fetching live fixtures:", error);

      /* Removed B365 API fallback
      // Try B365API as fallback when RapidAPI fails
      try {
        console.log('RapidAPI failed, trying B365API as fallback...');
        const b365LiveMatches = await b365ApiService.getLiveFootballMatches();

        if (b365LiveMatches && b365LiveMatches.length > 0) {
          const convertedMatches = b365LiveMatches.map(match => 
            b365ApiService.convertToRapidApiFormat(match)
          );

          console.log(`B365API Fallback: Retrieved ${convertedMatches.length} live fixtures after RapidAPI error`);
          fixturesCache.set(cacheKey, { 
            data: convertedMatches, 
            timestamp: now 
          });
          return convertedMatches;
        }
      } catch (b365Error) {
        console.error('B365API Fallback also failed:', b365Error);
      }
      */

      // For live fixtures, we don't use cache as fallback since they need real-time data
      console.error("Live fixture API request failed - returning empty array for real-time accuracy");
      return [];
    }
  },

  /**
   * Get fixture by ID
   */
  async getFixtureById(id: number): Promise<FixtureResponse | null> {
    const cacheKey = `fixture-${id}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get("/fixtures", {
        params: {
          id,
          // No timezone parameter - get fixture in its original timezone
        },
      });

      if (
        response.data &&
        response.data.response &&
        response.data.response.length > 0
      ) {
        const fixtureData = response.data.response[0];
        fixturesCache.set(cacheKey, {
          data: fixtureData,
          timestamp: now,
        });
        return fixtureData;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching fixture with ID ${id}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  async getFixtureEvents(fixtureId: number): Promise<any[]> {
    try {
      console.log(`📊 [RapidAPI] Fetching events for fixture: ${fixtureId}`);

      const response = await apiClient.get("/fixtures/events", {
        params: {
          fixture: fixtureId
        }
      });

      if (response.data?.response) {
        const events = response.data.response;
        console.log(`✅ [RapidAPI] Found ${events.length} events for fixture ${fixtureId}`);

        // Sort events by time elapsed (most recent first)
        events.sort((a: any, b: any) => {
          const timeA = a.time?.elapsed || 0;
          const timeB = b.time?.elapsed || 0;
          return timeB - timeA;
        });

        return events;
      }

      console.log(`📊 [RapidAPI] No events found for fixture ${fixtureId}`);
      return [];
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching events for fixture ${fixtureId}:`, error);
      return null;
    }
  },

  async getFixturePlayerStatistics(fixtureId: number): Promise<any[]> {
    const cacheKey = `fixture-players-${fixtureId}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      console.log(`👥 [RapidAPI] Using cached player statistics for fixture ${fixtureId}`);
      return cached.data;
    }

    try {
      console.log(`👥 [RapidAPI] Fetching player statistics for fixture ${fixtureId}`);

      const response = await apiClient.get("/fixtures/players", {
        params: {
          fixture: fixtureId,
        },
      });

      if (response.data?.response) {
        const playerStats = response.data.response;
        playersCache.set(cacheKey, {
          data: playerStats,
timestamp: now,
        });console.log(`✅ [RapidAPI] Found player statistics for fixture ${fixtureId}, teams: ${playerStats.length}`);
        return playerStats;
      }

      console.log(`👥 [RapidAPI] No player statistics found for fixture ${fixtureId}`);
      return [];
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching player statistics for fixture ${fixtureId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  async getFixtureStatistics(fixtureId: number, teamId?: number): Promise<any[]> {
    const cacheKey = teamId ? `fixture-stats-${fixtureId}-${teamId}` : `fixture-stats-${fixtureId}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < LIVE_DATA_CACHE_DURATION) {
      console.log(`📊 [RapidAPI] Using cached statistics for fixture ${fixtureId}${teamId ? ` and team ${teamId}` : ''}`);
      return cached.data;
    }

    try {
      console.log(`📊 [RapidAPI] Fetching statistics for fixture ${fixtureId}${teamId ? ` and team ${teamId}` : ''}`);

      const params: any = {
        fixture: fixtureId,
      };
      if (teamId) {
        params.team = teamId;
      }

      const response = await apiClient.get("/fixtures/statistics", {
        params,
      });

      if (response.data?.response) {
        const statistics = response.data.response;
        playersCache.set(cacheKey, {
          data: statistics,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Found statistics for fixture ${fixtureId}${teamId ? ` and team ${teamId}` : ''}`);
        return statistics;
      }

      console.log(`📊 [RapidAPI] No statistics found for fixture ${fixtureId}${teamId ? ` and team ${teamId}` : ''}`);
      return [];
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching statistics for fixture ${fixtureId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  async getFixtureRounds(leagueId: number, season: number): Promise<string[]> {
    try {
      const response = await apiClient.get("/fixtures/rounds", {
        params: {
          league: leagueId.toString(),
          season: season.toString(),
        },
      });

      if (response.data && response.data.response) {
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching rounds for league ${leagueId}, season ${season}:`, error);
      return [];
    }
  },

  /**
   * Get fixtures by league ID and season
   */
  async getFixturesByLeague(
    leagueId: number,
    season: number,
    forceRefresh: boolean = false,
  ): Promise<FixtureResponse[]> {
    const cacheKey = `fixtures-league-${leagueId}-${season}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    if (!forceRefresh && cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      // Check for status transitions that might require fresh data
      const cachedData = cached.data;
      if (Array.isArray(cachedData)) {
        const hasLiveMatches = cachedData.some((fixture: any) => 
          ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
        );

        // Force refresh if cached data contains live matches (they need frequent updates)
        if (hasLiveMatches && now - cached.timestamp > LIVE_DATA_CACHE_DURATION) {
          console.log(`[RapidAPI] Cache contains live matches, forcing refresh for league ${leagueId}`);
          forceRefresh = true;
        } else {
          return cached.data;
        }
      } else {
        return cached.data;
      }
    }

    if (forceRefresh) {
      console.log(`[RapidAPI] Force refreshing fixtures for league ${leagueId} (bypassing cache)`);
    }

    try {
      console.log(`Fetching fixtures for league ${leagueId}, season ${season}`);

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason =
        leagueInfo.seasons.find((s) => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(
        `Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`,
      );

      const response = await apiClient.get("/fixtures", {
        params: {
          league: leagueId,
          season: correctSeason,
          // No timezone parameter - get all fixtures for the league
        },
      });

      console.log(
        `Fixtures API response status: ${response.status}, results count: ${response.data?.results || 0}`,
      );

      if (response.data && response.data.response) {
        // Include all fixtures from the requested league
        const filteredFixtures = response.data.response;

        // Log the fixtures count
        console.log(
          `Received ${response.data.response.length} fixtures for league ${leagueId}`,
        );

        fixturesCache.set(cacheKey, {
          data: filteredFixtures,
          timestamp: now,
        });
        return filteredFixtures;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return [];
    }
  },

  /**
   * Get all available leagues
   */
  async getLeagues(): Promise<LeagueResponse[]> {
    const cacheKey = "leagues-all";
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get("/leagues");

      if (response.data && response.data.response) {
        leaguesCache.set(cacheKey, {
          data: response.data.response,
          timestamp: now,
        });
        return response.data.response;
      }

      return [];
    } catch (error) {
      console.error("Error fetching leagues:", error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return [];
    }
  },

  /**
   * Get league by ID
   */
  async getLeagueById(id: number): Promise<LeagueResponse | null> {
    const cacheKey = `league-${id}`;
    const cached = leaguesCache.get(cacheKey);

    const now = Date.now();
    if (cached && now - cached.timestamp < STATIC_DATA_CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`Fetching league with ID ${id}`);
      const response = await apiClient.get("/leagues", {
        params: { id },
      });

      console.log(
        `API response status: ${response.status}, data:`,
        JSON.stringify(response.data).substring(0, 200) + "...",
      );

      if (
        response.data &&
        response.data.response &&
        response.data.response.length > 0
      ) {
        const leagueData = response.data.response[0];
        leaguesCache.set(cacheKey, {
          data: leagueData,
          timestamp: now,
        });
        return leagueData;
      }

      console.log(`No league data found for ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error fetching league with ID ${id}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  /**
   * Get top scorers for a league and season
   */
  async getTopScorers(
    leagueId: number,
    season: number,
  ): Promise<PlayerStatistics[]> {
    const cacheKey = `top-scorers-${leagueId}-${season}`;
    const cached = playersCache.get(cacheKey);

    const now = Date.now();
    // Use longer cache duration for top scorers (2 hours - for better performance)
    if (cached && now - cached.timestamp < 2 * 60 * 60 * 1000) {
      return cached.data;
    }

    try {
      console.log(
        `Fetching top scorers for league ${leagueId}, season ${season}`,
      );

      // First let's check if the league exists and get the current season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`League with ID ${leagueId} not found`);
        return [];
      }

      // Find the current season
      const currentSeason =
        leagueInfo.seasons.find((s) => s.current) || leagueInfo.seasons[0];
      if (!currentSeason) {
        console.log(`No season data found for league ${leagueId}`);
        return [];
      }

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(
        `Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`,
      );

      const response = await apiClient.get("/players/topscorers", {
        params: { league: leagueId, season: correctSeason },
      });

      console.log(
        `Top scorers API response status: ${response.status}, results count: ${response.data?.results || 0}`,
      );

      if (response.data && response.data.response) {
        playersCache.set(cacheKey, {
          data: response.data.response,
          timestamp: now,
        });
        return response.data.response;
      }

      console.log(
        `No top scorers data for league ${leagueId}, season ${correctSeason}`,
      );
      return [];
    } catch (error) {
      console.error(
        `Error fetching top scorers for league ${leagueId}:`,
        error,
      );
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return [];
    }
  },

  /**
   * Get top scorers with enhanced photo handling
   */
  async getTopScorersWithPhotos(
    leagueId: number,
    season: number,
  ): Promise<any[]> {
    try {
      const topScorers = await this.getTopScorers(leagueId, season);

      // Process and enhance the data with better photo handling
      return topScorers.map((scorer: any) => {
        const playerStats = scorer.statistics[0];
        const goals = playerStats?.goals?.total || 0;

        // Enhanced photo URL with fallback
        let photoUrl = scorer.player?.photo;
        if (!photoUrl || photoUrl.includes('default.png')) {
          // Use 365Scores CDN as fallback
          photoUrl = `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${scorer.player.id}`;
        }

        return {
          id: scorer.player.id,
          name: scorer.player.name,
          photo: photoUrl,
          position: scorer.player.position || playerStats?.games?.position || 'Unknown',
          goals: goals,
          team: {
            id: playerStats?.team?.id,
            name: playerStats?.team?.name,
            logo: playerStats?.team?.logo
          },
          league: {
            id: playerStats?.league?.id,
            name: playerStats?.league?.name,
            country: playerStats?.league?.country
          },
          stats: {
            appearances: playerStats?.games?.appearences || 0,
            assists: playerStats?.assists || 0,
            rating: playerStats?.games?.rating || '0.0'
          }
        };
      });
    } catch (error) {
      console.error(`Error fetching top scorers with photos for league ${leagueId}:`, error);
      return [];
    }
  },

  /**
   * Get league standings by league ID and season
   */
  async getLeagueStandings(leagueId: number, season?: number) {
    const cacheKey = `standings_${leagueId}_${season || "current"}`;
    const cached = leaguesCache.get(cacheKey);
    const now = Date.now();

    // Use longer cache duration for standings (2 hours instead of 1 hour)
    const STANDINGS_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

    if (cached && now - cached.timestamp < STANDINGS_CACHE_DURATION) {
      console.log(
        `🎯 Using server cached standings for league ${leagueId} (age: ${Math.floor((now - cached.timestamp) / 60000)} min)`,
      );
      return cached.data;
    }

    try {
      // Get league info to determine correct season
      const leagueInfo = await this.getLeagueById(leagueId);
      if (!leagueInfo) {
        console.log(`No league info found for league ${leagueId}`);
        return null;
      }

      // Get current season info
      const currentSeason = leagueInfo.seasons?.[leagueInfo.seasons.length - 1];
      if (!currentSeason) {
        console.log(`No season info for league ${leagueId}`);
        return null;
      }

      console.log(
        `🔍 Fetching fresh standings for league ${leagueId}, season ${season || "current"}`,
      );

      // Use the correct season from the league info
      const correctSeason = currentSeason.year;
      console.log(
        `Using correct season ${correctSeason} for league ${leagueId} (${leagueInfo.league.name})`,
      );

      const response = await apiClient.get("/standings", {
        params: { league: leagueId, season: correctSeason },
      });

      console.log(
        `Standings API response status: ${response.status}, results count: ${response.data?.results || 0}`,
      );

      if (
        response.data &&
        response.data.response &&
        response.data.response.length > 0
      ) {
        const standingsData = response.data.response[0];
        leaguesCache.set(cacheKey, {
          data: standingsData,
          timestamp: now,
        });
        console.log(
          `💾 Cached server standings for league ${leagueId} for 2 hours`,
        );
        return standingsData;
      }

      console.log(
        `No standings data for league ${leagueId}, season ${correctSeason}`,
      );
      return null;
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return null;
    }
  },

  /**
   * Get head-to-head fixtures between two teams
   */
  async getHeadToHeadFixtures(h2h: string, season: number = 2025): Promise<any> {
    const cacheKey = `h2h-${h2h}-${season}`;
    const cached = fixturesCache.get(cacheKey);

    const now = Date.now();
    // Cache head-to-head data for 2 hours
    if (cached && now - cached.timestamp < 2 * 60 * 60 * 1000) {
      console.log(`📦 [RapidAPI] Using cached head-to-head data for ${h2h}`);
      return cached.data;
    }

    try {
      console.log(`🔍 [RapidAPI] Fetching head-to-head data for teams: ${h2h}, season: ${season}`);

      const response = await apiClient.get("/fixtures/headtohead", {
        params: {
          h2h: h2h,
          season: season
        },
      });

      console.log(`📊 [RapidAPI] Head-to-head API response status: ${response.status}, results count: ${response.data?.results || 0}`);

      if (response.data && response.data.response) {
        const h2hData = response.data.response;
        fixturesCache.set(cacheKey, {
          data: response.data,
          timestamp: now,
        });
        console.log(`✅ [RapidAPI] Successfully cached head-to-head data for ${h2h}`);
        return response.data;
      }

      console.log(`❌ [RapidAPI] No head-to-head data for ${h2h}, season ${season}`);
      return { response: [] };
    } catch (error) {
      console.error(`❌ [RapidAPI] Error fetching head-to-head data for ${h2h}:`, error);
      if (cached?.data) {
        console.log("Using cached data due to API error");
        return cached.data;
      }
      console.error("API request failed and no cache available");
      return { response: [] };
    }
  },
};

// Removing emoji characters from console logs to prevent build errors.