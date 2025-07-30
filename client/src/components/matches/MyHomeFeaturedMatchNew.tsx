
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Trophy, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import LazyImage from '@/components/common/LazyImage';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import { RoundBadge } from '@/components/ui/round-badge';

// Explicitly excluded leagues
const EXPLICITLY_EXCLUDED_LEAGUE_IDS = [848, 169, 940, 85, 80, 84, 87, 41, 86]; // UEFA Europa Conference League, Regionalliga - Bayern, League 940, Regionalliga - Nordost, 3. Liga, Regionalliga - Nord, Regionalliga - West, League One England, Regionalliga - SudWest

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 8
}) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const dateToFetch = selectedDate || new Date().toISOString().split('T')[0];
        console.log(`🔴 [MyHomeFeaturedMatchNew] Fetching featured matches for date: ${dateToFetch}`);

        const response = await apiRequest('GET', `/api/fixtures/date/${dateToFetch}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        console.log(`📊 [MyHomeFeaturedMatchNew] Received ${data.length} total fixtures`);

        // Filter and prioritize matches
        const filteredFixtures = data
          .filter((fixture: Fixture) => {
            // Exclude explicitly excluded leagues
            if (EXPLICITLY_EXCLUDED_LEAGUE_IDS.includes(fixture.league.id)) {
              return false;
            }

            // Only include matches from major leagues and competitions
            const majorLeagueIds = [39, 140, 135, 78, 61, 2, 3, 4, 5, 37, 9, 15, 45, 143, 137, 81];
            return majorLeagueIds.includes(fixture.league.id);
          })
          .sort((a: Fixture, b: Fixture) => {
            // Prioritize live matches first
            const aIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(a.fixture.status.short);
            const bIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(b.fixture.status.short);

            if (aIsLive && !bIsLive) return -1;
            if (!aIsLive && bIsLive) return 1;

            // Then prioritize by league importance
            const leaguePriority = [39, 140, 135, 78, 61, 2, 3, 4]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Euro
            const aPriority = leaguePriority.indexOf(a.league.id);
            const bPriority = leaguePriority.indexOf(b.league.id);

            if (aPriority !== -1 && bPriority !== -1) {
              return aPriority - bPriority;
            }
            if (aPriority !== -1) return -1;
            if (bPriority !== -1) return 1;

            // Finally sort by date
            return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
          })
          .slice(0, maxMatches);

        console.log(`✅ [MyHomeFeaturedMatchNew] Filtered to ${filteredFixtures.length} featured matches`);
        setFixtures(filteredFixtures);

      } catch (error) {
        console.error('❌ [MyHomeFeaturedMatchNew] Error fetching featured matches:', error);
        setError('Failed to load featured matches');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedMatches();
  }, [selectedDate, maxMatches]);

  const formatMatchTime = (dateString: string, status: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid Date';

      if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
        return 'LIVE';
      }

      if (['FT', 'AET', 'PEN'].includes(status)) {
        return 'Ended';
      }

      return format(date, 'HH:mm');
    } catch {
      return 'TBD';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'destructive';
    }
    if (['FT', 'AET', 'PEN'].includes(status)) {
      return 'secondary';
    }
    return 'outline';
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm">Featured Matches</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || fixtures.length === 0) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm">Featured Matches</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              {error || 'No featured matches available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">Featured Matches</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fixtures.map((fixture) => (
          <div
            key={fixture.fixture.id}
            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* League and time info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LazyImage
                  src={fixture.league.logo}
                  alt={fixture.league.name}
                  className="w-4 h-4 object-contain"
                />
                <span className="text-xs text-gray-600 truncate">
                  {fixture.league.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RoundBadge
                  leagueId={fixture.league.id}
                  currentRound={fixture.league.round}
                  matchStatus={fixture.fixture.status.short}
                  className="text-xs"
                />
                <Badge
                  variant={getStatusBadgeVariant(fixture.fixture.status.short)}
                  className="text-xs"
                >
                  {formatMatchTime(fixture.fixture.date, fixture.fixture.status.short)}
                </Badge>
              </div>
            </div>

            {/* Teams and score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <MyWorldTeamLogo
                  teamId={fixture.teams.home.id}
                  teamName={fixture.teams.home.name}
                  logoUrl={fixture.teams.home.logo}
                  size={24}
                />
                <span className="text-sm font-medium truncate">
                  {fixture.teams.home.name}
                </span>
              </div>

              <div className="flex items-center gap-2 mx-4">
                <span className="text-lg font-bold">
                  {fixture.goals.home ?? 0}
                </span>
                <span className="text-gray-400">-</span>
                <span className="text-lg font-bold">
                  {fixture.goals.away ?? 0}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-medium truncate">
                  {fixture.teams.away.name}
                </span>
                <MyWorldTeamLogo
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                  logoUrl={fixture.teams.away.logo}
                  size={24}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyHomeFeaturedMatchNew;
