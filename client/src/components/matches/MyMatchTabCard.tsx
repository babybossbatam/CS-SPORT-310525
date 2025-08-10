import React, { useState, useEffect } from 'react';
import MatchPrediction from './MatchPrediction';
import MyHighlights from './MyHighlights';
import MyLiveAction from './MyLiveAction';
import MyMatchEventNew from './MyMatchEventNew';
import MyShotmap from './MyShotmap';
import MyKeyPlayer from './MyKeyPlayer';
import MyStats from './MyStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyStatsTabCard from './MyStatsTabCard';
import MyH2HNew from './MyH2HNew';
import '@/styles/MyStats.css';

interface MyMatchTabCardProps {
  match: any;
  onTabChange?: (tab: string) => void;
}

const MyMatchTabCard = ({ match, onTabChange }: MyMatchTabCardProps) => {
  if (!match) return null;

  return (
    <>
      {/* Match Prediction */}
      <div className="space-y-2">

        <MatchPrediction 
          homeTeam={match.teams?.home}
          awayTeam={match.teams?.away}
          fixtureId={match.fixture?.id}
        />
      </div>

      {/* Conditional rendering based on match status */}
      {(() => {
        const matchStatus = match.fixture?.status?.short;

        // Check if match is truly live (not finished)
        const actuallyLive = [
          "1H",
          "2H", 
          "LIVE",
          "LIV",
          "HT",
          "ET",
          "P",
          "INT",
          "SUSP",
          "BT"
        ].includes(matchStatus);

        // Check if match is ended by status
        const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);

        // Check if fixture indicates it's finished
        const fixtureFinished = match.fixture?.status?.long === "Match Finished" || 
                               match.fixture?.status?.short === "FT";

        // Final determination: if fixture is finished OR status indicates ended, treat as ended
        const finalIsEnded = isEnded || fixtureFinished;
        const finalIsLive = actuallyLive && !fixtureFinished && !isEnded;

        console.log(`🔍 [MyMatchTabCard] Match ${match.fixture?.id} status detection:`, {
          matchStatus,
          fixtureStatus: match.fixture?.status,
          actuallyLive,
          isEnded,
          fixtureFinished,
          finalIsLive,
          finalIsEnded
        });

        return (
          <>
            {/* Show MyHighlights for ended matches */}
            {finalIsEnded && (
              <div className="space-y-2">
                <MyHighlights 
                  homeTeam={match.teams?.home?.name || "Unknown Team"}
                  awayTeam={match.teams?.away?.name || "Unknown Team"}
                  leagueName={match.league?.name || "Unknown League"}
                  matchStatus={match.fixture?.status?.short}
                  match={match}
                />
              </div>
            )}

            {/* Show MyLiveAction only for truly live matches */}
            {finalIsLive && (
              <div className="space-y-2">
                <MyLiveAction 
                  matchId={match.fixture?.id}
                  homeTeam={match.teams?.home}
                  awayTeam={match.teams?.away}
                  status={match.fixture?.status?.short}
                />
              </div>
            )}

            {/* For upcoming matches, neither component is shown */}
          </>
        );
      })()}

      {/* Match Events */}
      <div className="space-y-2">

        <MyMatchEventNew 
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
          matchData={match}
          theme="light"
        />
      </div>



      {/* Shot Map */}
      <div className="space-y-2">

        <MyShotmap 
          match={match}
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
        />
      </div>

      
      {/* Match Statistics */}
      <Card className="mystats-container">
        <CardHeader>
          <CardTitle className="text-xs">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <MyStatsCard match={match} />
        </CardContent>

        {/* See All Stats Button */}
        <div className="text-center">
          <button
            onClick={() => onTabChange && onTabChange("stats")}
            className="w-full py-1 text-gray-700 hover:bg-gray-200 transition-colors duration-200 font-medium text-xs border-t"
          >
            See All Stats
          </button>
        </div>
      </Card>

      {/* Head to Head */}
      <div className="space-y-2 [&_.border]:rounded-none [&_*]:rounded-none">
        <MyH2HNew match={match} />
      </div>

      {/* Key Players */}
      <div className="space-y-2">
        <MyKeyPlayer 
          match={match}
          fixtureId={match.fixture?.id}
          homeTeam={match.teams?.home?.name}
          awayTeam={match.teams?.away?.name}
        />
      </div>
    </>
  );
};

// Stats component for MyMatchTabCard (without full tab card wrapper)
const MyStatsCard = ({ match }: { match: any }) => {
  const [homeStats, setHomeStats] = useState<any>(null);
  const [awayStats, setAwayStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!match) return null;

  const isUpcoming = match.fixture?.status?.short === "NS";
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;
  const fixtureId = match.fixture?.id;

  // Fetch match statistics
  useEffect(() => {
    if (!fixtureId || isUpcoming) return;

    const fetchMatchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${homeTeam.id}`),
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${awayTeam.id}`)
        ]);

        if (!homeResponse.ok || !awayResponse.ok) {
          throw new Error('Failed to fetch match statistics');
        }

        const homeData = await homeResponse.json();
        const awayData = await awayResponse.json();

        setHomeStats(homeData[0] || null);
        setAwayStats(awayData[0] || null);
      } catch (err) {
        console.error('Error fetching match statistics:', err);
        setError('Failed to load match statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId, homeTeam?.id, awayTeam?.id, isUpcoming]);

  if (isUpcoming) {
    return (
      <div className="text-center text-gray-600">
        <h3 className="text-lg font-medium mb-2">Statistics Coming Soon</h3>
        <p className="text-sm text-gray-500">
          Match statistics will be available once the game starts
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        <p>Loading match statistics...</p>
      </div>
    );
  }

  if (error || !homeStats || !awayStats) {
    return (
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-2">❌</div>
        <p>{error || 'No statistics available for this match'}</p>
      </div>
    );
  }

  return (
    <MyStats
      homeStats={homeStats}
      awayStats={awayStats}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      isExpanded={isExpanded}
      onToggleExpanded={() => setIsExpanded(!isExpanded)}
    />
  );
};

export default MyMatchTabCard;