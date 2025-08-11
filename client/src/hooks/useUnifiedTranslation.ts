
import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { unifiedLearningTranslation } from '@/lib/unifiedLearningTranslation';

export const useUnifiedTranslation = () => {
  const { currentLanguage } = useLanguage();

  const translateCountry = useCallback((country: string): string => {
    if (!country) return country;
    return unifiedLearningTranslation.translate(country, currentLanguage, 'country');
  }, [currentLanguage]);

  const translateLeague = useCallback((league: string): string => {
    if (!league) return league;
    return unifiedLearningTranslation.translate(league, currentLanguage, 'league');
  }, [currentLanguage]);

  const translateTeam = useCallback((team: string): string => {
    if (!team) return team;
    return unifiedLearningTranslation.translate(team, currentLanguage, 'team');
  }, [currentLanguage]);

  const learnFromFixtures = useCallback((fixtures: any[]) => {
    unifiedLearningTranslation.batchLearnFromFixtures(fixtures);
  }, []);

  const getTranslationStats = useCallback(() => {
    return unifiedLearningTranslation.getStats();
  }, []);

  const exportLearningData = useCallback(() => {
    return unifiedLearningTranslation.exportMappings();
  }, []);

  const clearLearningData = useCallback(() => {
    unifiedLearningTranslation.clearAll();
  }, []);

  return {
    translateCountry,
    translateLeague,
    translateTeam,
    learnFromFixtures,
    getTranslationStats,
    exportLearningData,
    clearLearningData,
    currentLanguage
  };
};
