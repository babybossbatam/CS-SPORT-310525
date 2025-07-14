import React from 'react';
import MatchPrediction from './MatchPrediction';
import MyHighlights from './MyHighlights';
import MyLiveAction from './MyLiveAction';
import MyMatchEventNew from './MyMatchEventNew';
import MyHeatmap from './MyHeatmap';
import MyShotmap from './MyShotmap';
import ShotMapVisualization from './ShotMapVisualization';
import MyHeadtoheadTabsCard from './MyHeadtoheadTabsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MyMatchTabCardProps {
  match: any;
}

const MyMatchTabCard = ({ match }: MyMatchTabCardProps) => {
  if (!match) return null;

  return (
    <Tabs defaultValue="prediction" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="prediction">Prediction</TabsTrigger>
        <TabsTrigger value="live">Live</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="highlights">Highlights</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="shotmap">Shot Map</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="h2h">H2H</TabsTrigger>
      </TabsList>
      <TabsContent value="prediction">
        <div className="space-y-2">
          <MatchPrediction
            homeTeam={match.teams?.home}
            awayTeam={match.teams?.away}
            fixtureId={match.fixture?.id}
          />
        </div>
      </TabsContent>

      <TabsContent value="live">
        {(() => {
          const matchStatus = match.fixture?.status?.short;
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

          console.log("🎬 [MyMatchTabCard] Match status check:", {
            matchStatus,
            isEnded,
            teams: `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
            willShowHighlights: isEnded
          });

          return (
            <>
              {isEnded && (
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

              {isLive && !isEnded && (
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
      </TabsContent>

      <TabsContent value="stats">
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
      </TabsContent>

      <TabsContent value="highlights">
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
      </TabsContent>

      <TabsContent value="events">
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
      </TabsContent>

      <TabsContent value="shotmap">
        <MyShotmap
          match={match}
          fixtureId={match?.fixture?.id}
          homeTeam={match?.teams?.home?.name}
          awayTeam={match?.teams?.away?.name}
        />
      </TabsContent>

      <TabsContent value="analytics">
        <div className="space-y-6">
          <ShotMapVisualization
            matchId={match?.fixture?.id || 0}
            homeTeam={match?.teams?.home?.name || 'Home'}
            awayTeam={match?.teams?.away?.name || 'Away'}
          />
          <MyHeatmap
            match={match}
            fixtureId={match?.fixture?.id}
            homeTeam={match?.teams?.home?.name}
            awayTeam={match?.teams?.away?.name}
          />
        </div>
      </TabsContent>

      <TabsContent value="h2h">
        <MyHeadtoheadTabsCard match={match} />
      </TabsContent>
    </Tabs>
  );
};

export default MyMatchTabCard;