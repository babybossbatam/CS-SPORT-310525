
import { format, addDays, subDays } from 'date-fns';
import axios from 'axios';

interface U21Match {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

class UefaU21ApiService {
  private readonly leagueId = 38; // UEFA U21 Championship
  private readonly qualificationLeagueId = 867; // UEFA European Under-21 Championship Qualification

  /**
   * Get real UEFA U21 fixtures from RapidAPI
   */
  async getRealU21Matches(): Promise<U21Match[]> {
    try {
      console.log('🏆 [UEFA U21] Fetching REAL UEFA U21 matches from RapidAPI...');

      if (!process.env.RAPIDAPI_KEY) {
        console.error('❌ [UEFA U21] RAPIDAPI_KEY not found in environment');
        throw new Error('RAPIDAPI_KEY is required but not found');
      }

      const allMatches: U21Match[] = [];
      const currentYear = new Date().getFullYear();

      // Try multiple seasons and leagues to get real data
      const seasonsToTry = [currentYear, currentYear - 1, currentYear + 1];
      const leaguesToTry = [this.leagueId, this.qualificationLeagueId];

      for (const season of seasonsToTry) {
        for (const leagueId of leaguesToTry) {
          try {
            console.log(`🏆 [UEFA U21] Fetching season ${season} for league ${leagueId}`);

            const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
              params: {
                league: leagueId,
                season: season
              },
              headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
              },
              timeout: 10000
            });

            console.log(`🏆 [UEFA U21] API Response for league ${leagueId} season ${season}:`, {
              status: response.status,
              dataExists: !!response.data,
              responseExists: !!response.data?.response,
              responseLength: response.data?.response?.length || 0
            });

            if (response.data?.response && Array.isArray(response.data.response) && response.data.response.length > 0) {
              const fixtures = response.data.response.map((fixture: any) => ({
                fixture: {
                  id: fixture.fixture.id,
                  date: fixture.fixture.date,
                  status: {
                    long: fixture.fixture.status.long,
                    short: fixture.fixture.status.short
                  },
                  venue: fixture.fixture.venue ? {
                    name: fixture.fixture.venue.name,
                    city: fixture.fixture.venue.city
                  } : undefined
                },
                league: {
                  id: fixture.league.id,
                  name: fixture.league.name,
                  logo: fixture.league.logo,
                  country: fixture.league.country || 'Europe'
                },
                teams: {
                  home: {
                    id: fixture.teams.home.id,
                    name: fixture.teams.home.name,
                    logo: fixture.teams.home.logo
                  },
                  away: {
                    id: fixture.teams.away.id,
                    name: fixture.teams.away.name,
                    logo: fixture.teams.away.logo
                  }
                },
                goals: {
                  home: fixture.goals.home,
                  away: fixture.goals.away
                },
                score: {
                  halftime: {
                    home: fixture.score.halftime.home,
                    away: fixture.score.halftime.away
                  },
                  fulltime: {
                    home: fixture.score.fulltime.home,
                    away: fixture.score.fulltime.away
                  }
                }
              }));

              allMatches.push(...fixtures);
              console.log(`🏆 [UEFA U21] Found ${fixtures.length} REAL matches from league ${leagueId} season ${season}`);
            } else {
              console.log(`⚠️ [UEFA U21] No fixtures found for league ${leagueId} season ${season}`);
            }
          } catch (apiError: any) {
            console.error(`❌ [UEFA U21] Error fetching from league ${leagueId} season ${season}:`, apiError.message);
          }
        }
      }

