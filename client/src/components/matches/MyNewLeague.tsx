
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LazyImage from '../common/LazyImage';
import { isNationalTeam } from '@/lib/teamLogoSources';
import MyCircularFlag from '../common/MyCircularFlag';

interface MyNewLeagueProps {
  selectedDate: string;
  timeFilterActive: boolean;
  showTop20: boolean;
  liveFilterActive: boolean;
  onMatchCardClick: (fixture: any) => void;
}

const MyNewLeague: React.FC<MyNewLeagueProps> = ({
  selectedDate,
  timeFilterActive,
  showTop20,
  liveFilterActive,
  onMatchCardClick,
}) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fixtures for the selected date
  const { data: fixturesData, isLoading } = useQuery({
    queryKey: ['fixtures', selectedDate],
    queryFn: async () => {
      const response = await apiRequest(`/api/fixtures/date/${selectedDate}`);
      return response.data;
    },
    enabled: !!selectedDate,
  });

  useEffect(() => {
    if (fixturesData) {
      console.log('📊 [MyNewLeague] Received fixtures:', fixturesData.length);
      
      // Filter specific leagues
      const targetLeagues = [
        { id: 71, name: 'Friendlies Clubs' },
        { id: 22, name: 'Iraqi League' },
        { id: 72, name: 'Copa Argentina' },
      ];

      let filteredFixtures = fixturesData.filter((fixture: any) => {
        return targetLeagues.some(league => 
          fixture.league?.id === league.id || 
          fixture.league?.name?.includes(league.name)
        );
      });

      // Apply date filtering
      filteredFixtures = filteredFixtures.filter((fixture: any) => {
        const fixtureDate = fixture.fixture?.date || fixture.date;
        if (!fixtureDate) return false;
        
        const matchDateString = fixtureDate.split('T')[0];
        return matchDateString === selectedDate;
      });

      console.log('📊 [MyNewLeague] Final result:', filteredFixtures.length, 'fixtures');
      setFixtures(filteredFixtures);
      setLoading(false);
    }
  }, [fixturesData, selectedDate]);

  if (loading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return null;
  }

  // Group fixtures by league
  const groupedFixtures = fixtures.reduce((acc: any, fixture: any) => {
    const leagueKey = fixture.league?.name || 'Other';
    if (!acc[leagueKey]) {
      acc[leagueKey] = [];
    }
    acc[leagueKey].push(fixture);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedFixtures).map(([leagueName, leagueFixtures]: [string, any]) => (
        <Card key={leagueName} className="mb-4">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {leagueName}
                </Badge>
                <span className="text-sm text-gray-600">
                  {leagueFixtures.length} matches
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {leagueFixtures.map((fixture: any) => (
              <div
                key={fixture.fixture?.id || fixture.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => onMatchCardClick(fixture)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {/* Home Team */}
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 h-6 flex-shrink-0">
                      {isNationalTeam(fixture.teams?.home?.name) ? (
                        <MyCircularFlag
                          countryName={fixture.teams?.home?.name}
                          size={24}
                        />
                      ) : (
                        <LazyImage
                          src={fixture.teams?.home?.logo}
                          alt={fixture.teams?.home?.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {fixture.teams?.home?.name}
                    </span>
                  </div>

                  {/* Score/Time */}
                  <div className="flex items-center space-x-2">
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fixture.fixture?.status?.short || fixture.status}
                      </div>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center space-x-2 flex-1 justify-end">
                    <span className="text-sm font-medium truncate">
                      {fixture.teams?.away?.name}
                    </span>
                    <div className="w-6 h-6 flex-shrink-0">
                      {isNationalTeam(fixture.teams?.away?.name) ? (
                        <MyCircularFlag
                          countryName={fixture.teams?.away?.name}
                          size={24}
                        />
                      ) : (
                        <LazyImage
                          src={fixture.teams?.away?.logo}
                          alt={fixture.teams?.away?.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Time */}
                <div className="text-xs text-gray-500 ml-4">
                  {format(parseISO(fixture.fixture?.date || fixture.date), 'HH:mm')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyNewLeague;
