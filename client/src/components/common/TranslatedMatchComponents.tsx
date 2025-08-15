
import React from 'react';
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';
import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';

interface TranslatedMatchComponentsProps {
  activeTab: string;
  selectedFixture: any;
  onTabChange: (tab: string) => void;
  isMobile: boolean;
}

const TranslatedMatchComponents: React.FC<TranslatedMatchComponentsProps> = ({
  activeTab,
  selectedFixture,
  onTabChange,
  isMobile
}) => {
  const { 
    translateTeamName, 
    translateLeagueName, 
    translateCountryName,
    currentLanguage,
    isRoutingComplete 
  } = useLanguage();
  const { t } = useTranslation();

  // Wait for routing to complete before rendering translated content
  if (!isRoutingComplete) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Create translated fixture object
  const translatedFixture = React.useMemo(() => {
    if (!selectedFixture) return null;

    return {
      ...selectedFixture,
      teams: {
        home: {
          ...selectedFixture.teams?.home,
          name: translateTeamName(selectedFixture.teams?.home?.name || '')
        },
        away: {
          ...selectedFixture.teams?.away,
          name: translateTeamName(selectedFixture.teams?.away?.name || '')
        }
      },
      league: {
        ...selectedFixture.league,
        name: translateLeagueName(selectedFixture.league?.name || ''),
        country: translateCountryName(selectedFixture.league?.country || '')
      },
      // Translate venue if available
      fixture: {
        ...selectedFixture.fixture,
        venue: {
          ...selectedFixture.fixture?.venue,
          city: selectedFixture.fixture?.venue?.city ? 
            translateCountryName(selectedFixture.fixture.venue.city) : 
            selectedFixture.fixture?.venue?.city
        }
      }
    };
  }, [selectedFixture, translateTeamName, translateLeagueName, translateCountryName, currentLanguage]);

  const commonClasses = isMobile ? "space-y-3" : "space-y-4";

  return (
    <div className={commonClasses}>
      {activeTab === "match" && (
        <MyMatchTabCard 
          match={translatedFixture} 
          onTabChange={onTabChange}
        />
      )}

      {activeTab === "stats" && (
        <MyStatsTabCard 
          match={translatedFixture} 
          onTabChange={onTabChange}
        />
      )}

      {activeTab === "lineups" && (
        <MyLineupsTabsCard 
          match={translatedFixture}
        />
      )}

      {activeTab === "trends" && (
        <MyTrendsTabsCard 
          match={translatedFixture}
        />
      )}

      {activeTab === "h2h" && (
        <MyHeadtoheadTabsCard 
          match={translatedFixture}
        />
      )}
    </div>
  );
};

export default TranslatedMatchComponents;
