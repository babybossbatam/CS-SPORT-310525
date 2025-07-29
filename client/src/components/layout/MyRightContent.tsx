import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import TodaysMatchesByCountryNew from '@/components/matches/TodaysMatchesByCountryNew';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

import PopularTeamsList from '@/components/teams/PopularTeamsList';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMainLayoutRight from '@/components/layout/MyMainLayoutRight';


const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [isAllLeagueListExpanded, setIsAllLeagueListExpanded] = useState(false);

  const toggleAllLeagueList = () => {
    setIsAllLeagueListExpanded(!isAllLeagueListExpanded);
  };

  return (
    <>
      {/* New optimized featured match component for testing */}
      <MyHomeFeaturedMatchNew 
        selectedDate={selectedDate} 
        maxMatches={8}
      />

      <HomeTopScorersList />

      <LeagueStandingsFilter />

      {/* Popular Leagues and All League List sections */}
      <div className="grid grid-cols-2 gap-4">
        <PopularLeaguesList />
        
        <Card className="w-full bg-white shadow-sm">
          <CardContent className="p-0">
            <button
              onClick={toggleAllLeagueList}
              className="w-full p-4 flex items-center justify-between transition-colors border-b border-stone-200 font-normal text-[14px]"
            >
              <span
                className="font-medium text-gray-900"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "13.3px",
                }}
              >
                All League List
              </span>
              {isAllLeagueListExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {isAllLeagueListExpanded && (
              <div className="transition-all duration-300 ease-in-out">
                <TodaysMatchesByCountryNew selectedDate={selectedDate} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full shadow-md bg-white">
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-2">Popular Teams</h3>
          <PopularTeamsList />
        </div>
      </div>

      
    </>

  );
};


export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };