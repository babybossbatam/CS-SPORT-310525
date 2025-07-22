import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyMainLayoutRight from '@/components/layout/MyMainLayoutRight';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MyDetailsLayout from "@/components/matches/MyDetailsLayout";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyHighlights from "@/components/matches/MyHighlights";
import {Fixture} from '@/types/football';

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

      {/* Popular Leagues and Teams sections */}
      <div className="grid grid-cols-2 gap-4">
        <PopularLeaguesList />
        <div className="w-full shadow-md">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">Popular Teams</h3>
            <PopularTeamsList />
          </div>
        </div>
      </div>
    </>
  );
};

interface MyRightDetailsProps {
  selectedFixture: Fixture | null;
  onClose: () => void;
}

export const MyRightDetails: React.FC<MyRightDetailsProps> = ({ selectedFixture, onClose }) => {
  if (!selectedFixture) return null;

  const matchStatus = selectedFixture?.fixture?.status?.short;
  const isLive = [
    "1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT", "SUSP", "BT"
  ].includes(matchStatus);
  const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);

  console.log(`🔍 [MyRightDetails] Match ${selectedFixture?.fixture?.id} status detection:`, {
    matchStatus,
    isLive,
    isEnded,
    teams: `${selectedFixture?.teams?.home?.name} vs ${selectedFixture?.teams?.away?.name}`
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Match Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Show MyLiveAction for live matches */}
        {isLive && !isEnded && (
          <MyLiveAction
            matchId={selectedFixture?.fixture?.id}
            homeTeam={selectedFixture?.teams?.home}
            awayTeam={selectedFixture?.teams?.away}
            status={selectedFixture?.fixture?.status?.short}
          />
        )}

        {/* Show MyHighlights for ended matches */}
        {isEnded && (
          <MyHighlights
            homeTeam={selectedFixture?.teams?.home?.name}
            awayTeam={selectedFixture?.teams?.away?.name}
            leagueName={selectedFixture?.league?.name}
            matchStatus={selectedFixture?.fixture?.status?.short}
          />
        )}

        {/* Show other match details */}
        <MyDetailsLayout currentFixture={selectedFixture} />
      </CardContent>
    </Card>
  );
};


export default MyRightContent;
export { MyMainLayoutRight as MyRightDetails };