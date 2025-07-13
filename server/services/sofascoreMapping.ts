
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
    slug: string;
  };
  awayTeam: {
    id: number;
    name: string;
    slug: string;
  };
  tournament: {
    id: number;
    name: string;
    slug: string;
  };
  startTimestamp: number;
  status: {
    code: number;
    description: string;
    type: string;
  };
}

interface SofaScoreTeam {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  sport: {
    id: number;
    name: string;
    slug: string;
  };
  country: {
    alpha2: string;
    name: string;
  };
}

class SofaScoreMappingService {
  private playerCache = new Map<string, number>();
  private matchCache = new Map<string, number>();
  private teamCache = new Map<string, number>();

  // Search for SofaScore matches directly by team names and date
  async searchSofaScoreMatches(homeTeam: string, awayTeam: string, matchDate: string): Promise<SofaScoreMatch | null> {
    const cacheKey = `${homeTeam.toLowerCase()}_${awayTeam.toLowerCase()}_${matchDate}`;
    
    if (this.matchCache.has(cacheKey)) {
      const matchId = this.matchCache.get(cacheKey)!;
      return await this.getSofaScoreMatch(matchId);
    }

    try {
      console.log(`🔍 [SofaScore Direct] Searching for match: ${homeTeam} vs ${awayTeam} on ${matchDate}`);
      
      // Get the date in YYYY-MM-DD format
      const date = new Date(matchDate);
      const dateStr = date.toISOString().split('T')[0];

      // Search for matches on that date
      const response = await axios.get('https://sofascore.p.rapidapi.com/matches/list-by-date', {
        params: {
          date: dateStr
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 15000
      });

      if (response.data && response.data.events) {
        const matches: SofaScoreMatch[] = response.data.events;
        
        // Find match by team names (more flexible matching)
        const foundMatch = matches.find(match => {
          const homeMatches = this.teamNamesMatch(match.homeTeam.name, homeTeam);
          const awayMatches = this.teamNamesMatch(match.awayTeam.name, awayTeam);
          
          return homeMatches && awayMatches;
        });

        if (foundMatch) {
          console.log(`✅ [SofaScore Direct] Found match: ${foundMatch.homeTeam.name} vs ${foundMatch.awayTeam.name} (ID: ${foundMatch.id})`);
          this.matchCache.set(cacheKey, foundMatch.id);
          return foundMatch;
        }
      }

      console.log(`❌ [SofaScore Direct] Match not found: ${homeTeam} vs ${awayTeam} on ${matchDate}`);
      return null;

    } catch (error) {
      console.error(`❌ [SofaScore Direct] Error searching for match:`, error);
      return null;
    }
  }

  // Get SofaScore match details by ID
  async getSofaScoreMatch(matchId: number): Promise<SofaScoreMatch | null> {
    try {
      const response = await axios.get('https://sofascore.p.rapidapi.com/matches/get-detail', {
        params: {
          matchId: matchId
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.event) {
        return response.data.event;
      }

      return null;
    } catch (error) {
      console.error(`❌ [SofaScore Direct] Error getting match details:`, error);
      return null;
    }
  }

  // Search for SofaScore players directly by name and team
  async searchSofaScorePlayers(playerName: string, teamName: string): Promise<SofaScorePlayer | null> {
    const cacheKey = `${playerName.toLowerCase()}_${teamName.toLowerCase()}`;
    
    if (this.playerCache.has(cacheKey)) {
      const playerId = this.playerCache.get(cacheKey)!;
      return { id: playerId, name: playerName };
    }

    try {
      console.log(`🔍 [SofaScore Direct] Searching for player: ${playerName}`);

      // Search for player by name
      const response = await axios.get('https://sofascore.p.rapidapi.com/search', {
        params: {
          q: playerName
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.players) {
        const players: SofaScorePlayer[] = response.data.players;
        
        // Try to find player with matching team
        let foundPlayer = players.find(p => 
          p.team && this.teamNamesMatch(p.team.name, teamName) &&
          this.playerNamesMatch(p.name, playerName)
        );

        // If no team match, try just name matching
        if (!foundPlayer) {
          foundPlayer = players.find(p => 
            this.playerNamesMatch(p.name, playerName)
          );
        }

        if (foundPlayer) {
          console.log(`✅ [SofaScore Direct] Found player: ${foundPlayer.name} (ID: ${foundPlayer.id})`);
          this.playerCache.set(cacheKey, foundPlayer.id);
          return foundPlayer;
        }
      }

      console.log(`❌ [SofaScore Direct] Player not found: ${playerName}`);
      return null;

    } catch (error) {
      console.error(`❌ [SofaScore Direct] Error searching for player:`, error);
      return null;
    }
  }

  // Get SofaScore heatmap data directly
  async getSofaScoreHeatmap(matchId: number, playerId: number): Promise<any> {
    try {
      console.log(`🔥 [SofaScore Direct] Fetching heatmap for player ${playerId} in match ${matchId}`);

      const response = await axios.get('https://sofascore.p.rapidapi.com/matches/get-player-heatmap', {
        params: {
          matchId: matchId,
          playerId: playerId
        },
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'sofascore.p.rapidapi.com'
        },
        timeout: 15000
      });

      if (response.data) {
        console.log(`✅ [SofaScore Direct] Successfully fetched heatmap data`);
        return {
          ...response.data,
          playerId: playerId,
          matchId: matchId,
          source: 'sofascore-direct'
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ [SofaScore Direct] Error fetching heatmap:`, error);
      return null;
    }
  }

  // Helper method to check if team names match (accounting for variations)
  private teamNamesMatch(sofaScoreName: string, targetName: string): boolean {
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
      .replace(/\bmilan\b/g, '')
      .replace(/\bmadrid\b/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();

    const normalizedSofaScore = normalize(sofaScoreName);
    const normalizedTarget = normalize(targetName);

    // Exact match
    if (normalizedSofaScore === normalizedTarget) {
      return true;
    }

    // Contains match (both ways)
    if (normalizedSofaScore.includes(normalizedTarget) || 
        normalizedTarget.includes(normalizedSofaScore)) {
      return true;
    }

    // Word-based matching for better accuracy
    const sofaWords = normalizedSofaScore.split(' ').filter(w => w.length > 2);
    const targetWords = normalizedTarget.split(' ').filter(w => w.length > 2);
    
    if (sofaWords.length > 0 && targetWords.length > 0) {
      const commonWords = sofaWords.filter(word => targetWords.includes(word));
      return commonWords.length >= Math.min(sofaWords.length, targetWords.length) * 0.6;
    }

    return false;
  }

  // Helper method to check if player names match
  private playerNamesMatch(sofaScoreName: string, targetName: string): boolean {
    const normalize = (name: string) => name.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();

    const normalizedSofaScore = normalize(sofaScoreName);
    const normalizedTarget = normalize(targetName);

    // Exact match
    if (normalizedSofaScore === normalizedTarget) {
      return true;
    }

    // Handle abbreviated names like "L. Messi" vs "Lionel Messi"
    const sofaWords = normalizedSofaScore.split(' ');
    const targetWords = normalizedTarget.split(' ');

    // Check for first initial + last name match
    if (sofaWords.length >= 2 && targetWords.length >= 2) {
      const sofaLastName = sofaWords[sofaWords.length - 1];
      const targetLastName = targetWords[targetWords.length - 1];
      
      if (sofaLastName === targetLastName) {
        // Check if first name or initial matches
        const sofaFirst = sofaWords[0];
        const targetFirst = targetWords[0];
        
        if (sofaFirst.charAt(0) === targetFirst.charAt(0) || 
            sofaFirst === targetFirst) {
          return true;
        }
      }
    }

    // Contains match for partial names
    if (normalizedSofaScore.includes(normalizedTarget) || 
        normalizedTarget.includes(normalizedSofaScore)) {
      return true;
    }

    return false;
  }

  // Legacy methods for backward compatibility
  async findSofaScorePlayerId(playerName: string, teamName: string): Promise<number | null> {
    const player = await this.searchSofaScorePlayers(playerName, teamName);
    return player ? player.id : null;
  }

  async findSofaScoreMatchId(homeTeam: string, awayTeam: string, matchDate: string): Promise<number | null> {
    const match = await this.searchSofaScoreMatches(homeTeam, awayTeam, matchDate);
    return match ? match.id : null;
  }

  // Clear caches
  clearCache() {
    this.playerCache.clear();
    this.matchCache.clear();
    this.teamCache.clear();
  }
}

export const sofaScoreMapping = new SofaScoreMappingService();