      // Remove duplicates and sort by date
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.fixture.id === match.fixture.id)
      );

      const sortedMatches = uniqueMatches.sort((a, b) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      console.log(`🏆 [UEFA U21] Returning ${sortedMatches.length} REAL UEFA U21 matches`);

      if (sortedMatches.length === 0) {
        throw new Error('No real UEFA U21 matches found in API');
      }

      return sortedMatches;

    } catch (error: any) {
      console.error('❌ [UEFA U21] Error fetching real U21 matches:', error.message);
      throw error; // Don't return empty array, throw error so frontend shows proper error message
    }
  }

  /**
   * Get upcoming UEFA U21 matches (next 30 days)
   */
  async getUpcomingU21Matches(): Promise<U21Match[]> {
    try {
      const allMatches = await this.getRealU21Matches();
      const now = new Date();
      const upcoming = allMatches.filter(match => {
        const matchDate = new Date(match.fixture.date);
        return matchDate > now && match.fixture.status.short === 'NS';
      });

      console.log(`🏆 [UEFA U21] Found ${upcoming.length} upcoming matches`);
      return upcoming;
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching upcoming matches:', error);
      throw error;
    }
  }

  /**
   * Get recent UEFA U21 matches (past 30 days)
   */
  async getRecentU21Matches(): Promise<U21Match[]> {
    try {
      const allMatches = await this.getRealU21Matches();
      const thirtyDaysAgo = subDays(new Date(), 30);
      const recent = allMatches.filter(match => {
        const matchDate = new Date(match.fixture.date);
        return matchDate >= thirtyDaysAgo && matchDate <= new Date();
      });

      console.log(`🏆 [UEFA U21] Found ${recent.length} recent matches`);
      return recent;
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching recent matches:', error);
      throw error;
    }
  }

  /**
   * Get current season UEFA U21 fixtures
   */
  async getCurrentSeasonU21Fixtures(): Promise<U21Match[]> {
    try {
      const matches = await this.getRealU21Matches();
      console.log(`🏆 [UEFA U21] Returning ${matches.length} current season fixtures`);
      return matches;
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching current season:', error);
      throw error;
    }
  }

  /**
   * Get live UEFA U21 matches
   */
  async getLiveU21Matches(): Promise<U21Match[]> {
    try {
      const allMatches = await this.getRealU21Matches();
      const live = allMatches.filter(match => 
        ['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short)
      );

      console.log(`🏆 [UEFA U21] Found ${live.length} live matches`);
      return live;
    } catch (error) {
      console.error('❌ [UEFA U21] Error fetching live matches:', error);
      throw error;
    }
  }

  /**
   * Search for specific matches by team names
   */
  async searchU21MatchesByTeams(homeTeam: string, awayTeam: string): Promise<U21Match[]> {
    try {
      const allMatches = await this.getRealU21Matches();
      const matches = allMatches.filter(match => 
        match.teams.home.name.toLowerCase().includes(homeTeam.toLowerCase()) &&
        match.teams.away.name.toLowerCase().includes(awayTeam.toLowerCase())
      );

      console.log(`🏆 [UEFA U21] Found ${matches.length} matches for ${homeTeam} vs ${awayTeam}`);
      return matches;
    } catch (error) {
      console.error('❌ [UEFA U21] Error searching matches:', error);
      throw error;
    }
  }

  /**
   * Create sample data for testing (only used by /sample endpoint)
   */
  createSampleU21Matches(): U21Match[] {
    console.log('🎯 [UEFA U21] Creating sample U21 matches for testing');
    
    return [
      {
        fixture: {
          id: 999001,
          date: "2025-06-16T16:00:00.000Z",
          status: { long: "Not Started", short: "NS" },
          venue: { name: "Arena Națională", city: "Bucharest" }
        },
        league: {
          id: 38,
          name: "UEFA European Under-21 Championship",
          logo: "https://media.api-sports.io/football/leagues/38.png",
          country: "Europe"
        },
        teams: {
          home: { id: 1111, name: "Spain U21", logo: "https://hatscripts.github.io/circle-flags/flags/es.svg" },
          away: { id: 2222, name: "Romania U21", logo: "https://hatscripts.github.io/circle-flags/flags/ro.svg" }
        },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } }
      },
      {
        fixture: {
          id: 999002,
          date: "2025-06-16T19:00:00.000Z",
          status: { long: "Not Started", short: "NS" },
          venue: { name: "Stade de France", city: "Paris" }
        },
        league: {
          id: 38,
          name: "UEFA European Under-21 Championship",
          logo: "https://media.api-sports.io/football/leagues/38.png",
          country: "Europe"
        },
        teams: {
          home: { id: 3333, name: "France U21", logo: "https://hatscripts.github.io/circle-flags/flags/fr.svg" },
          away: { id: 4444, name: "Georgia U21", logo: "https://hatscripts.github.io/circle-flags/flags/ge.svg" }
        },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } }
      },
      {
        fixture: {
          id: 999003,
          date: "2025-06-17T16:00:00.000Z",
          status: { long: "Not Started", short: "NS" },
          venue: { name: "Allianz Arena", city: "Munich" }
        },
        league: {
          id: 38,
          name: "UEFA European Under-21 Championship",
          logo: "https://media.api-sports.io/football/leagues/38.png",
          country: "Europe"
        },
        teams: {
          home: { id: 5555, name: "Portugal U21", logo: "https://hatscripts.github.io/circle-flags/flags/pt.svg" },
          away: { id: 6666, name: "Poland U21", logo: "https://hatscripts.github.io/circle-flags/flags/pl.svg" }
        },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } }
      },
      {
        fixture: {
          id: 999004,
          date: "2025-06-17T19:00:00.000Z",
          status: { long: "Not Started", short: "NS" },
          venue: { name: "San Siro", city: "Milan" }
        },
        league: {
          id: 38,
          name: "UEFA European Under-21 Championship",
          logo: "https://media.api-sports.io/football/leagues/38.png",
          country: "Europe"
        },
        teams: {
          home: { id: 7777, name: "Slovakia U21", logo: "https://hatscripts.github.io/circle-flags/flags/sk.svg" },
          away: { id: 8888, name: "Italy U21", logo: "https://hatscripts.github.io/circle-flags/flags/it.svg" }
        },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } }
      }
    ];
  }
}

export default new UefaU21ApiService();
export type { U21Match };
