
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

        // Try first/last name matching for players like "L. Messi" vs "Lionel Messi"
        if (!foundPlayer && playerName.includes('.')) {
          const nameParts = playerName.split(' ');
          const lastName = nameParts[nameParts.length - 1].toLowerCase();
          foundPlayer = players.find(p => 
            p.name.toLowerCase().includes(lastName) && lastName.length > 3
          );
        }

        // Try nickname/common name matching
        if (!foundPlayer) {
          const commonNames: Record<string, string[]> = {
            'messi': ['lionel messi', 'l. messi', 'leo messi'],
            'ronaldo': ['cristiano ronaldo', 'c. ronaldo', 'cr7'],
            'neymar': ['neymar jr', 'neymar da silva']
          };
          
          const playerLower = playerName.toLowerCase();
          for (const [key, variants] of Object.entries(commonNames)) {
            if (variants.some(variant => 
              variant.includes(playerLower) || playerLower.includes(variant)
            )) {
              foundPlayer = players.find(p => 
                variants.some(variant => p.name.toLowerCase().includes(variant))
              );
              if (foundPlayer) break;
            }
          }
        }

        if (foundPlayer) {
          console.log(`✅ [SofaScore Mapping] Found player: ${playerName} -> SofaScore ID: ${foundPlayer.id}`);
          this.playerCache.set(cacheKey, foundPlayer.id);
          return foundPlayer.id;
        }
      }

      console.log(`❌ [SofaScore Mapping] Player not found: ${playerName} in team ${teamName}`);
      console.log(`🔍 [SofaScore Mapping] Available players in team:`, 
        players.slice(0, 5).map(p => ({ id: p.id, name: p.name })));
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
      console.log(`🔍 [SofaScore Mapping] Searching for team: ${teamName}`);
      
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
        console.log(`🔍 [SofaScore Mapping] Found ${teams.length} teams for search: ${teamName}`);
        
        // Try exact match first
        let foundTeam = teams.find((t: any) => 
          this.teamNamesMatch(t.name, teamName)
        );

        if (foundTeam) {
          console.log(`✅ [SofaScore Mapping] Found team: ${teamName} -> ${foundTeam.name} (ID: ${foundTeam.id})`);
          this.teamCache.set(cacheKey, foundTeam.id);
          return foundTeam.id;
        } else {
          console.log(`❌ [SofaScore Mapping] No matching team found for: ${teamName}`);
          console.log(`🔍 [SofaScore Mapping] Available teams:`, teams.map((t: any) => t.name).slice(0, 5));
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
      .replace(/\bfc\b/g, '')
      .replace(/\bcf\b/g, '')
      .replace(/\bsc\b/g, '')
      .replace(/\bac\b/g, '')
      .replace(/\bas\b/g, '')
      .replace(/\brc\b/g, '')
      .replace(/\breal\b/g, '')
      .replace(/\batletico\b/g, 'atletico')
      .replace(/\bu21\b/g, '')
      .replace(/\bu20\b/g, '')
      .replace(/\bu19\b/g, '')
      .replace(/\binter\b/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();

    const normalizedSofaScore = normalize(sofaScoreName);
    const normalizedApiFootball = normalize(apiFootballName);

    // Exact match
    if (normalizedSofaScore === normalizedApiFootball) {
      return true;
    }

    // Contains match (both ways)
    if (normalizedSofaScore.includes(normalizedApiFootball) || 
        normalizedApiFootball.includes(normalizedSofaScore)) {
      return true;
    }

    // Word-based matching for better accuracy
    const sofaWords = normalizedSofaScore.split(' ').filter(w => w.length > 2);
    const apiWords = normalizedApiFootball.split(' ').filter(w => w.length > 2);
    
    if (sofaWords.length > 0 && apiWords.length > 0) {
      const commonWords = sofaWords.filter(word => apiWords.includes(word));
      return commonWords.length >= Math.min(sofaWords.length, apiWords.length) * 0.6;
    }

    return false;
  }

  // Clear caches
  clearCache() {
    this.playerCache.clear();
    this.matchCache.clear();
    this.teamCache.clear();
  }
}

export const sofaScoreMapping = new SofaScoreMappingService();
