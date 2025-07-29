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


const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

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
        <MyAllLeague />
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