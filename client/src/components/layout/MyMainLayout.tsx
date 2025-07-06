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
import MatchPrediction from "@/components/matches/MatchPrediction";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMatchdetailsScoreboard from "../matches/MyMatchdetailsScoreboard";
import MatchDetailCard from "@/components/matches/MatchDetailCard";
import MyHighlights from "@/components/matches/MyHighlights";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyNewLMT from "@/components/matches/MyNewLMT";
import MyLiveTrackerNew from "@/components/matches/MyLiveTrackerNew";
import MyMatchEventNew from "@/components/matches/MyMatchEventNew";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import MyRecentForm from '@/components/matches/MyRecentForm';

import { Card, CardContent } from "@/components/ui/card";

interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  fixtures,
  loading = false,
  children,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
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
          {/* Render children if provided, otherwise show TodayMatchPageCard */}
          {children ? (
            <div>
              {children}
            </div>
          ) : (
            <div>
              <TodayMatchPageCard
                fixtures={filteredFixtures}
                onMatchClick={handleMatchClick}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          )}
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
                const isEnded = ["FT", "AET", "PEN"].includes(matchStatus);
                const isUpcoming = matchStatus === "NS";

                return (
                  <>
                    {/* Show MyLiveAction only for live matches */}
                    {isLive && (
                      <MyLiveAction
                        matchId={selectedFixture?.fixture?.id}
                        homeTeam={selectedFixture?.teams?.home}
                        awayTeam={selectedFixture?.teams?.away}
                        status={selectedFixture?.fixture?.status?.short}
                      />
                    )}

                    {/* Show MyHighlights only for ended matches with proper spacing */}
                    {isEnded && (
                      <div className="mt-6 relative z-10">
                        <MyHighlights
                          homeTeam={selectedFixture?.teams?.home?.name}
                          awayTeam={selectedFixture?.teams?.away?.name}
                          leagueName={selectedFixture?.league?.name}
                          match={selectedFixture}
                        />
                      </div>
                    )}

                    {/* Show MyLiveTrackerNew for live matches */}
                    {isLive && (
                      <MyLiveTrackerNew
                        matchId={selectedFixture?.fixture?.id}
                        homeTeam={selectedFixture?.teams?.home}
                        awayTeam={selectedFixture?.teams?.away}
                        isLive={isLive}
                        className="mt-4"
                      />
                    )}

                    {/* Show MyMatchEventNew for live and ended matches */}
                    {(isLive || isEnded) && (
                      <MyMatchEventNew
                        fixtureId={selectedFixture?.fixture?.id}
                        homeTeam={selectedFixture?.teams?.home?.name}
                        awayTeam={selectedFixture?.teams?.away?.name}
                        refreshInterval={15}
                        showLogos={true}
                        className="mt-4"
                        matchData={selectedFixture}
                      />
                    )}

                    {/* Match Prediction for upcoming matches - moved below MyMatchEventNew */}
                    {/* Match Prediction Component */}
                   
                    {/* Recent Form Section */}
          <MyRecentForm 
            match={currentFixture}
          />
                    {!isLive && !isEnded && (
                      <MatchPrediction
                        homeTeam={{
                          id: selectedFixture?.teams?.home?.id,
                          name:
                            selectedFixture?.teams?.home?.name || "Home Team",
                          logo: selectedFixture?.teams?.home?.logo || "",
                        }}
                        awayTeam={{
                          id: selectedFixture?.teams?.away?.id,
                          name:
                            selectedFixture?.teams?.away?.name || "Away Team",
                          logo: selectedFixture?.teams?.away?.logo || "",
                        }}
                        fixtureId={selectedFixture?.fixture?.id}
                        leagueId={selectedFixture?.league?.id}
                        season={selectedFixture?.league?.season}
                      />
                    )}
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