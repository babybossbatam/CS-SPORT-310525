import React, { useState, useMemo } from 'react';
import MatchPredictionsCard from '@/components/matches/MatchPredictionsCard';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyHighlights from '@/components/matches/MyHighlights';
import MyMatchEventNew from '@/components/matches/MyMatchEventNew';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMatchTabCard from '@/components/matches/MyMatchTabCard';
import MyStatsTabCard from '@/components/matches/MyStatsTabCard';
import MyLineupsTabsCard from '@/components/matches/MyLineupsTabsCard';
import MyTrendsTabsCard from '@/components/matches/MyTrendsTabsCard';
import MyHeadtoheadTabsCard from '@/components/matches/MyHeadtoheadTabsCard';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyWorldTeamLogo from '@/components/matches/MyWorldTeamLogo';
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';
import TranslatedMatchComponents from '@/components/common/TranslatedMatchComponents';

interface MyMainLayoutRightProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyMainLayoutRight: React.FC<MyMainLayoutRightProps> = ({ selectedFixture, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("match");
  const { isMobile } = useDeviceInfo();
  const { 
    translateTeamName, 
    translateLeagueName, 
    translateCountryName,
    currentLanguage,
    isRoutingComplete 
  } = useLanguage();
  const { t } = useTranslation();

  // Debug logging to verify data reception from MyNewLeague2
  console.log(`🔍 [MyMainLayoutRight] Received selectedFixture:`, {
    fixtureId: selectedFixture?.fixture?.id,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`,
    league: selectedFixture?.league?.name,
    status: selectedFixture?.fixture?.status?.short,
    fullData: selectedFixture
  });

  // Create translated fixture for ScoreDetailsCard
  const translatedFixture = React.useMemo(() => {
    if (!selectedFixture || !isRoutingComplete) return selectedFixture;

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
      }
    };
  }, [selectedFixture, translateTeamName, translateLeagueName, translateCountryName, currentLanguage, isRoutingComplete]);

  return (
    <div className={cn(
      "h-full min-h-0 max-h-full overflow-y-auto",
      isMobile 
        ? "w-full px-2 pb-20" // Mobile: proper scroll container
        : "pb-4" // Desktop: add bottom padding
    )}>
      <div className={cn(
        isMobile ? "mb-4" : "mb-6"
      )}>
        <ScoreDetailsCard
          currentFixture={translatedFixture}
          onClose={onClose}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className={cn(
        "space-y-4",
        isMobile ? "mobile-tab-content px-1" : ""
      )}>
        <TranslatedMatchComponents
          activeTab={activeTab}
          selectedFixture={selectedFixture}
          onTabChange={setActiveTab}
          isMobile={isMobile}
        />
      </div>




      {/* Conditional rendering based on match status */}
      {(() => {
        const matchStatus = selectedFixture?.fixture?.status?.short;
        const isLive = [
          "1H",
          "2H",
          "LIVE",
          "LIV",
          "HT",
          "ET",
          "P",
          "INT",
        ].includes(matchStatus);
        const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);
        const isUpcoming = ["NS", "TBD"].includes(matchStatus);

        console.log(`🔍 [MyMainLayoutRight] Match ${selectedFixture?.fixture?.id} status detection:`, {
          matchStatus,
          isLive,
          isEnded,
          isUpcoming,
          fixtureStatus: selectedFixture?.fixture?.status
        });

        console.log(`📋 [MyMainLayoutRight] Complete selectedFixture data:`, {
          fixtureId: selectedFixture?.fixture?.id,
          fixtureDate: selectedFixture?.fixture?.date,
          status: selectedFixture?.fixture?.status,
          homeTeam: selectedFixture?.teams?.home,
          awayTeam: selectedFixture?.teams?.away,
          league: selectedFixture?.league,
          goals: selectedFixture?.goals,
          events: selectedFixture?.events?.length || 0,
          fullObject: selectedFixture
        });

        return (
          <>

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

</div>
  );
};

export default MyMainLayoutRight;