
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import { Card, CardContent } from '@/components/ui/card';

const MyRightContent: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <>
      {/* New optimized featured match component for testing */}
      <MyHomeFeaturedMatchNew 
        selectedDate={selectedDate} 
        maxMatches={8}
      />
      <Card className="shadow-md">
        <CardContent className="p-0">
          <HomeTopScorersList />
        </CardContent>
      </Card>

      <LeagueStandingsFilter />

      {/* Popular Leagues and Teams sections */}
      <div className="grid grid-cols-2 gap-4">
        <PopularLeaguesList />
        <Card className="w-full shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">Popular Teams</h3>
            <PopularTeamsList />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MyRightContent;
