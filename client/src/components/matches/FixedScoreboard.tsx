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
    if (fixturesQueries.some(query => query.isLoading) || 
        standingsQueries.some(query => query.isLoading)) {
      return [];
    }

    const fixtureResults = fixturesQueries.map(query => query.data || []);
    const standingsResults = standingsQueries.map(query => query.data || []);

    // Combine matches without filtering
    const fixtures = Array.from(
      new Map(
        fixtureResults
          .flat()
          .map(fixture => [fixture.fixture.id, fixture])
      ).values()
    );

    const now = new Date();
    const timeWindow = {
      start: subHours(now, 4),
      end: addHours(now, 4),
    };

    const liveMatches = fixtures.filter(match => 
      match.fixture.status.short === 'LIVE'
    );

    const upcomingMatches = fixtures.filter(match =>
      match.fixture.status.short === 'NS' &&
      isWithinInterval(new Date(match.fixture.date), timeWindow)
    );

    const finishedMatches = fixtures.filter(match =>
      match.fixture.status.short === 'FT' &&
      isWithinInterval(new Date(match.fixture.date), timeWindow)
    );

    return [...liveMatches, ...upcomingMatches, ...finishedMatches].slice(0, 6);
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