import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import LazyImage from '../common/LazyImage';
import { isNationalTeam } from '@/lib/teamLogoSources';

// Your specific league IDs from the attached file
const YOUR_LEAGUE_IDS = [
  3021, // AFC Challenge Cup (ID: 3021)
  3, // AFC Challenge League (ID: 3)
  1132, // AFC Champions League (ID: 1132)
  2, // AFC Champions League (ID: 2)
  39, // Premier League (ID: 39)
  140, // La Liga (ID: 140)
  135, // Serie A (ID: 135)
  78, // Bundesliga (ID: 78)
  61, // Ligue 1 (ID: 61)
  45, // FA Cup (ID: 45)
  48, // EFL Cup (ID: 48)
  143, // Copa del Rey (ID: 143)
  137, // Coppa Italia (ID: 137)
  81, // DFB Pokal (ID: 81)
  66, // Coupe de France (ID: 66)
  848, // UEFA Conference League (ID: 848)
  4, // Euro Championship (ID: 4)
  1135, // AFC Champions League (ID: 1135)
  301, // UAE Pro League (ID: 301)
  266, // Qatar Stars League (ID: 266)
  233, // Egyptian Premier League (ID: 233)
  15, // FIFA Club World Cup (ID: 15)
  1186, // FIFA Club World Cup - Play-In (ID: 1186)
  1168, // FIFA Intercontinental Cup (ID: 1168)
  32, // World Cup - Qualification Europe (ID: 32)
  33, // World Cup - Qualification Oceania (ID: 33)
  34, // World Cup - Qualification South America (ID: 34)
  35, // Asian Cup - Qualification (ID: 35)
  36, // Africa Cup of Nations - Qualification (ID: 36)
  37, // World Cup - Qualification Intercontinental Play-offs (ID: 37)
  38, // UEFA U21 Championship (ID: 38)
  914, // Tournoi Maurice Revello (ID: 914)
  5, // UEFA Nations League (ID: 5)
  6, // Africa Cup of Nations (ID: 6)
  7, // Asian Cup (ID: 7)
  8, // [League ID 8]
  9, // Copa America (ID: 9)
  10, // Friendlies (ID: 10)
  11, // CONMEBOL Sudamericana (ID: 11)
  12, // CAF Champions League (ID: 12)
  13, // CONMEBOL Libertadores (ID: 13)
  14, // UEFA Youth League (ID: 14)
  16, // CONCACAF Champions League (ID: 16)
  17, // AFC Champions League (ID: 17)
  18, // AFC Cup (ID: 18)
  19, // African Nations Championship (ID: 19)
  20, // CAF Confederation Cup (ID: 20)
  21, // Confederations Cup (ID: 21)
  22, // CONCACAF Gold Cup (ID: 22)
  23, // EAFF E-1 Football Championship (ID: 23)
  24, // AFF Championship (ID: 24)
  25, // Gulf Cup of Nations (ID: 25)
  26, // International Champions Cup (ID: 26)
  27, // OFC Champions League (ID: 27)
  28, // SAFF Championship (ID: 28)
  1, // World Cup (ID: 1)
];

interface AllMatchesComparisonProps {
  selectedDate: string;
}

