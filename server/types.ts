// API response types (Common to both API-Football and Livescore API after transformation)

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: Score;
}

export interface LeagueResponse {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
    country: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: {
    year: number;
    start: string;
    end: string;
    current: boolean;
  }[];
}

export interface Player {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

export interface PlayerStatistics {
  player: Player;
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    shots: {
      total: number;
      on: number;
    };
    goals: {
      total: number;
      conceded: number;
      assists: number;
      saves: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: string;
    };
    tackles: {
      total: number;
      blocks: number;
      interceptions: number;
    };
    duels: {
      total: number;
      won: number;
    };
    dribbles: {
      attempts: number;
      success: number;
      past: number;
    };
    fouls: {
      drawn: number;
      committed: number;
    };
    cards: {
      yellow: number;
      yellowred: number;
      red: number;
    };
    penalty: {
      won: number;
      committed: number;
      scored: number;
      missed: number;
      saved: number;
    };
  }[];
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  url: string;
}

// Sportsradar API Types
export interface SportsradarTeam {
  id: number | string;
  name: string;
  logo?: string;
  cc?: string;  // Country code
}

export interface SportsradarCategory {
  id: number | string;
  name: string;
  cc?: string;  // Country code
}

export interface SportsradarTournament {
  id: number | string;
  name: string;
  category?: SportsradarCategory;
  logo?: string;
}

export interface SportsradarVenue {
  id?: number | string;
  name?: string;
  city?: string;
  country?: string;
}

export interface SportsradarRound {
  id?: number | string;
  name?: string;
}

export interface SportsradarFixture {
  id: number | string;
  tournament?: SportsradarTournament;
  round?: SportsradarRound;
  status?: string;
  scheduled?: string;
  minute?: number;
  home_team?: SportsradarTeam;
  away_team?: SportsradarTeam;
  home_score?: number;
  away_score?: number;
  home_score_half_1?: number;
  away_score_half_1?: number;
  venue?: SportsradarVenue;
  referee?: string;
  timezone?: string;
}

export interface SportsradarLeague {
  id: number | string;
  name: string;
  category?: SportsradarCategory;
  current_season?: {
    id: number | string;
    name: string;
    start_date: string;
    end_date: string;
  };
  logo?: string;
}

export interface RapidApiResponse {
  success: boolean;
  data: any;
}

// Livescore API specific types - these will be transformed to match our app's common types

export interface LivescoreTeam {
  Tid?: string;  // Team ID
  Nm?: string;   // Team Name
  Img?: string;  // Team Image/Logo ID
  Gd?: string;   // Goal Difference
  Pld?: string;  // Played
  Pts?: string;  // Points
  Lst?: string;  // Last 5 Results sequence (W,L,D)
}

export interface LivescoreFixtureResponse {
  Eid?: string;          // Event ID
  Esd?: string;          // Event Start Date
  Eps?: string;          // Event Play Status (e.g., "Finished", "In Play")
  Esid?: number;         // Event Status ID
  Tr1?: string;          // Team 1 Result/Score
  Tr2?: string;          // Team 2 Result/Score
  Trh1?: string;         // Team 1 Half-Time Result
  Trh2?: string;         // Team 2 Half-Time Result
  T1?: LivescoreTeam[];  // Team 1 Details
  T2?: LivescoreTeam[];  // Team 2 Details
  Cid?: string;          // Competition ID
  Cnm?: string;          // Competition Name
  Ccd?: string;          // Country Code
  Scd?: string;          // Season Code
  ComX?: string;         // Commentary Availability
  Min?: string;          // Current Match Minute
  Vnm?: string;          // Venue Name
  Cards?: {              // Card events
    Nm: string;          // Player Name
    Min: number;         // Minute
    Card: number;        // Card Type (1=Yellow, 2=Red)
  }[];
}

export interface LivescoreLeagueResponse {
  Id?: string;       // League ID
  CompN?: string;    // Competition Name
  CompD?: string;    // Competition Description
  CompT?: string;    // Competition Type
  Sids?: string[];   // Season IDs
  Cid?: string;      // Country ID
  Ccd?: string;      // Country Code
  CountryName?: string; // Country Name (added in transformation)
}

export interface LivescoreStandingsResponse {
  LeagueTable?: {
    Tables?: {
      Table: {
        team: LivescoreTeam;
        pos: string;    // Position
        form: string;   // Form
      }[];
    }[];
  };
}
