
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useLocation } from "wouter";
import TodayMatchPageCard from '@/components/matches/TodayMatchPageCard';
import TodaysMatchesByCountryNew from '@/components/matches/TodaysMatchesByCountryNew';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import UefaU21MatchCard from '@/components/matches/UefaU21MatchCard';
import { Card, CardContent } from '@/components/ui/card';

interface MyMainLayoutProps {
  fixtures: any[];
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ fixtures }) => {
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-lg py-4" style={{ marginLeft: '150px', marginRight: '150px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* UEFA U21 Championship Matches */}
          <UefaU21MatchCard onMatchClick={handleMatchClick} />
          
          {/* New TodayMatchPageCard for testing */}
          <div>
            <TodayMatchPageCard 
              fixtures={fixtures}
              onMatchClick={handleMatchClick}
            />
          </div>

          
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default MyMainLayout;
