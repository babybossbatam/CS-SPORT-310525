import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  favoriteTeams: jsonb("favorite_teams").$type<number[]>().default([]),
  favoriteLeagues: jsonb("favorite_leagues").$type<number[]>().default([]),
  favoriteMatches: jsonb("favorite_matches").$type<number[]>().default([]),
  region: text("region").default("global"),
  notifications: boolean("notifications").default(true),
  theme: text("theme").default("light"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cached fixtures table
export const cachedFixtures = pgTable("cached_fixtures", {
  id: serial("id").primaryKey(),
  fixtureId: text("fixture_id").notNull().unique(),
  data: jsonb("data").notNull(),
  league: text("league").notNull(),
  date: text("date").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Cached league table
export const cachedLeagues = pgTable("cached_leagues", {
  id: serial("id").primaryKey(),
  leagueId: text("league_id").notNull().unique(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// News articles table
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  source: text("source").notNull(),
  url: text("url"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertCachedFixturesSchema = createInsertSchema(cachedFixtures).omit({
  id: true,
  timestamp: true,
});

export const insertCachedLeaguesSchema = createInsertSchema(cachedLeagues).omit({
  id: true,
  timestamp: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertCachedFixture = z.infer<typeof insertCachedFixturesSchema>;
export type CachedFixture = typeof cachedFixtures.$inferSelect;

export type InsertCachedLeague = z.infer<typeof insertCachedLeaguesSchema>;
export type CachedLeague = typeof cachedLeagues.$inferSelect;

export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
