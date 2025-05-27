
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trophy, Users, MapPin, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';

interface ConferenceLeagueScheduleProps {
  maxMatches?: number;
  showHeader?: boolean;
  compact?: boolean;
}

const ConferenceLeagueSchedule: React.FC<ConferenceLeagueScheduleProps> = ({ 
  maxMatches = 6, 
  showHeader = true,
  compact = false 
}) => {
  const [viewMode, setViewMode] = useState<'upcoming' | 'recent' | 'all'>('upcoming');

  const { data: fixtures, isLoading, error } = useQuery({
    queryKey: ['conference-league-fixtures'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conference-league/fixtures');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
      case '1H':
      case '2H':
      case 'HT':
        return 'bg-red-500 text-white';
      case 'FT':
      case 'AET':
      case 'PEN':
        return 'bg-gray-500 text-white';
      case 'NS':
        return 'bg-blue-500 text-white';
      case 'CANC':
      case 'PST':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status: string, elapsed?: number) => {
    switch (status) {
      case 'LIVE':
        return `${elapsed || 0}'`;
      case '1H':
        return `${elapsed || 0}' 1H`;
      case '2H':
        return `${elapsed || 0}' 2H`;
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'AET':
        return 'AET';
      case 'PEN':
        return 'PEN';
      case 'NS':
        return 'Scheduled';
      case 'CANC':
        return 'Cancelled';
      case 'PST':
        return 'Postponed';
      default:
        return status;
    }
  };

  const filterFixtures = (fixtures: any[]) => {
    if (!fixtures) return [];
    
    const now = new Date();
    const sortedFixtures = [...fixtures].sort((a, b) => 
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    switch (viewMode) {
      case 'upcoming':
        return sortedFixtures
          .filter(fixture => isFuture(new Date(fixture.fixture.date)) || 
                            ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture.status.short))
          .slice(0, maxMatches);
      case 'recent':
        return sortedFixtures
          .filter(fixture => isPast(new Date(fixture.fixture.date)))
          .reverse()
          .slice(0, maxMatches);
      case 'all':
        return sortedFixtures.slice(0, maxMatches);
      default:
        return sortedFixtures.slice(0, maxMatches);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        {showHeader && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !fixtures) {
    return (
      <Card className="w-full">
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              UEFA Conference League
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No Conference League fixtures available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredFixtures = filterFixtures(fixtures);

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-green-600" />
              UEFA Conference League
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'upcoming' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('upcoming')}
                className="text-xs"
              >
                Upcoming
              </Button>
              <Button
                variant={viewMode === 'recent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('recent')}
                className="text-xs"
              >
                Recent
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-3 space-y-2" : "space-y-3"}>
        {filteredFixtures.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CalendarDays className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {viewMode} matches</p>
          </div>
        ) : (
          filteredFixtures.map((fixture) => (
            <div
              key={fixture.fixture.id}
              className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                compact ? 'p-2' : 'p-3'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={fixture.teams.home.logo}
                      alt={fixture.teams.home.name}
                      className={`object-contain ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                      }}
                    />
                    <span className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                      {fixture.teams.home.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fixture.fixture.status.short === 'NS' ? (
                      <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                        vs
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className={`font-bold ${compact ? 'text-sm' : ''}`}>
                          {fixture.goals.home}
                        </span>
                        <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
                          -
                        </span>
                        <span className={`font-bold ${compact ? 'text-sm' : ''}`}>
                          {fixture.goals.away}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={fixture.teams.away.logo}
                      alt={fixture.teams.away.name}
                      className={`object-contain ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                      }}
                    />
                    <span className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                      {fixture.teams.away.name}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Badge 
                  className={`${getStatusColor(fixture.fixture.status.short)} ${compact ? 'text-xs px-1' : 'text-xs'}`}
                >
                  {getStatusText(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                </Badge>
                
                {fixture.fixture.status.short === 'NS' && (
                  <div className={`text-right ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(fixture.fixture.date), 'HH:mm')}
                    </div>
                    <div className={compact ? 'text-xs' : 'text-xs'}>
                      {format(parseISO(fixture.fixture.date), 'MMM d')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ConferenceLeagueSchedule;
