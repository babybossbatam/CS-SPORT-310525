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

  const EmptyState = () => {
    if (selectedTab === "my-selections") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 text-sm font-medium text-gray-900">
            My Teams and Leagues
          </div>
          <div className="mb-8 relative">
            <img
              src="/assets/matchdetaillogo/favorite icon.svg"
              alt="Favorite"
              width="80"
              height="80"
              className="mx-auto"
            />
          </div>
          <p className="mb-8 text-sm text-gray-600 max-w-xs">
            Select Teams and Competitions to follow them here
          </p>
          <Button
            onClick={() => setShowTeamSelection(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-medium"
          >
            Browse
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-50 rounded-lg">
        <div className="mb-8 relative">
          <img
            src="/assets/matchdetaillogo/favorite icon.svg"
            alt="Favorite"
            width="80"
            height="80"
            className="mx-auto"
          />
        </div>
        <p className="mb-6 text-sm text-gray-600 max-w-xs">
          Select Games, Teams and Competitions to follow them on My Scores
        </p>
      </div>
    );
  };

  const SuggestedGames = () => (
    <div className="mt-12">
      <h2 className="text-xl font-semibold text-center mb-8 text-gray-800"></h2>
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
        {selectedTeams.length === 0 ? <EmptyState /> : <SuggestedGames />}
      </CardContent>
    </Card>
  );
};

export default MyScoresCard;