const AllMatchesComparison: React.FC<AllMatchesComparisonProps> = ({ selectedDate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().slice(0, 10);

  // Fetch today's matches
  const { data: todayFixtures = [], isLoading: todayLoading } = useQuery({
    queryKey: ['all-matches-today', today],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${today}?all=true`);
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tomorrow's matches
  const { data: tomorrowFixtures = [], isLoading: tomorrowLoading } = useQuery({
    queryKey: ['all-matches-tomorrow', tomorrowString],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowString}?all=true`);
      return await response.json();
    },
  });

  // Filter matches to only include leagues from your specific list
  const filteredTodayMatches = useMemo(() => {
    return todayFixtures.filter(match => YOUR_LEAGUE_IDS.includes(match.league.id));
  }, [todayFixtures]);

  const filteredTomorrowMatches = useMemo(() => {
    return tomorrowFixtures.filter(match => YOUR_LEAGUE_IDS.includes(match.league.id));
  }, [tomorrowFixtures]);

  // Group matches by league
  const groupByLeague = (matches: any[]) => {
    return matches.reduce((acc, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: match.league,
          matches: []
        };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {} as any);
  };

  const todayByLeague = groupByLeague(filteredTodayMatches);
  const tomorrowByLeague = groupByLeague(filteredTomorrowMatches);

  const renderMatch = (match: any) => {
    const status = match.fixture.status.short;
    const fixtureDate = parseISO(match.fixture.date);

    return (
      <div key={match.fixture.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
        {/* Home Team */}
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-6 h-6">
            {isNationalTeam(match.teams.home, match.league) ? (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <LazyImage
                  src={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                  alt={match.teams.home.name}
                  className="w-full h-full object-cover"
                  fallbackSrc="/assets/fallback-logo.svg"
                />
              </div>
            ) : (
              <LazyImage
                src={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                alt={match.teams.home.name}
                className="w-6 h-6"
                fallbackSrc="/assets/fallback-logo.svg"
              />
            )}
          </div>
          <span className="text-sm font-medium truncate">{match.teams.home.name}</span>
        </div>

        {/* Score/Time */}
        <div className="flex-shrink-0 mx-4 text-center min-w-[80px]">
          {['FT', 'AET', 'PEN'].includes(status) ? (
            <div className="text-sm font-bold">
              {match.goals.home} - {match.goals.away}
            </div>
          ) : ['1H', '2H', 'HT', 'LIVE'].includes(status) ? (
            <div className="text-sm font-bold text-green-600">
              {match.goals.home} - {match.goals.away}
              <div className="text-xs">{status}</div>
            </div>
          ) : (
            <div className="text-sm">
              {format(fixtureDate, 'HH:mm')}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <span className="text-sm font-medium truncate">{match.teams.away.name}</span>
          <div className="w-6 h-6">
            {isNationalTeam(match.teams.away, match.league) ? (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <LazyImage
                  src={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                  alt={match.teams.away.name}
                  className="w-full h-full object-cover"
                  fallbackSrc="/assets/fallback-logo.svg"
                />
              </div>
            ) : (
              <LazyImage
                src={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                alt={match.teams.away.name}
                className="w-6 h-6"
                fallbackSrc="/assets/fallback-logo.svg"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (todayLoading || tomorrowLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading all matches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your League Matches - Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredTodayMatches.length}</p>
              <p className="text-sm text-gray-600">Today's Matches</p>
              <p className="text-xs text-gray-400">From {Object.keys(todayByLeague).length} leagues</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{filteredTomorrowMatches.length}</p>
              <p className="text-sm text-gray-600">Tomorrow's Matches</p>
              <p className="text-xs text-gray-400">From {Object.keys(tomorrowByLeague).length} leagues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Matches from Your Leagues ({today})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(todayByLeague).length === 0 ? (
            <p className="p-6 text-center text-gray-500">No matches today from your specific leagues</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.values(todayByLeague).map((group: any) => (
                <div key={group.league.id} className="border-b border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-sm">
                      {group.league.name} ({group.league.country}) - {group.matches.length} matches
                    </h3>
                  </div>
                  {group.matches.map(renderMatch)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tomorrow's Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's Matches from Your Leagues ({tomorrowString})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(tomorrowByLeague).length === 0 ? (
            <p className="p-6 text-center text-gray-500">No matches tomorrow from your specific leagues</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.values(tomorrowByLeague).map((group: any) => (
                <div key={group.league.id} className="border-b border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-sm">
                      {group.league.name} ({group.league.country}) - {group.matches.length} matches
                    </h3>
                  </div>
                  {group.matches.map(renderMatch)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllMatchesComparison;

const POPULAR_LEAGUES = [
  39, 45, 48, // England: Premier League, FA Cup, EFL Cup
  140, 143, // Spain: La Liga, Copa del Rey
  135, 137, // Italy: Serie A, Coppa Italia
  78, 81, // Germany: Bundesliga, DFB Pokal
  61, 66, // France: Ligue 1, Coupe de France
  301, // UAE Pro League
  233, // Egyptian Premier League
  15, // FIFA Club World Cup
  38, // UEFA U21 Championship (Euro U21)
  914, 848, // COSAFA Cup, UEFA Conference League
  2, 3, // Champions League, Europa League
];

export const isInternationalCompetition = (leagueName: string, country: string) => {
  // Check if it's an international competition
  const isInternationalCompetition =
    leagueName.includes("champions league") ||
    leagueName.includes("europa league") ||
    leagueName.includes("conference league") ||
    leagueName.includes("uefa") ||
    leagueName.includes("world cup") ||
    leagueName.includes("fifa club world cup") ||
    leagueName.includes("fifa") ||
    leagueName.includes("u21") ||
    leagueName.includes("euro u21") ||
    leagueName.includes("uefa u21") ||
    leagueName.includes("conmebol") ||
    leagueName.includes("copa america") ||
    leagueName.includes("copa libertadores") ||
    leagueName.includes("copa sudamericana") ||
    leagueName.includes("libertadores") ||
    leagueName.includes("sudamericana") ||
    (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
    (leagueName.includes("international") && !leagueName.includes("women")) ||
    country.includes("world") ||
    country.includes("europe") ||
    country.includes("international");

  return isInternationalCompetition;
};