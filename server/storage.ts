import { 
  User, InsertUser, 
  UserPreferences, InsertUserPreferences,
  CachedFixture, InsertCachedFixture,
  CachedLeague, InsertCachedLeague,
  NewsArticle, InsertNewsArticle,
  users, userPreferences, cachedFixtures, cachedLeagues, newsArticles
} from "@shared/schema";
import { FixtureResponse, LeagueResponse, NewsItem } from "./types";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

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
  getCachedFixturesByDate(date: string): Promise<CachedFixture[]>;
  createCachedFixture(fixture: InsertCachedFixture): Promise<CachedFixture>;
  updateCachedFixture(fixtureId: string, data: any): Promise<CachedFixture | undefined>;

  // Leagues
  getCachedLeague(leagueId: string): Promise<CachedLeague | undefined>;
  getAllCachedLeagues(): Promise<CachedLeague[]>;
  createCachedLeague(league: InsertCachedLeague): Promise<CachedLeague>;
  updateCachedLeague(leagueId: string, data: any): Promise<CachedLeague | undefined>;

  // News Articles
  getNewsArticle(id: number): Promise<NewsArticle | undefined>;
  getAllNewsArticles(): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: number, article: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined>;
  deleteNewsArticle(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private preferences: Map<number, UserPreferences>;
  private fixtures: Map<string, CachedFixture>;
  private leagues: Map<string, CachedLeague>;
  private newsArticles: Map<number, NewsArticle>;
  private userIdCounter: number;
  private prefIdCounter: number;
  private fixtureIdCounter: number;
  private leagueIdCounter: number;
  private newsArticleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.preferences = new Map();
    this.fixtures = new Map();
    this.leagues = new Map();
    this.newsArticles = new Map();
    this.userIdCounter = 1;
    this.prefIdCounter = 1;
    this.fixtureIdCounter = 1;
    this.leagueIdCounter = 1;
    this.newsArticleIdCounter = 1;
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
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      fullName: insertUser.fullName || null 
    };
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
    const prefs: UserPreferences = { 
      ...insertPrefs, 
      id,
      favoriteTeams: insertPrefs.favoriteTeams || [],
      favoriteLeagues: insertPrefs.favoriteLeagues || [],
      favoriteMatches: insertPrefs.favoriteMatches || [],
      region: insertPrefs.region || 'global'
    };
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

  async getCachedFixturesByDate(date: string): Promise<CachedFixture[]> {
    return Array.from(this.fixtures.values()).filter(
      (fixture) => fixture.date === date
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

  // News Articles
  async getNewsArticle(id: number): Promise<NewsArticle | undefined> {
    return this.newsArticles.get(id);
  }

  async getAllNewsArticles(): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values());
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const now = new Date();
    const newsArticle: NewsArticle = {
      id: this.newsArticleIdCounter++,
      ...article,
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.newsArticles.set(newsArticle.id, newsArticle);
    return newsArticle;
  }

  async updateNewsArticle(id: number, articleUpdates: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined> {
    const article = await this.getNewsArticle(id);
    if (!article) return undefined;

    const updatedArticle: NewsArticle = {
      ...article,
      ...articleUpdates,
      updatedAt: new Date()
    };

    this.newsArticles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    return this.newsArticles.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
    private async isPoolAvailable(): Promise<boolean> {
    try {
      // Check if the database connection pool is still active using Drizzle syntax
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database pool is not available:', error);
      return false;
    }
  }
  // User management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values({
        ...user,
        fullName: user.fullName || null,
        createdAt: new Date()
      }).returning();

      if (!result[0]) throw new Error('Failed to create user');
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // User preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    try {
      const result = await db.select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      return result[0];
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return undefined;
    }
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    try {
      // Ensure the arrays are properly initialized
      const prefsToInsert = {
        userId: preferences.userId,
        favoriteTeams: preferences.favoriteTeams || [],
        favoriteLeagues: preferences.favoriteLeagues || [],
        favoriteMatches: preferences.favoriteMatches || [],
        region: preferences.region || 'global'
      };

      const result = await db.insert(userPreferences)
        .values(prefsToInsert)
        .returning();

      if (!result[0]) throw new Error('Failed to create user preferences');
      return result[0];
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: number, 
    updatedFields: Partial<InsertUserPreferences>
  ): Promise<UserPreferences | undefined> {
    try {
      // First check if preferences exist
      const existingPrefs = await this.getUserPreferences(userId);

      if (!existingPrefs) {
        return undefined;
      }

      // Prepare the updates with proper type handling
      const updates: Record<string, any> = {};

      if (updatedFields.favoriteTeams !== undefined) {
        updates.favoriteTeams = updatedFields.favoriteTeams || [];
      }

      if (updatedFields.favoriteLeagues !== undefined) {
        updates.favoriteLeagues = updatedFields.favoriteLeagues || [];
      }

      if (updatedFields.favoriteMatches !== undefined) {
        updates.favoriteMatches = updatedFields.favoriteMatches || [];
      }

      if (updatedFields.region !== undefined) {
        updates.region = updatedFields.region || 'global';
      }

      // Update preferences
      const result = await db.update(userPreferences)
        .set(updates)
        .where(eq(userPreferences.id, existingPrefs.id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return undefined;
    }
  }

  // Fixtures
  async getCachedFixture(fixtureId: string): Promise<CachedFixture | undefined> {
    try {
      if (!(await this.isPoolAvailable())) {
        console.warn('Database pool not available, skipping cache operation');
        return undefined;
      }
      const result = await db.select()
        .from(cachedFixtures)
        .where(eq(cachedFixtures.fixtureId, fixtureId));
      return result[0];
    } catch (error) {
      console.error('Error getting cached fixture:', error);
      return undefined;
    }
  }

  async getCachedFixturesByLeague(leagueId: string, date?: string): Promise<CachedFixture[]> {
    try {
      let query = db.select().from(cachedFixtures).where(eq(cachedFixtures.league, leagueId));

      if (date) {
        query = db.select()
          .from(cachedFixtures)
          .where(and(
            eq(cachedFixtures.league, leagueId),
            eq(cachedFixtures.date, date)
          ));
      }

      return await query;
    } catch (error) {
      console.error('Error getting fixtures by league:', error);
      return [];
    }
  }

  async getCachedFixturesByDate(date: string): Promise<CachedFixture[]> {
    try {
      const query = db.select()
        .from(cachedFixtures)
        .where(eq(cachedFixtures.date, date));

      return await query;
    } catch (error) {
      console.error('Error getting fixtures by date:', error);
      return [];
    }
  }

  async createCachedFixture(fixture: InsertCachedFixture): Promise<CachedFixture> {
    try {
      if (!(await this.isPoolAvailable())) {
        console.warn('Database pool not available, skipping cache creation');
        throw new Error('Database not available');
      }
      const result = await db.insert(cachedFixtures)
        .values({
          ...fixture,
          timestamp: new Date()
        })
        .returning();

      if (!result[0]) throw new Error('Failed to cache fixture');
      return result[0];
    } catch (error) {
      console.error('Error caching fixture:', error);
      throw error;
    }
  }

  async updateCachedFixture(fixtureId: string, data: any): Promise<CachedFixture | undefined> {
    try {
      const result = await db.update(cachedFixtures)
        .set({
          data,
          timestamp: new Date()
        })
        .where(eq(cachedFixtures.fixtureId, fixtureId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating cached fixture:', error);
      return undefined;
    }
  }

  // Leagues
  async getCachedLeague(leagueId: string): Promise<CachedLeague | undefined> {
    try {
      const result = await db.select()
        .from(cachedLeagues)
        .where(eq(cachedLeagues.leagueId, leagueId));
      return result[0];
    } catch (error) {
      console.error('Error getting cached league:', error);
      return undefined;
    }
  }

  async getAllCachedLeagues(): Promise<CachedLeague[]> {
    try {
      return await db.select().from(cachedLeagues);
    } catch (error) {
      console.error('Error getting all cached leagues:', error);
      return [];
    }
  }

  async createCachedLeague(league: InsertCachedLeague): Promise<CachedLeague> {
    try {
      const result = await db.insert(cachedLeagues)
        .values({
          ...league,
          timestamp: new Date()
        })
        .returning();

      if (!result[0]) throw new Error('Failed to cache league');
      return result[0];
    } catch (error) {
      console.error('Error caching league:', error);
      throw error;
    }
  }

  async updateCachedLeague(leagueId: string, data: any): Promise<CachedLeague | undefined> {
    try {
      const result = await db.update(cachedLeagues)
        .set({
          data,
          timestamp: new Date()
        })
        .where(eq(cachedLeagues.leagueId, leagueId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating cached league:', error);
      return undefined;
    }
  }

  // News Articles
  async getNewsArticle(id: number): Promise<NewsArticle | undefined> {
    try {
      const result = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting news article by ID:', error);
      return undefined;
    }
  }

  async getAllNewsArticles(): Promise<NewsArticle[]> {
    try {
      return await db.select().from(newsArticles).orderBy(newsArticles.publishedAt);
    } catch (error) {
      console.error('Error getting all news articles:', error);
      return [];
    }
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    try {
      const [newArticle] = await db.insert(newsArticles).values(article).returning();
      return newArticle;
    } catch (error) {
      console.error('Error creating news article:', error);
      throw error;
    }
  }

  async updateNewsArticle(id: number, articleUpdates: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined> {
    try {
      const existingArticle = await this.getNewsArticle(id);
      if (!existingArticle) {
        return undefined;
      }

      const [updatedArticle] = await db
        .update(newsArticles)
        .set({ ...articleUpdates, updatedAt: new Date() })
        .where(eq(newsArticles.id, id))
        .returning();

      return updatedArticle;
    } catch (error) {
      console.error('Error updating news article:', error);
      return undefined;
    }
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(newsArticles)
        .where(eq(newsArticles.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting news article:', error);
      return false;
    }
  }
}

// Choose which storage to use
// We're using PostgreSQL database with Drizzle ORM
export const storage = new DatabaseStorage();