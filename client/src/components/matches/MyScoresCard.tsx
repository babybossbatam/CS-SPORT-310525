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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-6 relative">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1.5"
          className="mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </div>
      <p className="mb-6 text-sm text-gray-600 px-4">
        Select Games, Teams and Competitions to follow them on My Scores
      </p>
      <Button
        onClick={() => setShowTeamSelection(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium"
      >
        Select Teams and Leagues
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
        {selectedTeams.length === 0 ? (
          <EmptyState />
        ) : (
          <SuggestedGames />
        )}
      </CardContent>
    </Card>
  );
};

export default MyScoresCard;