
/**
 * Translation Cache Fixer Utility
 * Helps identify and fix incorrect team name translations
 */

import { smartTeamTranslation } from './smartTeamTranslation';

interface TranslationIssue {
  teamName: string;
  currentTranslation: string;
  expectedTranslation: string;
  language: string;
  severity: 'high' | 'medium' | 'low';
}

export class TranslationCacheFixer {
  /**
   * Identify known translation issues
   */
  static identifyIssues(): TranslationIssue[] {
    const issues: TranslationIssue[] = [];
    
    // Known problematic translations
    const problematicMappings = [
      {
        teamName: 'AEL',
        wrongTranslation: 'Israel',
        correctTranslation: 'AEL利馬索爾',
        language: 'zh-hk'
      },
      {
        teamName: 'Deportivo Cali',
        wrongTranslation: '帕斯托體育',
        correctTranslation: '卡利體育',
        language: 'zh-hk'
      },
      {
        teamName: 'Alianza Petrolera',
        wrongTranslation: 'Alianza Lima',
        correctTranslation: '石油聯盟',
        language: 'zh-hk'
      },
      {
        teamName: 'Masr',
        wrongTranslation: 'AL Masry',
        correctTranslation: '埃及',
        language: 'zh-hk'
      }
    ];

    // Check each problematic mapping
    problematicMappings.forEach(mapping => {
      const cacheKey = `smart_translation_${mapping.teamName}_${mapping.language}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached && cached.includes(mapping.wrongTranslation)) {
        issues.push({
          teamName: mapping.teamName,
          currentTranslation: cached,
          expectedTranslation: mapping.correctTranslation,
          language: mapping.language,
          severity: 'high'
        });
      }
    });

    return issues;
  }

  /**
   * Fix all identified translation issues
   */
  static fixAllIssues(): number {
    const issues = this.identifyIssues();
    let fixedCount = 0;

    // Also check for additional corrupted entries
    const additionalCorrupted = this.findAdditionalCorruptedEntries();
    
    [...issues, ...additionalCorrupted].forEach(issue => {
      const cacheKey = `smart_translation_${issue.teamName}_${issue.language}`;
      
      // Remove the incorrect cache entry
      localStorage.removeItem(cacheKey);
      
      // Set the correct translation if we have one
      if (issue.expectedTranslation && issue.expectedTranslation !== issue.teamName) {
        try {
          localStorage.setItem(cacheKey, issue.expectedTranslation);
          fixedCount++;
          console.log(`✅ Fixed translation: ${issue.teamName} -> ${issue.expectedTranslation}`);
        } catch (error) {
          console.error(`❌ Failed to fix translation for ${issue.teamName}:`, error);
        }
      } else {
        // Just remove the corrupted entry
        fixedCount++;
        console.log(`🧹 Removed corrupted translation cache for: ${issue.teamName}`);
      }
    });

    console.log(`🔧 Fixed ${fixedCount} translation issues out of ${issues.length + additionalCorrupted.length} identified`);
    return fixedCount;
  }

  /**
   * Find additional corrupted entries beyond known issues
   */
  static findAdditionalCorruptedEntries(): TranslationIssue[] {
    const corrupted: TranslationIssue[] = [];
    
    // Pattern: teams that got mapped to "Israel" incorrectly
    const israelMismaps = ['Grosseto', 'Nublense', 'Lumezzane', 'Mantova', 'Sibenik', 'Vodice'];
    
    israelMismaps.forEach(teamName => {
      ['zh', 'zh-hk', 'zh-tw'].forEach(language => {
        const cacheKey = `smart_translation_${teamName}_${language}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached && cached.toLowerCase().includes('israel')) {
          corrupted.push({
            teamName,
            currentTranslation: cached,
            expectedTranslation: teamName, // Keep original if no proper translation
            language,
            severity: 'high'
          });
        }
      });
    });

    return corrupted;
  }

  /**
   * Verify a specific team's translation
   */
  static verifyTeamTranslation(teamName: string, language: string = 'zh-hk'): void {
    const current = smartTeamTranslation.translateTeamName(teamName, language);
    const cacheKey = `smart_translation_${teamName}_${language}`;
    const cached = localStorage.getItem(cacheKey);
    
    console.log(`🔍 Translation verification for "${teamName}":`, {
      currentTranslation: current,
      cachedTranslation: cached,
      language: language,
      cacheKey: cacheKey
    });
  }

  /**
   * Bulk verify multiple teams
   */
  static bulkVerifyTeams(teamNames: string[], language: string = 'zh-hk'): void {
    console.log(`🔍 Bulk verification for ${teamNames.length} teams in ${language}:`);
    
    teamNames.forEach(teamName => {
      const current = smartTeamTranslation.translateTeamName(teamName, language);
      console.log(`  ${teamName} -> ${current}`);
    });
  }

  /**
   * Clear cache for specific teams
   */
  static clearTeamCache(teamNames: string[], languages: string[] = ['zh-hk', 'zh', 'zh-tw']): void {
    let clearedCount = 0;
    
    teamNames.forEach(teamName => {
      languages.forEach(language => {
        const cacheKey = `smart_translation_${teamName}_${language}`;
        if (localStorage.getItem(cacheKey)) {
          localStorage.removeItem(cacheKey);
          clearedCount++;
        }
      });
    });
    
    console.log(`🧹 Cleared cache for ${clearedCount} team-language combinations`);
  }

  /**
   * Emergency cache reset
   */
  static emergencyReset(): void {
    // Clear all translation cache
    smartTeamTranslation.clearCache();
    
    // Remove all smart translation entries from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('smart_translation_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🚨 Emergency reset completed: removed ${keysToRemove.length} cache entries`);
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).translationFixer = TranslationCacheFixer;
  
  // Quick fix function
  (window as any).quickFixTranslations = () => {
    const fixedCount = TranslationCacheFixer.fixAllIssues();
    console.log(`🔧 Quick fix completed: ${fixedCount} issues resolved`);
    return fixedCount;
  };
  
  // Verify problematic teams
  (window as any).verifyProblematicTeams = () => {
    const problematicTeams = ['AEL', 'Deportivo Cali', 'Alianza Petrolera', 'Masr'];
    TranslationCacheFixer.bulkVerifyTeams(problematicTeams);
  };
}
