import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FixtureResponse, LeagueResponse, PlayerStatistics, NewsItem } from '../../../server/types';

// Type definitions
interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  preferences: {
    favoriteTeams: string[];
    favoriteLeagues: string[];
    favoriteMatches: string[];
    region: string;
  };
}

interface FixturesState {
  live: FixtureResponse[];
  upcoming: FixtureResponse[];
  byDate: Record<string, FixtureResponse[]>;
  byLeague: Record<string, FixtureResponse[]>;
  currentFixture: FixtureResponse | null;
  loading: boolean;
  error: string | null;
}

interface LeaguesState {
  list: LeagueResponse[];
  current: LeagueResponse | null;
  popularLeagues: number[];
  loading: boolean;
  error: string | null;
}

interface StatsState {
  topScorers: Record<string, PlayerStatistics[]>;
  loading: boolean;
  error: string | null;
}

interface UIState {
  selectedDate: string;
  selectedFilter: string;
  selectedSport: string;
  selectedLeague: number;
  showRegionModal: boolean;
  accessibility: {
    highContrast: boolean;
    largerText: boolean;
    reducedAnimations: boolean;
  };
}

interface NewsState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialUserState: UserState = {
  id: null,
  username: null,
  email: null,
  isAuthenticated: false,
  preferences: {
    favoriteTeams: [],
    favoriteLeagues: [],
    favoriteMatches: [],
    region: 'global',
  },
};

const initialFixturesState: FixturesState = {
  live: [],
  upcoming: [],
  byDate: {},
  byLeague: {},
  currentFixture: null,
  loading: false,
  error: null,
};

const initialLeaguesState: LeaguesState = {
  list: [],
  current: null,
  // Updated to include leagues from England, Italy, America, Brazil, Spain, Germany
  popularLeagues: [
    39,  // Premier League (England)
    135, // Serie A (Italy)
    2,   // Champions League (Europe)
    71,  // Serie A (Brazil)
    140, // La Liga (Spain)
    78   // Bundesliga (Germany)
  ], 
  loading: false,
  error: null,
};

const initialStatsState: StatsState = {
  topScorers: {},
  loading: false,
  error: null,
};

const initialUIState: UIState = {
  selectedDate: new Date().toISOString().split('T')[0],
  selectedFilter: 'all',
  selectedSport: 'football',
  selectedLeague: 39, // Default to Premier League
  showRegionModal: false,
  accessibility: {
    highContrast: false,
    largerText: false,
    reducedAnimations: false,
  },
};

const initialNewsState: NewsState = {
  items: [],
  loading: false,
  error: null,
};

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: number; username: string; email: string }>) => {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.isAuthenticated = true;
    },
    setUserPreferences: (state, action: PayloadAction<UserState['preferences']>) => {
      state.preferences = action.payload;
    },
    addFavoriteTeam: (state, action: PayloadAction<string>) => {
      if (!state.preferences.favoriteTeams.includes(action.payload)) {
        state.preferences.favoriteTeams.push(action.payload);
      }
    },
    removeFavoriteTeam: (state, action: PayloadAction<string>) => {
      state.preferences.favoriteTeams = state.preferences.favoriteTeams.filter(
        id => id !== action.payload
      );
    },
    addFavoriteLeague: (state, action: PayloadAction<string>) => {
      if (!state.preferences.favoriteLeagues.includes(action.payload)) {
        state.preferences.favoriteLeagues.push(action.payload);
      }
    },
    removeFavoriteLeague: (state, action: PayloadAction<string>) => {
      state.preferences.favoriteLeagues = state.preferences.favoriteLeagues.filter(
        id => id !== action.payload
      );
    },
    addFavoriteMatch: (state, action: PayloadAction<string>) => {
      if (!state.preferences.favoriteMatches.includes(action.payload)) {
        state.preferences.favoriteMatches.push(action.payload);
      }
    },
    removeFavoriteMatch: (state, action: PayloadAction<string>) => {
      state.preferences.favoriteMatches = state.preferences.favoriteMatches.filter(
        id => id !== action.payload
      );
    },
    setRegion: (state, action: PayloadAction<string>) => {
      state.preferences.region = action.payload;
    },
    logout: (state) => {
      return initialUserState;
    },
  },
});

