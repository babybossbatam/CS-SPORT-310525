import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import TodayMatchPageCard from "@/components/matches/TodayMatchPageCard";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";
import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew";
import HomeTopScorersList from "@/components/leagues/HomeTopScorersList";
import LeagueStandingsFilter from "@/components/leagues/LeagueStandingsFilter";
import PopularLeaguesList from "@/components/leagues/PopularLeaguesList";
import PopularTeamsList from "@/components/teams/PopularTeamsList";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMatchdetailsScoreboard from "../matches/MyMatchdetailsScoreboard";
import MatchDetailCard from "@/components/matches/MatchDetailCard";
import MyHighlights from "@/components/matches/MyHighlights";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyLMT from "@/components/matches/MyLMT";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";

interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ fixtures, loading = false }) => {
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  // Apply smart time filtering to fixtures
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🔍 [MyMainLayout] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    // Determine what type of date is selected
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    const filtered = fixtures.filter((fixture) => {
      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z", // Pass selected date as context
        );

        // Check if this match should be included based on the selected date
        const shouldInclude = (() => {
          // For today's view, exclude any matches that are from previous days
          if (selectedDate === todayString) {
            if (smartResult.label === "today") return true;

            // Additional check: exclude matches from previous dates regardless of status
            const fixtureDate = new Date(fixture.fixture.date);
            const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");

            if (fixtureDateString < selectedDate) {
              console.log(
                `❌ [MyMainLayout DATE FILTER] Excluding yesterday match: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} (${fixtureDateString} < ${selectedDate})`,
              );
              return false;
            }

            return false;
          }

          if (
            selectedDate === tomorrowString &&
            smartResult.label === "tomorrow"
          )
            return true;
          if (
            selectedDate === yesterdayString &&
            smartResult.label === "yesterday"
          )
            return true;

          // Handle custom dates
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange)
              return true;
          }

          return false;
        })();

        if (!shouldInclude) {
          console.log(
            `❌ [MyMainLayout SMART FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureDate: fixture.fixture.date,
              status: fixture.fixture.status.short,
              reason: smartResult.reason,
              label: smartResult.label,
              selectedDate,
              isWithinTimeRange: smartResult.isWithinTimeRange,
            },
          );
          return false;
        }

        return true;
      }

      return false;
    });

    console.log(
      `✅ [MyMainLayout] After smart filtering: ${filtered.length} matches for ${selectedDate}`,
    );
    return filtered;
  }, [fixtures, selectedDate]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <div
      className="bg-[#FDFBF7] rounded-lg py-4"
      style={{ marginLeft: "150px", marginRight: "150px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* New TodayMatchPageCard for testing */}
          <div>
            <TodayMatchPageCard
              fixtures={filteredFixtures}
              onMatchClick={handleMatchClick}
              onMatchCardClick={handleMatchCardClick}
              loading={loading}
            />
          </div>
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedFixture ? (
            <>
              <ScoreDetailsCard
                currentFixture={selectedFixture}
                onClose={handleBackToMain}
              />

              {/* Conditional rendering based on match status */}
              {(() => {
                const matchStatus = selectedFixture?.fixture?.status?.short;
                const isLive = ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(matchStatus);
                const isEnded = ["FT", "AET", "PEN"].includes(matchStatus);
                const isUpcoming = matchStatus === "NS";

                return (
                  <>
                    {/* Show MyLiveAction only for live matches */}
                    {isLive && (
                      <>
                        <MyLiveAction
                          matchId={selectedFixture?.fixture?.id}
                          homeTeam={selectedFixture?.teams?.home}
                          awayTeam={selectedFixture?.teams?.away}
                          status={selectedFixture?.fixture?.status?.short}
                        />
                        
                        {/* MyLMT - Live Match Tracker Widget */}
                        <MyLMT
                          matchId={selectedFixture?.fixture?.id}
                          homeTeam={selectedFixture?.teams?.home}
                          awayTeam={selectedFixture?.teams?.away}
                          status={selectedFixture?.fixture?.status?.short}
                          sportradarMatchId={selectedFixture?.fixture?.id}
                        />
                      </>
                    )}

                    {/* Show MyHighlights only for ended matches */}
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
            </>
          ) : (
            <MyRightContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMainLayout;