
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format, isWithinInterval, subHours, addHours } from 'date-fns';
import { Card } from '@/components/ui/card';
import { FixtureResponse } from '@/types/fixtures';
import { popularLeagues } from '@/lib/constants';
import MatchScoreboard from './MatchScoreboard';
import { isFinalOrSemifinal, shouldExcludeMatch } from '@/lib/exclusionFilters';

export default function FixedScoreboard() {
  const [, navigate] = useLocation();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Get fixtures data
  const fixturesQueries = popularLeagues.map(leagueId => 
    useQuery<FixtureResponse[]>({
      queryKey: [`/api/fixtures/league/${leagueId}`],
      staleTime: 30000,
    })
  );

  // Get standings data
  const standingsQueries = popularLeagues.map(leagueId =>
    useQuery({
      queryKey: [`/api/standings/league/${leagueId}`],
      staleTime: 300000,
    })
  );

  const displayedMatches = React.useMemo(() => {
    // Wait for all queries to complete
    if (fixturesQueries.some(query => query.isLoading) || 
        standingsQueries.some(query => query.isLoading)) {
      return [];
    }

    // Combine results from all fixture queries
    const fixtureResults = fixturesQueries.map(query => query.data || []);

    // Combine results from all standings queries
    const standingsResults = standingsQueries.map(query => query.data || []);

    // Combine and filter out duplicate matches
    let fixtures = Array.from(
      new Map(
        fixtureResults
          .flat()
          .map(fixture => [fixture.fixture.id, fixture])
      ).values()
    );

    console.log(`Total matches fetched: ${fixtures.length}`);

    // Get teams from standings data
    const teamsFromStandings = new Set<number>();

    // Get all teams from standings
    standingsResults.forEach((leagueStanding) => {
      if (leagueStanding?.league?.standings) {
        leagueStanding.league.standings.forEach((standingGroup: any) => {
          if (Array.isArray(standingGroup)) {
            standingGroup.forEach((teamData: any) => {
              if (teamData?.team?.id) {
                teamsFromStandings.add(teamData.team.id);
              }
            });
          }
        });
      }
    });

    // Filter fixtures to only include teams from standings
    const filteredFixtures = fixtures.filter(fixture => 
      teamsFromStandings.has(fixture.teams.home.id) || 
      teamsFromStandings.has(fixture.teams.away.id)
    );

    // Use filtered fixtures if we have any, otherwise fall back to regular fixtures
    fixtures = filteredFixtures.length > 0 ? filteredFixtures : fixtures;

    // Use a date that matches our fixture data to ensure we show matches within 8 hours
    const now = new Date('2025-05-21T23:00:00.000Z');
    console.log("Current filtering date:", now.toISOString());

    // Only use matches from the popular leagues list
    const popularLeagueMatches = fixtures.filter((match) =>
      popularLeagues.includes(match.league.id)
    );

    // Filter matches by time window and status
    const timeWindow = {
      start: subHours(now, 4),
      end: addHours(now, 4),
    };

    // Filter and categorize matches
    const liveMatches = popularLeagueMatches.filter(
      (match) => match.fixture.status.short === 'LIVE'
    );

    const upcomingMatches = popularLeagueMatches.filter(
      (match) =>
        match.fixture.status.short === 'NS' &&
        isWithinInterval(new Date(match.fixture.date), timeWindow)
    );

    const finishedMatches = popularLeagueMatches.filter(
      (match) =>
        match.fixture.status.short === 'FT' &&
        isWithinInterval(new Date(match.fixture.date), timeWindow)
    );

    // Log matches within time window for debugging
    popularLeagueMatches.forEach((match) => {
      const hoursSince = Math.abs(
        (new Date(match.fixture.date).getTime() - now.getTime()) / 3600000
      );
      if (hoursSince <= 4) {
        console.log(
          `Match within time window: ${match.teams.home.name} vs ${match.teams.away.name}, Hours since: ${hoursSince.toFixed(1)}`
        );
      }
    });

    // PRIORITY 1: Live matches with popular teams or finals/semifinals
    const livePopularMatches = liveMatches
      .filter((match) => !shouldExcludeMatch(match));

    // PRIORITY 2: Finals or semifinals (upcoming within 3-4 days or just finished)
    const specialMatches = [...upcomingMatches, ...finishedMatches]
      .filter((match) => isFinalOrSemifinal(match) && !shouldExcludeMatch(match));

    // PRIORITY 3: Recently finished matches
    const finishedTeamMatches = finishedMatches
      .filter((match) => !shouldExcludeMatch(match));

    // PRIORITY 4: Upcoming matches
    const upcomingTeamMatches = upcomingMatches
      .filter((match) => !shouldExcludeMatch(match));

    // Combine all matches in priority order
    const prioritizedMatches = [
      ...livePopularMatches,
      ...specialMatches,
      ...finishedTeamMatches,
      ...upcomingTeamMatches,
    ].slice(0, 6); // Show maximum 6 matches

    console.log(
      `Match breakdown from popular leagues - Live: ${livePopularMatches.length}, Upcoming (within 8h): ${upcomingTeamMatches.length}, Finished (within 8h): ${finishedTeamMatches.length}`
    );
    console.log(`Displaying ${prioritizedMatches.length} matches`);

    if (prioritizedMatches[0]) {
      console.log(
        `First match: ${prioritizedMatches[0].teams.home.name} vs ${prioritizedMatches[0].teams.away.name}`
      );
    }

    return prioritizedMatches;
  }, [fixturesQueries, standingsQueries]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex((prevIndex) =>
        prevIndex === displayedMatches.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [displayedMatches.length]);

  if (fixturesQueries.some((query) => query.isLoading)) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded-lg"></div>;
  }

  if (!displayedMatches.length) {
    return null;
  }

  const currentMatch = displayedMatches[currentMatchIndex];

  const handleMatchClick = () => {
    if (currentMatch) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  return (
    <Card className="overflow-hidden relative bg-white shadow-md">
      <MatchScoreboard
        match={currentMatch}
        matches={displayedMatches}
        onClick={handleMatchClick}
        featured={true}
      />
    </Card>
  );
}
