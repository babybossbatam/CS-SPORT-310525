import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import MyStats from "./MyStats";
import MyShots from "./MyShots";

interface MyStatsTabCardProps {
  match?: any;
  onTabChange?: (tab: string) => void;
}

interface TeamStatistic {
  type: string;
  value: number | string;
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: TeamStatistic[];
}

const MyStatsTabCard: React.FC<MyStatsTabCardProps> = ({
  match,
  onTabChange,
}) => {
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!match) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            No match data available
          </div>
        </CardContent>
      </Card>
    );
  }

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

        // Fetch stats for both teams
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${homeTeam.id}`),
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${awayTeam.id}`),
        ]);

        if (!homeResponse.ok || !awayResponse.ok) {
          throw new Error("Failed to fetch match statistics");
        }

        const homeData = await homeResponse.json();
        const awayData = await awayResponse.json();

        setHomeStats(homeData[0] || null);
        setAwayStats(awayData[0] || null);
      } catch (err) {
        console.error("Error fetching match statistics:", err);
        setError("Failed to load match statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId, homeTeam?.id, awayTeam?.id, isUpcoming]);

  // If it's an upcoming match, show the preview
  if (isUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="">
            <div className="text-center text-gray-600">
              <div className="text-4xl ">📊</div>
              <h3 className="text-lg font-medium mb-2">
                Statistics Coming Soon
              </h3>
              <p className="text-sm text-gray-500">
                Match statistics will be available once the game starts
              </p>
            </div>

            {/* Team Comparison Preview */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-center">
                Team Comparison Preview
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <img
                    src={homeTeam?.logo || "/assets/fallback-logo.png"}
                    alt={homeTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{homeTeam?.name}</div>
                </div>
                <div className="text-center text-gray-500">VS</div>
                <div className="text-center">
                  <img
                    src={awayTeam?.logo || "/assets/fallback-logo.png"}
                    alt={awayTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{awayTeam?.name}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 ">
            <div className="text-2xl mb-2">⏳</div>
            <p>Loading match statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || !homeStats || !awayStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">❌</div>
            <p>{error || "No statistics available for this match"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For live/finished matches, show real statistics with bars
  return (
    <div className="space-y-2">
      {/* Main Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <MyStats
            homeStats={homeStats}
            awayStats={awayStats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            isExpanded={isExpanded}
            onToggleExpanded={() => {
              // Always ensure Stats tab is active first - this will hide MyMatchTabCard and show MyStatsTabCard
              if (onTabChange) {
                onTabChange("stats");
              }

              // Always expand when "See All" is clicked to show all statistics
              setIsExpanded(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Shots Statistics Card */}
      <Card>
       
        <CardContent className="py-2">
          <MyShots
            homeStats={homeStats}
            awayStats={awayStats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            isExpanded={isExpanded}
            onToggleExpanded={() => {
              // Always ensure Stats tab is active first - this will hide MyMatchTabCard and show MyStatsTabCard
              if (onTabChange) {
                onTabChange("stats");
              }

              // Always expand when "See All" is clicked to show all statistics
              setIsExpanded(true);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyStatsTabCard;
