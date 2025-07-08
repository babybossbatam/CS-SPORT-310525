import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MatchPredictionsCard from '@/components/matches/MatchPredictionsCard';
import MyLiveAction from '@/components/matches/MyLiveAction';
import MyHighlights from '@/components/matches/MyHighlights';
import MatchDetailCard from '@/components/matches/MatchDetailCard';
import MyMatchEventNew from '@/components/matches/MyMatchEventNew';

interface MyRightDetailsProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyRightDetails: React.FC<MyRightDetailsProps> = ({ selectedFixture, onClose }) => {
  return (
    <>
      <ScoreDetailsCard
        currentFixture={selectedFixture}
        onClose={onClose}
      />

      {/* Match Predictions Card */}
      <MatchPredictionsCard
        homeTeam={selectedFixture?.teams?.home?.name || "Home Team"}
        awayTeam={selectedFixture?.teams?.away?.name || "Away Team"}
        homeTeamLogo={selectedFixture?.teams?.home?.logo}
        awayTeamLogo={selectedFixture?.teams?.away?.logo}
        matchStatus={selectedFixture?.fixture?.status?.short}
        fixtureId={selectedFixture?.fixture?.id}
        homeTeamId={selectedFixture?.teams?.home?.id}
        awayTeamId={selectedFixture?.teams?.away?.id}
        leagueId={selectedFixture?.league?.id}
      />

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

        console.log(`🔍 [MyRightDetails] Match ${selectedFixture?.fixture?.id} status detection:`, {
          matchStatus,
          isLive,
          isEnded,
          isUpcoming,
          fixtureStatus: selectedFixture?.fixture?.status
        });

        return (
          <>
            {/* Show MyLiveAction only for live matches, not for finished matches */}
            {isLive && !isEnded && (
              <MyLiveAction
                matchId={selectedFixture?.fixture?.id}
                homeTeam={selectedFixture?.teams?.home}
                awayTeam={selectedFixture?.teams?.away}
                status={selectedFixture?.fixture?.status?.short}
              />
            )}

            {/* Show MyHighlights for finished matches */}
            {isEnded && (
              <MyHighlights
                homeTeam={selectedFixture?.teams?.home?.name}
                awayTeam={selectedFixture?.teams?.away?.name}
                leagueName={selectedFixture?.league?.name}
                matchStatus={selectedFixture?.fixture?.status?.short}
              />
            )}

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

      <MatchDetailCard match={selectedFixture} />

      {/* Match Events Timeline */}
      <MyMatchEventNew
        fixtureId={selectedFixture?.fixture?.id}
        homeTeam={selectedFixture?.teams?.home?.name}
        awayTeam={selectedFixture?.teams?.away?.name}
        matchData={selectedFixture}
        theme="light"
        refreshInterval={15}
        showErrors={false}
        showLogos={true}
        className="mt-4"
      />
    </>
  );
};

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

export { MyRightDetails };
export default MyRightContent;