// Fixtures slice
const fixturesSlice = createSlice({
  name: 'fixtures',
  initialState: initialFixturesState,
  reducers: {
    setLoadingFixtures: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFixturesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLiveFixtures: (state, action: PayloadAction<FixtureResponse[]>) => {
      state.live = action.payload;
    },
    setUpcomingFixtures: (state, action: PayloadAction<FixtureResponse[]>) => {
      state.upcoming = action.payload;
    },
    setFixturesByDate: (state, action: PayloadAction<{ date: string; fixtures: FixtureResponse[] }>) => {
      state.byDate[action.payload.date] = action.payload.fixtures;
    },
    setFixturesByLeague: (state, action: PayloadAction<{ leagueId: string; fixtures: FixtureResponse[] }>) => {
      state.byLeague[action.payload.leagueId] = action.payload.fixtures;
    },
    setCurrentFixture: (state, action: PayloadAction<FixtureResponse | null>) => {
      state.currentFixture = action.payload;
    },
  },
});

// Leagues slice
const leaguesSlice = createSlice({
  name: 'leagues',
  initialState: initialLeaguesState,
  reducers: {
    setLoadingLeagues: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLeaguesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLeagues: (state, action: PayloadAction<LeagueResponse[]>) => {
      state.list = action.payload;
    },
    setCurrentLeague: (state, action: PayloadAction<LeagueResponse | null>) => {
      state.current = action.payload;
    },
    setPopularLeagues: (state, action: PayloadAction<number[]>) => {
      state.popularLeagues = action.payload;
    },
  },
});

// Stats slice
const statsSlice = createSlice({
  name: 'stats',
  initialState: initialStatsState,
  reducers: {
    setLoadingStats: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setStatsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTopScorers: (state, action: PayloadAction<{ leagueId: string; players: PlayerStatistics[] }>) => {
      state.topScorers[action.payload.leagueId] = action.payload.players;
    },
  },
});

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedFilter: (state, action: PayloadAction<string>) => {
      state.selectedFilter = action.payload;
    },
    setSelectedSport: (state, action: PayloadAction<string>) => {
      state.selectedSport = action.payload;
    },
    setSelectedLeague: (state, action: PayloadAction<number>) => {
      state.selectedLeague = action.payload;
    },
    toggleRegionModal: (state) => {
      state.showRegionModal = !state.showRegionModal;
    },
    setShowRegionModal: (state, action: PayloadAction<boolean>) => {
      state.showRegionModal = action.payload;
    },
    // Accessibility actions
    toggleHighContrast: (state) => {
      state.accessibility.highContrast = !state.accessibility.highContrast;
    },
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.accessibility.highContrast = action.payload;
    },
    toggleLargerText: (state) => {
      state.accessibility.largerText = !state.accessibility.largerText;
    },
    setLargerText: (state, action: PayloadAction<boolean>) => {
      state.accessibility.largerText = action.payload;
    },
    toggleReducedAnimations: (state) => {
      state.accessibility.reducedAnimations = !state.accessibility.reducedAnimations;
    },
    setReducedAnimations: (state, action: PayloadAction<boolean>) => {
      state.accessibility.reducedAnimations = action.payload;
    },
    // Reset all accessibility settings to default
    resetAccessibility: (state) => {
      state.accessibility = initialUIState.accessibility;
    },
  },
});

// News slice
const newsSlice = createSlice({
  name: 'news',
  initialState: initialNewsState,
  reducers: {
    setLoadingNews: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNewsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setNewsItems: (state, action: PayloadAction<NewsItem[]>) => {
      state.items = action.payload;
    },
  },
});

// Export actions
export const userActions = userSlice.actions;
export const fixturesActions = fixturesSlice.actions;
export const leaguesActions = leaguesSlice.actions;
export const statsActions = statsSlice.actions;
export const uiActions = uiSlice.actions;
export const newsActions = newsSlice.actions;

// Create store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    fixtures: fixturesSlice.reducer,
    leagues: leaguesSlice.reducer,
    stats: statsSlice.reducer,
    ui: uiSlice.reducer,
    news: newsSlice.reducer,
  },
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
