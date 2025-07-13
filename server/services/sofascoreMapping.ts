
import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '18df86e6b3msha3430096f8da518p1ffd93jsnc21a6cf7f527';

interface SofaScorePlayer {
  id: number;
  name: string;
  team?: {
    id: number;
    name: string;
  };
}

interface SofaScoreMatch {
  id: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  tournament: {
    id: number;
    name: string;
  };
  startTimestamp: number;
}

class SofaScoreMappingService {
  private playerCache = new Map<string, number>();
  private matchCache = new Map<string, number>();
  private teamCache = new Map<string, number>();

  // Find SofaScore player ID by name and team name
  async findSofaScorePlayerId(playerName: string, teamName: string): Promise<number | null> {
    const cacheKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
    
    if (this.playerCache.has(cacheKey)) {
      return this.playerCache.get(cacheKey)!;
    }

    try {
      // First, try to find the team in SofaScore
      const teamId = await this.findSofaScoreTeamId(teamName);
      if (!teamId) {
        console.log(`❌ [SofaScore Mapping] Team not found: ${teamName}`);
        return null;
      }

      // Search for player by name in that team
      const response = await axios.get('https://sofascore.p.rapidapi.com/teams/get-players', {
        params: {
          teamId: teamId
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.players) {
        const players: SofaScorePlayer[] = response.data.players;
        
        // Try exact match first
        let foundPlayer = players.find(p => 
          p.name.toLowerCase() === playerName.toLowerCase()
        );

        // If no exact match, try partial match
        if (!foundPlayer) {
          foundPlayer = players.find(p => 
            p.name.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(p.name.toLowerCase())
          );
        }

        if (foundPlayer) {
          console.log(`✅ [SofaScore Mapping] Found player: ${playerName} -> SofaScore ID: ${foundPlayer.id}`);
          this.playerCache.set(cacheKey, foundPlayer.id);
          return foundPlayer.id;
        }
      }

      console.log(`❌ [SofaScore Mapping] Player not found: ${playerName} in team ${teamName}`);
      return null;

    } catch (error) {
      console.error(`❌ [SofaScore Mapping] Error finding player ${playerName}:`, error);
      return null;
    }
  }

  // Find SofaScore team ID by team name
  async findSofaScoreTeamId(teamName: string): Promise<number | null> {
    const cacheKey = teamName.toLowerCase();
    
    if (this.teamCache.has(cacheKey)) {
      return this.teamCache.get(cacheKey)!;
    }

    try {
      // Search for team by name
      const response = await axios.get('https://sofascore.p.rapidapi.com/search', {
        params: {
          q: teamName
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.teams) {
        const teams = response.data.teams;
        
        // Try exact match first
        let foundTeam = teams.find((t: any) => 
          t.name.toLowerCase() === teamName.toLowerCase()
        );

        // If no exact match, try partial match
        if (!foundTeam) {
          foundTeam = teams.find((t: any) => 
            t.name.toLowerCase().includes(teamName.toLowerCase()) ||
            teamName.toLowerCase().includes(t.name.toLowerCase())
          );
        }

        if (foundTeam) {
          console.log(`✅ [SofaScore Mapping] Found team: ${teamName} -> SofaScore ID: ${foundTeam.id}`);
          this.teamCache.set(cacheKey, foundTeam.id);
          return foundTeam.id;
        }
      }

      console.log(`❌ [SofaScore Mapping] Team not found: ${teamName}`);
      return null;

    } catch (error) {
      console.error(`❌ [SofaScore Mapping] Error finding team ${teamName}:`, error);
      return null;
    }
  }

  // Find SofaScore match ID by team names and date
  async findSofaScoreMatchId(homeTeam: string, awayTeam: string, matchDate: string): Promise<number | null> {
    const cacheKey = `${homeTeam.toLowerCase()}_${awayTeam.toLowerCase()}_${matchDate}`;
    
    if (this.matchCache.has(cacheKey)) {
      return this.matchCache.get(cacheKey)!;
    }

    try {
      // Get the date range for searching
      const date = new Date(matchDate);
      const startDate = new Date(date);
      startDate.setDate(date.getDate() - 1);
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 1);

      // Search for matches by date range
      const response = await axios.get('https://sofascore.p.rapidapi.com/matches/list-by-date', {
        params: {
          date: date.toISOString().split('T')[0]
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.events) {
        const matches: SofaScoreMatch[] = response.data.events;
        
        // Find match by team names
        const foundMatch = matches.find(match => {
          const homeMatches = this.teamNamesMatch(match.homeTeam.name, homeTeam);
          const awayMatches = this.teamNamesMatch(match.awayTeam.name, awayTeam);
          
          return homeMatches && awayMatches;
        });

        if (foundMatch) {
          console.log(`✅ [SofaScore Mapping] Found match: ${homeTeam} vs ${awayTeam} -> SofaScore ID: ${foundMatch.id}`);
          this.matchCache.set(cacheKey, foundMatch.id);
          return foundMatch.id;
        }
      }

      console.log(`❌ [SofaScore Mapping] Match not found: ${homeTeam} vs ${awayTeam} on ${matchDate}`);
      return null;

    } catch (error) {
      console.error(`❌ [SofaScore Mapping] Error finding match ${homeTeam} vs ${awayTeam}:`, error);
      return null;
    }
  }

  // Helper method to check if team names match (accounting for variations)
  private teamNamesMatch(sofaScoreName: string, apiFootballName: string): boolean {
    const normalize = (name: string) => name.toLowerCase()
      .replace(/fc\b/g, '')
      .replace(/\bfc\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedSofaScore = normalize(sofaScoreName);
    const normalizedApiFootball = normalize(apiFootballName);

    return normalizedSofaScore === normalizedApiFootball ||
           normalizedSofaScore.includes(normalizedApiFootball) ||
           normalizedApiFootball.includes(normalizedSofaScore);
  }

  // Clear caches
  clearCache() {
    this.playerCache.clear();
    this.matchCache.clear();
    this.teamCache.clear();
  }
}

export const sofaScoreMapping = new SofaScoreMappingService();
