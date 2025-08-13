
import { pgTable, text, integer, timestamp, jsonb, boolean, serial, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
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
export const insertTeamTranslationSchema = createInsertSchema(teamTranslations);
export const selectTeamTranslationSchema = createSelectSchema(teamTranslations);
