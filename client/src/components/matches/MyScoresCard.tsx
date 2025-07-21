import React, { useState } from "react";
import { Trophy, Activity, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";
import { enhancedApiWrapper } from "@/lib/enhancedApiWrapper";
import { format } from "date-fns";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import TeamSelectionModal from "@/components/modals/TeamSelectionModal";

interface MyScoresCardProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  selectedTeams?: any[];
  onShowTeamSelection?: () => void;
}

const MyScoresCard: React.FC<MyScoresCardProps> = ({
  selectedTab,
  onTabChange,
  selectedTeams = [],
  onShowTeamSelection,
}) => {
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  // Fetch suggested games (live and upcoming matches)
  const suggestedGamesQuery = useQuery({
    queryKey: ["suggested-games"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const fixtures = await enhancedApiWrapper.fetchFixturesByDate(
        today,
        "MyScores",
      );
      // Get first 10 matches as suggestions
      return fixtures.slice(0, 10);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  

  const MyTeamsSection = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Teams and Leagues</h2>
        <button className="p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {selectedTeams.map((team) => (
          <div key={team.id} className="flex flex-col items-center">
            <div className="w-12 h-12 mb-2 flex items-center justify-center">
              <MyWorldTeamLogo
                teamName={team.name}
                teamLogo={team.type === 'country' 
                  ? `https://hatscripts.github.io/circle-flags/flags/${team.flag}.svg`
                  : `/api/team-logo/square/${team.id}?size=48`
                }
                size="48px"
                className={team.type === 'country' 
                  ? "flag-circle rounded-full" 
                  : "rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                }
                alt={team.name}
                leagueContext={team.type === 'country' ? { name: 'International', country: 'World' } : undefined}
              />
            </div>
            <span className="text-xs text-center text-gray-700 font-medium">
              {team.name}
            </span>
          </div>
        ))}
        
        <div className="flex flex-col items-center">
          <button 
            onClick={() => onShowTeamSelection?.() || setShowTeamSelection(true)}
            className="w-12 h-12 mb-2 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
          >
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <span className="text-xs text-center text-gray-500 font-medium">
            Add More
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-500 text-center">
          Select your favorite leagues to follow them here
        </p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-2  text-center">
      <div className="mb-4 relative">
        <img
          src="/assets/matchdetaillogo/favorite icon.svg"
          alt="Favorite"
          className="h-14 w-14 text-blue-500"
        />
      </div>
      <p className="mb-4 text-xs">
        Select Teams and Competitions to follow them here
      </p>
      <Button
        onClick={() => setShowTeamSelection(true)}
        className="bg-blue-500  w-56 h-8 text-white px-8  rounded-full text-sm font-normal"
      >
        Browse
      </Button>
    </div>
  );

  const SuggestedGames = () => (
    <div className="mt-12">
      <h2 className="text-xl font-semibold text-center mb-8 text-gray-800">

      </h2>
      <div className="space-y-4 max-w-2xl mx-auto">
        {suggestedGamesQuery.data?.map((fixture: any) => (
          <Card
            key={fixture.fixture.id}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      {format(new Date(fixture.fixture.date), "EEE, MMM d")}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(new Date(fixture.fixture.date), "h:mm a")}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <MyWorldTeamLogo
                        teamId={fixture.teams.home.id}
                        teamName={fixture.teams.home.name}
                        size={24}
                      />
                      <span className="font-medium">
                        {fixture.teams.home.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {fixture.fixture.status.short === "NS" ? (
                        <span className="text-gray-400">vs</span>
                      ) : (
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {fixture.goals?.home || 0} -{" "}
                            {fixture.goals?.away || 0}
                          </div>
                          {fixture.fixture.status.short !== "FT" && (
                            <div className="text-xs text-green-600">
                              {fixture.fixture.status.elapsed}'
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <MyWorldTeamLogo
                        teamId={fixture.teams.away.id}
                        teamName={fixture.teams.away.name}
                        size={24}
                      />
                      <span className="font-medium">
                        {fixture.teams.away.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-sm text-gray-600">
                    {fixture.league.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fixture.league.country}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="shadow-md w-full mb-4">
      <TeamSelectionModal
        open={showTeamSelection}
        onOpenChange={setShowTeamSelection}
      />

      <CardContent className="pt-4 mt-4">
        {selectedTeams.length > 0 ? <MyTeamsSection /> : <EmptyState />}
        <SuggestedGames />
      </CardContent>
    </Card>
  );
};

export default MyScoresCard;