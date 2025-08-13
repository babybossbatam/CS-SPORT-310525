
import { db } from '../db.js';
import { leagueTranslations, countryTranslations, teamTranslations } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

class TranslationService {
  private leagueCache = new Map<string, any>();
  private countryCache = new Map<string, any>();
  private teamCache = new Map<string, any>();
  private cacheExpiration = 60 * 60 * 1000; // 1 hour

  // Get league translation from database
  async getLeagueTranslation(leagueName: string, language: string = 'en'): Promise<string> {
    try {
      const cacheKey = `${leagueName}-${language}`;
      const cached = this.leagueCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
        return cached.translation;
      }

      const result = await db
        .select()
        .from(leagueTranslations)
        .where(eq(leagueTranslations.leagueName, leagueName))
        .limit(1);

      if (result.length > 0) {
        const translation = result[0].translations[language] || result[0].translations['en'] || leagueName;
        
        // Cache the result
        this.leagueCache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        return translation;
      }

      return leagueName;
    } catch (error) {
      console.warn(`[TranslationService] Error getting league translation for ${leagueName}:`, error);
      return leagueName;
    }
  }

  // Get country translation from database
  async getCountryTranslation(countryName: string, language: string = 'en'): Promise<string> {
    try {
      const cacheKey = `${countryName}-${language}`;
      const cached = this.countryCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
        return cached.translation;
      }

      const result = await db
        .select()
        .from(countryTranslations)
        .where(eq(countryTranslations.countryName, countryName))
        .limit(1);

      if (result.length > 0) {
        const translation = result[0].translations[language] || result[0].translations['en'] || countryName;
        
        // Cache the result
        this.countryCache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        return translation;
      }

      return countryName;
    } catch (error) {
      console.warn(`[TranslationService] Error getting country translation for ${countryName}:`, error);
      return countryName;
    }
  }

  // Get team translation from database
  async getTeamTranslation(teamName: string, language: string = 'en'): Promise<string> {
    try {
      const cacheKey = `${teamName}-${language}`;
      const cached = this.teamCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
        return cached.translation;
      }

      const result = await db
        .select()
        .from(teamTranslations)
        .where(eq(teamTranslations.teamName, teamName))
        .limit(1);

      if (result.length > 0) {
        const translation = result[0].translations[language] || result[0].translations['en'] || teamName;
        
        // Cache the result
        this.teamCache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        return translation;
      }

      return teamName;
    } catch (error) {
      console.warn(`[TranslationService] Error getting team translation for ${teamName}:`, error);
      return teamName;
    }
  }

  // Add or update league translation
  async upsertLeagueTranslation(leagueName: string, translations: any, leagueId?: number): Promise<void> {
    try {
      await db
        .insert(leagueTranslations)
        .values({
          leagueName,
          leagueId,
          translations,
        })
        .onConflictDoUpdate({
          target: leagueTranslations.leagueName,
          set: {
            translations,
            leagueId,
            updatedAt: new Date(),
          }
        });

      // Clear cache for this league
      this.clearLeagueCache(leagueName);
      console.log(`✅ [TranslationService] Updated translation for league: ${leagueName}`);
    } catch (error) {
      console.error(`[TranslationService] Error upserting league translation:`, error);
    }
  }

  // Add or update country translation
  async upsertCountryTranslation(countryName: string, translations: any): Promise<void> {
    try {
      await db
        .insert(countryTranslations)
        .values({
          countryName,
          translations,
        })
        .onConflictDoUpdate({
          target: countryTranslations.countryName,
          set: {
            translations,
            updatedAt: new Date(),
          }
        });

      // Clear cache for this country
      this.clearCountryCache(countryName);
      console.log(`✅ [TranslationService] Updated translation for country: ${countryName}`);
    } catch (error) {
      console.error(`[TranslationService] Error upserting country translation:`, error);
    }
  }

  // Add or update team translation
  async upsertTeamTranslation(teamName: string, translations: any, teamId?: number): Promise<void> {
    try {
      await db
        .insert(teamTranslations)
        .values({
          teamName,
          teamId,
          translations,
        })
        .onConflictDoUpdate({
          target: teamTranslations.teamName,
          set: {
            translations,
            teamId,
            updatedAt: new Date(),
          }
        });

      // Clear cache for this team
      this.clearTeamCache(teamName);
      console.log(`✅ [TranslationService] Updated translation for team: ${teamName}`);
    } catch (error) {
      console.error(`[TranslationService] Error upserting team translation:`, error);
    }
  }

  // Bulk load translations from existing mappings
  async bulkLoadLeagueTranslations(mappings: Record<string, any>): Promise<void> {
    try {
      const entries = Object.entries(mappings);
      console.log(`📥 [TranslationService] Bulk loading ${entries.length} league translations...`);

      for (const [leagueName, translations] of entries) {
        await this.upsertLeagueTranslation(leagueName, translations);
      }

      console.log(`✅ [TranslationService] Bulk loaded ${entries.length} league translations`);
    } catch (error) {
      console.error(`[TranslationService] Error bulk loading league translations:`, error);
    }
  }

  // Bulk load country translations
  async bulkLoadCountryTranslations(mappings: Record<string, any>): Promise<void> {
    try {
      const entries = Object.entries(mappings);
      console.log(`📥 [TranslationService] Bulk loading ${entries.length} country translations...`);

      for (const [countryName, translations] of entries) {
        await this.upsertCountryTranslation(countryName, translations);
      }

      console.log(`✅ [TranslationService] Bulk loaded ${entries.length} country translations`);
    } catch (error) {
      console.error(`[TranslationService] Error bulk loading country translations:`, error);
    }
  }

  // Clear cache methods
  private clearLeagueCache(leagueName: string) {
    const languages = ['en', 'es', 'zh', 'zh-hk', 'zh-tw', 'de', 'it', 'pt'];
    languages.forEach(lang => {
      this.leagueCache.delete(`${leagueName}-${lang}`);
    });
  }

  private clearCountryCache(countryName: string) {
    const languages = ['en', 'es', 'zh', 'zh-hk', 'zh-tw', 'de', 'it', 'pt'];
    languages.forEach(lang => {
      this.countryCache.delete(`${countryName}-${lang}`);
    });
  }

  private clearTeamCache(teamName: string) {
    const languages = ['en', 'es', 'zh', 'zh-hk', 'zh-tw', 'de', 'it', 'pt'];
    languages.forEach(lang => {
      this.teamCache.delete(`${teamName}-${lang}`);
    });
  }

  // Get cache stats
  getCacheStats() {
    return {
      leagues: this.leagueCache.size,
      countries: this.countryCache.size,
      teams: this.teamCache.size
    };
  }
}

export const translationService = new TranslationService();
