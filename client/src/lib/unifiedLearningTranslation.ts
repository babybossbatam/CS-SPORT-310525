
import { smartLeagueCountryTranslation } from './smartLeagueCountryTranslation';
import { smartTeamTranslation } from './smartTeamTranslation';

interface TranslationMapping {
  original: string;
  translations: { [language: string]: string };
  type: 'country' | 'league' | 'team';
  frequency: number;
  lastUsed: number;
  confidence: number;
}

interface EncounteredData {
  countries: Set<string>;
  leagues: Map<string, { name: string; country: string; id: number }>;
  teams: Map<string, { name: string; country: string; leagueId?: number }>;
}

class UnifiedLearningTranslation {
  private mappings: Map<string, TranslationMapping> = new Map();
  private encounteredData: EncounteredData = {
    countries: new Set(),
    leagues: new Map(),
    teams: new Map()
  };
  private storageKey = 'unified_translation_mappings';
  private encountersKey = 'translation_encounters';
  private maxMappings = 10000;
  private cleanupThreshold = 12000;

  constructor() {
    this.loadMappings();
    this.loadEncounters();
  }

  // Learn from fixture data automatically
  learnFromFixture(fixture: any): void {
    if (!fixture) return;

    try {
      // Learn country
      if (fixture.league?.country) {
        this.learnCountry(fixture.league.country);
      }

      // Learn league
      if (fixture.league?.name && fixture.league?.country) {
        this.learnLeague(fixture.league.name, fixture.league.country, fixture.league.id);
      }

      // Learn teams
      if (fixture.teams?.home?.name && fixture.league?.country) {
        this.learnTeam(fixture.teams.home.name, fixture.league.country, fixture.league?.id);
      }
      if (fixture.teams?.away?.name && fixture.league?.country) {
        this.learnTeam(fixture.teams.away.name, fixture.league.country, fixture.league?.id);
      }
    } catch (error) {
      console.warn('🚨 [UnifiedTranslation] Error learning from fixture:', error);
    }
  }

  // Learn country data
  private learnCountry(country: string): void {
    if (!country || this.encounteredData.countries.has(country)) return;

    this.encounteredData.countries.add(country);
    
    // Generate translations using existing smart system
    const languages = ['zh', 'zh-hk', 'zh-tw', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'ko'];
    const translations: { [language: string]: string } = {};
    
    languages.forEach(lang => {
      const translated = smartLeagueCountryTranslation.translateCountryName(country, lang);
      if (translated && translated !== country) {
        translations[lang] = translated;
      }
    });

    if (Object.keys(translations).length > 0) {
      this.addMapping(country, translations, 'country', 0.8);
    }
  }

  // Learn league data
  private learnLeague(leagueName: string, country: string, leagueId?: number): void {
    if (!leagueName) return;

    const key = `${leagueName}_${country}`;
    if (this.encounteredData.leagues.has(key)) return;

    this.encounteredData.leagues.set(key, { name: leagueName, country, id: leagueId || 0 });

    // Generate translations using existing smart system
    const languages = ['zh', 'zh-hk', 'zh-tw', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'ko'];
    const translations: { [language: string]: string } = {};
    
    languages.forEach(lang => {
      const translated = smartLeagueCountryTranslation.translateLeagueName(leagueName, lang);
      if (translated && translated !== leagueName) {
        translations[lang] = translated;
      }
    });

    if (Object.keys(translations).length > 0) {
      this.addMapping(leagueName, translations, 'league', 0.9);
    }
  }

  // Learn team data
  private learnTeam(teamName: string, country: string, leagueId?: number): void {
    if (!teamName) return;

    const key = `${teamName}_${country}`;
    if (this.encounteredData.teams.has(key)) return;

    this.encounteredData.teams.set(key, { name: teamName, country, leagueId });

    // Generate translations using existing smart system
    const languages = ['zh', 'zh-hk', 'zh-tw', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'ko'];
    const translations: { [language: string]: string } = {};
    
    languages.forEach(lang => {
      const translated = smartTeamTranslation.translateTeam(teamName, lang, country, leagueId);
      if (translated && translated !== teamName) {
        translations[lang] = translated;
      }
    });

    if (Object.keys(translations).length > 0) {
      this.addMapping(teamName, translations, 'team', 0.7);
    }
  }

  // Add mapping to learned data
  private addMapping(
    original: string,
    translations: { [language: string]: string },
    type: 'country' | 'league' | 'team',
    confidence: number
  ): void {
    const existing = this.mappings.get(original);
    
    if (existing) {
      // Merge translations and update frequency
      existing.translations = { ...existing.translations, ...translations };
      existing.frequency += 1;
      existing.lastUsed = Date.now();
      existing.confidence = Math.max(existing.confidence, confidence);
    } else {
      this.mappings.set(original, {
        original,
        translations,
        type,
        frequency: 1,
        lastUsed: Date.now(),
        confidence
      });
    }

    // Cleanup if needed
    if (this.mappings.size > this.cleanupThreshold) {
      this.cleanup();
    }

    this.saveMappings();
  }

