import { 
  User, InsertUser, 
  UserPreferences, InsertUserPreferences,
  CachedFixture, InsertCachedFixture,
  CachedLeague, InsertCachedLeague,
  users, userPreferences, cachedFixtures, cachedLeagues
} from "@shared/schema";
import { FixtureResponse, LeagueResponse, NewsItem } from "./types";

// Modify the interface with any CRUD methods needed
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Fixtures
  getCachedFixture(fixtureId: string): Promise<CachedFixture | undefined>;
  getCachedFixturesByLeague(leagueId: string, date?: string): Promise<CachedFixture[]>;
  createCachedFixture(fixture: InsertCachedFixture): Promise<CachedFixture>;
  updateCachedFixture(fixtureId: string, data: any): Promise<CachedFixture | undefined>;
  
  // Leagues
  getCachedLeague(leagueId: string): Promise<CachedLeague | undefined>;
  getAllCachedLeagues(): Promise<CachedLeague[]>;
  createCachedLeague(league: InsertCachedLeague): Promise<CachedLeague>;
  updateCachedLeague(leagueId: string, data: any): Promise<CachedLeague | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private preferences: Map<number, UserPreferences>;
  private fixtures: Map<string, CachedFixture>;
  private leagues: Map<string, CachedLeague>;
  private userIdCounter: number;
  private prefIdCounter: number;
  private fixtureIdCounter: number;
  private leagueIdCounter: number;

  constructor() {
    this.users = new Map();
    this.preferences = new Map();
    this.fixtures = new Map();
    this.leagues = new Map();
    this.userIdCounter = 1;
    this.prefIdCounter = 1;
    this.fixtureIdCounter = 1;
    this.leagueIdCounter = 1;
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // User preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.preferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async createUserPreferences(insertPrefs: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.prefIdCounter++;
    const prefs: UserPreferences = { ...insertPrefs, id };
    this.preferences.set(id, prefs);
    return prefs;
  }

  async updateUserPreferences(
    userId: number, 
    updatedFields: Partial<InsertUserPreferences>
  ): Promise<UserPreferences | undefined> {
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (!existingPrefs) {
      return undefined;
    }
    
    const updatedPrefs: UserPreferences = {
      ...existingPrefs,
      ...updatedFields,
    };
    
    this.preferences.set(existingPrefs.id, updatedPrefs);
    return updatedPrefs;
  }

  // Fixtures
  async getCachedFixture(fixtureId: string): Promise<CachedFixture | undefined> {
    return this.fixtures.get(fixtureId);
  }

  async getCachedFixturesByLeague(leagueId: string, date?: string): Promise<CachedFixture[]> {
    return Array.from(this.fixtures.values()).filter(
      (fixture) => {
        if (date) {
          return fixture.league === leagueId && fixture.date === date;
        }
        return fixture.league === leagueId;
      }
    );
  }

  async createCachedFixture(insertFixture: InsertCachedFixture): Promise<CachedFixture> {
    const id = this.fixtureIdCounter++;
    const fixture: CachedFixture = { 
      ...insertFixture, 
      id, 
      timestamp: new Date() 
    };
    this.fixtures.set(insertFixture.fixtureId, fixture);
    return fixture;
  }

  async updateCachedFixture(fixtureId: string, data: any): Promise<CachedFixture | undefined> {
    const existingFixture = await this.getCachedFixture(fixtureId);
    
    if (!existingFixture) {
      return undefined;
    }
    
    const updatedFixture: CachedFixture = {
      ...existingFixture,
      data,
      timestamp: new Date()
    };
    
    this.fixtures.set(fixtureId, updatedFixture);
    return updatedFixture;
  }

  // Leagues
  async getCachedLeague(leagueId: string): Promise<CachedLeague | undefined> {
    return this.leagues.get(leagueId);
  }

  async getAllCachedLeagues(): Promise<CachedLeague[]> {
    return Array.from(this.leagues.values());
  }

  async createCachedLeague(insertLeague: InsertCachedLeague): Promise<CachedLeague> {
    const id = this.leagueIdCounter++;
    const league: CachedLeague = { 
      ...insertLeague, 
      id, 
      timestamp: new Date() 
    };
    this.leagues.set(insertLeague.leagueId, league);
    return league;
  }

  async updateCachedLeague(leagueId: string, data: any): Promise<CachedLeague | undefined> {
    const existingLeague = await this.getCachedLeague(leagueId);
    
    if (!existingLeague) {
      return undefined;
    }
    
    const updatedLeague: CachedLeague = {
      ...existingLeague,
      data,
      timestamp: new Date()
    };
    
    this.leagues.set(leagueId, updatedLeague);
    return updatedLeague;
  }
}

export const storage = new MemStorage();
