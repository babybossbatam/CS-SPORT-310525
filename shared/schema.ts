
import { pgTable, text, integer, timestamp, jsonb, boolean, serial, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  phoneNumber: text("phone_number"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  favoriteTeams: jsonb("favorite_teams").$type<string[]>(),
  favoriteLeagues: jsonb("favorite_leagues").$type<string[]>(),
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),
  theme: text("theme").default("light"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leagueTranslations = pgTable("league_translations", {
  id: serial("id").primaryKey(),
  leagueName: text("league_name").notNull().unique(),
  leagueId: integer("league_id"),
  translations: jsonb("translations").$type<{
    en: string;
    es: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    de: string;
    it: string;
    pt: string;
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const countryTranslations = pgTable("country_translations", {
  id: serial("id").primaryKey(),
  countryName: text("country_name").notNull().unique(),
  translations: jsonb("translations").$type<{
    en: string;
    es: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    de: string;
    it: string;
    pt: string;
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamTranslations = pgTable("team_translations", {
  id: serial("id").primaryKey(),
  teamName: text("team_name").notNull().unique(),
  teamId: integer("team_id"),
  translations: jsonb("translations").$type<{
    en: string;
    es: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    de: string;
    it: string;
    pt: string;
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
export type LeagueTranslation = typeof leagueTranslations.$inferSelect;
export type NewLeagueTranslation = typeof leagueTranslations.$inferInsert;
export type CountryTranslation = typeof countryTranslations.$inferSelect;
export type NewCountryTranslation = typeof countryTranslations.$inferInsert;
export type TeamTranslation = typeof teamTranslations.$inferSelect;
export type NewTeamTranslation = typeof teamTranslations.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertUserPreferenceSchema = createInsertSchema(userPreferences);
export const selectUserPreferenceSchema = createSelectSchema(userPreferences);
export const insertLeagueTranslationSchema = createInsertSchema(leagueTranslations);
export const selectLeagueTranslationSchema = createSelectSchema(leagueTranslations);
export const insertCountryTranslationSchema = createInsertSchema(countryTranslations);
export const selectCountryTranslationSchema = createSelectSchema(countryTranslations);
export const cachedFixtures = pgTable("cached_fixtures", {
  id: serial("id").primaryKey(),
  fixtureId: text("fixture_id").notNull().unique(),
  data: jsonb("data").notNull(),
  league: text("league").notNull(),
  date: text("date").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const cachedLeagues = pgTable("cached_leagues", {
  id: serial("id").primaryKey(),
  leagueId: text("league_id").notNull().unique(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  author: text("author"),
  source: text("source"),
  url: text("url"),
  imageUrl: text("image_url"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CachedFixture = typeof cachedFixtures.$inferSelect;
export type InsertCachedFixture = typeof cachedFixtures.$inferInsert;
export type CachedLeague = typeof cachedLeagues.$inferSelect;
export type InsertCachedLeague = typeof cachedLeagues.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = typeof newsArticles.$inferInsert;

export const insertTeamTranslationSchema = createInsertSchema(teamTranslations);
export const selectTeamTranslationSchema = createSelectSchema(teamTranslations);
export const insertCachedFixtureSchema = createInsertSchema(cachedFixtures);
export const selectCachedFixtureSchema = createSelectSchema(cachedFixtures);
export const insertCachedLeagueSchema = createInsertSchema(cachedLeagues);
export const selectCachedLeagueSchema = createSelectSchema(cachedLeagues);
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'email', 'sms', 'push'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<{
    matchId?: string;
    leagueId?: string;
    teamId?: string;
    fixtureId?: string;
  }>(),
  status: text("status").default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  matchStart: boolean("match_start").default(true),
  matchEnd: boolean("match_end").default(false),
  goals: boolean("goals").default(true),
  favoriteTeamMatches: boolean("favorite_team_matches").default(true),
  favoriteLeagueMatches: boolean("favorite_league_matches").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences);
export const selectNotificationPreferenceSchema = createSelectSchema(notificationPreferences);

export const insertNewsArticleSchema = createInsertSchema(newsArticles);
export const selectNewsArticleSchema = createSelectSchema(newsArticles);
