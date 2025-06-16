
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
        return [];
      }

      const allMatches: U21Match[] = [];

      // Get current season fixtures for UEFA U21 Championship (league ID 38)
      const currentYear = new Date().getFullYear();
      const season = currentYear;

      console.log(`🏆 [UEFA U21] Fetching season ${season} for league ${this.leagueId}`);

      try {
        const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
          params: {
            league: this.leagueId,
            season: season
          },
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
          },
          timeout: 10000
        });

        if (response.data?.response && Array.isArray(response.data.response)) {
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
          console.log(`🏆 [UEFA U21] Found ${fixtures.length} real matches from league ${this.leagueId}`);
        } else {
          console.log(`⚠️ [UEFA U21] No fixtures found for league ${this.leagueId} season ${season}`);
        }
      } catch (apiError: any) {
        console.error(`❌ [UEFA U21] Error fetching from league ${this.leagueId}:`, apiError.message);
        
        // Try previous year if current year has no data
        const previousSeason = currentYear - 1;
        console.log(`🏆 [UEFA U21] Trying previous season ${previousSeason}...`);
        
        try {
          const prevResponse = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
            params: {
              league: this.leagueId,
              season: previousSeason
            },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            timeout: 10000
          });

          if (prevResponse.data?.response && Array.isArray(prevResponse.data.response)) {
            const fixtures = prevResponse.data.response.map((fixture: any) => ({
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
            console.log(`🏆 [UEFA U21] Found ${fixtures.length} matches from previous season ${previousSeason}`);
          }
        } catch (prevError) {
          console.error(`❌ [UEFA U21] Error fetching previous season:`, prevError);
        }
      }

      // Also try qualification league if we have few matches
      if (allMatches.length < 10) {
        try {
          console.log(`🏆 [UEFA U21] Trying qualification league ${this.qualificationLeagueId}...`);
          
          const qualResponse = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
            params: {
              league: this.qualificationLeagueId,
              season: season
            },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            },
            timeout: 10000
          });

          if (qualResponse.data?.response && Array.isArray(qualResponse.data.response)) {
            const qualFixtures = qualResponse.data.response.map((fixture: any) => ({
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

            allMatches.push(...qualFixtures);
            console.log(`🏆 [UEFA U21] Found ${qualFixtures.length} real qualification matches`);
          }
        } catch (qualError) {
          console.log('⚠️ [UEFA U21] No qualification matches found');
        }
      }

      // Remove duplicates and sort by date
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.fixture.id === match.fixture.id)
      );

      const sortedMatches = uniqueMatches.sort((a, b) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );

      console.log(`🏆 [UEFA U21] Returning ${sortedMatches.length} real UEFA U21 matches`);
      return sortedMatches;

    } catch (error: any) {
      console.error('❌ [UEFA U21] Error fetching real U21 matches:', error.message);
      return [];
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
      return [];
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
      return [];
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
      return [];
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
      return [];
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
      return [];
    }
  }
}

export default new UefaU21ApiService();
export type { U21Match };