  // Get translation
  translate(text: string, language: string, type: 'country' | 'league' | 'team'): string {
    if (!text || !language) return text;

    const mapping = this.mappings.get(text);
    if (mapping && mapping.type === type && mapping.translations[language]) {
      // Update usage stats
      mapping.frequency += 1;
      mapping.lastUsed = Date.now();
      this.saveMappings();
      
      return mapping.translations[language];
    }

    return text;
  }

  // Batch learn from fixtures array
  batchLearnFromFixtures(fixtures: any[]): void {
    if (!Array.isArray(fixtures)) return;

    console.log(`🎓 [UnifiedTranslation] Batch learning from ${fixtures.length} fixtures...`);
    
    fixtures.forEach(fixture => {
      this.learnFromFixture(fixture);
    });

    this.saveEncounters();
    console.log(`🎓 [UnifiedTranslation] Learned from ${fixtures.length} fixtures. Total mappings: ${this.mappings.size}`);
  }

  // Get statistics
  getStats(): {
    totalMappings: number;
    countries: number;
    leagues: number;
    teams: number;
    encounteredCountries: number;
    encounteredLeagues: number;
    encounteredTeams: number;
  } {
    const byType = {
      country: 0,
      league: 0,
      team: 0
    };

    this.mappings.forEach(mapping => {
      byType[mapping.type]++;
    });

    return {
      totalMappings: this.mappings.size,
      countries: byType.country,
      leagues: byType.league,
      teams: byType.team,
      encounteredCountries: this.encounteredData.countries.size,
      encounteredLeagues: this.encounteredData.leagues.size,
      encounteredTeams: this.encounteredData.teams.size
    };
  }

  // Export learned mappings for manual review
  exportMappings(): string {
    const data = {
      mappings: Array.from(this.mappings.entries()),
      encounters: {
        countries: Array.from(this.encounteredData.countries),
        leagues: Array.from(this.encounteredData.leagues.entries()),
        teams: Array.from(this.encounteredData.teams.entries())
      },
      exportDate: new Date().toISOString(),
      stats: this.getStats()
    };

    return JSON.stringify(data, null, 2);
  }

  // Cleanup old/unused mappings
  private cleanup(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const sortedMappings = Array.from(this.mappings.entries())
      .sort((a, b) => {
        // Sort by frequency and last used
        const aScore = a[1].frequency * (a[1].lastUsed > thirtyDaysAgo ? 2 : 1);
        const bScore = b[1].frequency * (b[1].lastUsed > thirtyDaysAgo ? 2 : 1);
        return bScore - aScore;
      });

    // Keep only the top mappings
    this.mappings.clear();
    sortedMappings.slice(0, this.maxMappings).forEach(([key, value]) => {
      this.mappings.set(key, value);
    });

    console.log(`🧹 [UnifiedTranslation] Cleaned up mappings. Kept ${this.mappings.size} most used mappings.`);
  }

  // Load mappings from localStorage
  private loadMappings(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.mappings = new Map(parsed);
        console.log(`🎓 [UnifiedTranslation] Loaded ${this.mappings.size} translation mappings from storage`);
      }
    } catch (error) {
      console.warn('🚨 [UnifiedTranslation] Failed to load mappings:', error);
      this.mappings = new Map();
    }
  }

  // Save mappings to localStorage
  private saveMappings(): void {
    try {
      const data = Array.from(this.mappings.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('🚨 [UnifiedTranslation] Failed to save mappings:', error);
    }
  }

  // Load encounters from localStorage
  private loadEncounters(): void {
    try {
      const stored = localStorage.getItem(this.encountersKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.encounteredData = {
          countries: new Set(parsed.countries || []),
          leagues: new Map(parsed.leagues || []),
          teams: new Map(parsed.teams || [])
        };
        console.log(`🎓 [UnifiedTranslation] Loaded encounter data from storage`);
      }
    } catch (error) {
      console.warn('🚨 [UnifiedTranslation] Failed to load encounters:', error);
    }
  }

  // Save encounters to localStorage
  private saveEncounters(): void {
    try {
      const data = {
        countries: Array.from(this.encounteredData.countries),
        leagues: Array.from(this.encounteredData.leagues.entries()),
        teams: Array.from(this.encounteredData.teams.entries())
      };
      localStorage.setItem(this.encountersKey, JSON.stringify(data));
    } catch (error) {
      console.warn('🚨 [UnifiedTranslation] Failed to save encounters:', error);
    }
  }

  // Clear all learned data
  clearAll(): void {
    this.mappings.clear();
    this.encounteredData = {
      countries: new Set(),
      leagues: new Map(),
      teams: new Map()
    };
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.encountersKey);
    console.log('🧹 [UnifiedTranslation] Cleared all learned translation data');
  }
}

// Create singleton instance
export const unifiedLearningTranslation = new UnifiedLearningTranslation();
