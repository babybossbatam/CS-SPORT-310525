import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import MyAllLeague from '@/components/matches/MyAllLeague';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

import PopularTeamsList from '@/components/teams/PopularTeamsList';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMainLayoutRight from '@/components/layout/MyMainLayoutRight';
import MyInfo from '@/components/info/MyInfo';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';


const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const { isMobile } = useDeviceInfo();

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 min-h-full">
      {/* Featured Match Section - Hidden on mobile */}
      {!isMobile && (
        <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg mb-4">
          <MyHomeFeaturedMatchNew 
            selectedDate={selectedDate} 
            maxMatches={8}
          />
        </div>
      )}

      <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg mb-4">
        <HomeTopScorersList />
      </div>

      <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg mb-4">
        <LeagueStandingsFilter />
      </div>

      {/* CS SPORT Information Card */}
      <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg mb-4">
        <MyInfo />
      </div>

      {/* Popular Leagues and All League List sections */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg">
            <PopularLeaguesList />
          </div>
          <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg">
            <PopularTeamsList />
          </div>
        </div>
        <div className="dark:bg-gray-800 dark:border-gray-700 rounded-lg">
          <MyAllLeague />
        </div>
      </div>
    </div>
  );
};


export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };