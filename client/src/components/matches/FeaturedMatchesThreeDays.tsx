
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Clock, Star } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import TeamLogo from './TeamLogo';
import LazyImage from '../common/LazyImage';

// Popular leagues from PopularLeaguesList.tsx
const POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 2, name: 'UEFA Champions League', country: 'Europe' },
  { id: 3, name: 'UEFA Europa League', country: 'Europe' },
  { id: 848, name: 'UEFA Conference League', country: 'Europe' },
  { id: 5, name: 'UEFA Nations League', country: 'Europe' },
  { id: 1, name: 'World Cup', country: 'World' },
  { id: 4, name: 'Euro Championship', country: 'World' },
  { id: 15, name: 'FIFA Club World Cup', country: 'World' },
  { id: 38, name: 'UEFA U21 Championship', country: 'World' },
  { id: 9, name: 'Copa America', country: 'World' },
  { id: 22, name: 'CONCACAF Gold Cup', country: 'World' },
  { id: 6, name: 'Africa Cup of Nations', country: 'World' },
  { id: 7, name: 'Asian Cup', country: 'World' },
];

interface FeaturedMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface DayMatches {
  date: string;
  label: string;
  matches: FeaturedMatch[];
}

const FeaturedMatchesThreeDays: React.FC = () => {
  const [, navigate] = useLocation();
  const [featuredMatches, setFeaturedMatches] = useState<DayMatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchFeaturedMatches();
  }, []);

  const fetchFeaturedMatches = async () => {
    try {
      setIsLoading(true);
      
      // Get dates for today, tomorrow, and day after tomorrow
      const today = new Date();
      const dates = [
        { date: format(today, 'yyyy-MM-dd'), label: 'Today' },
        { date: format(addDays(today, 1), 'yyyy-MM-dd'), label: 'Tomorrow' },
        { date: format(addDays(today, 2), 'yyyy-MM-dd'), label: 'Day After Tomorrow' }
      ];

      const allMatches: DayMatches[] = [];

      for (const dateInfo of dates) {
        try {
          console.log(`🔍 [FeaturedMatches] Fetching for ${dateInfo.label}: ${dateInfo.date}`);
          
          // Fetch fixtures for the date
          const response = await apiRequest('GET', `/api/fixtures/date/${dateInfo.date}?all=true`);
          const fixtures = await response.json();

          if (!fixtures?.length) {
            console.log(`📭 [FeaturedMatches] No fixtures for ${dateInfo.label}`);
            allMatches.push({
              date: dateInfo.date,
              label: dateInfo.label,
              matches: []
            });
            continue;
          }

          // Filter for popular leagues and get featured matches
          const featuredForDay = fixtures
            .filter((fixture: any) => {
              // Must be from popular leagues
              const isPopularLeague = POPULAR_LEAGUES.some(league => league.id === fixture.league.id);
              
              // Must have valid teams
              const hasValidTeams = fixture.teams?.home?.name && fixture.teams?.away?.name;
              
              return isPopularLeague && hasValidTeams;
            })
            .map((fixture: any) => ({
              fixture: {
                id: fixture.fixture.id,
                date: fixture.fixture.date,
                status: fixture.fixture.status
              },
              league: {
                id: fixture.league.id,
                name: fixture.league.name,
                country: fixture.league.country,
                logo: fixture.league.logo
              },
              teams: {
                home: {
                  id: fixture.teams.home.id,
                  name: fixture.teams.home.name,
                  logo: fixture.teams.home.logo
                },
                away: {
                  id: fixture.teams.away.id,
                  name: fixture.teams.away.name,
                  logo: fixture.teams.away.logo
                }
              },
              goals: {
                home: fixture.goals?.home ?? null,
                away: fixture.goals?.away ?? null
              }
            }))
            // Sort by league priority and time
            .sort((a: FeaturedMatch, b: FeaturedMatch) => {
              // Priority order: Champions League, Premier League, La Liga, etc.
              const leaguePriority = [2, 39, 140, 135, 78, 61, 3, 848, 15, 38];
              const aPriority = leaguePriority.indexOf(a.league.id);
              const bPriority = leaguePriority.indexOf(b.league.id);
              
              if (aPriority !== -1 && bPriority !== -1) {
                return aPriority - bPriority;
              }
              if (aPriority !== -1) return -1;
              if (bPriority !== -1) return 1;
              
              // Sort by time if same priority
              return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
            })
            .slice(0, 6); // Take top 6 matches per day

          console.log(`✅ [FeaturedMatches] Found ${featuredForDay.length} featured matches for ${dateInfo.label}`);

          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: featuredForDay
          });

        } catch (error) {
          console.error(`❌ [FeaturedMatches] Error fetching for ${dateInfo.label}:`, error);
          allMatches.push({
            date: dateInfo.date,
            label: dateInfo.label,
            matches: []
          });
        }
      }

      setFeaturedMatches(allMatches);
    } catch (error) {
      console.error('❌ [FeaturedMatches] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMatchTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getStatusDisplay = (match: FeaturedMatch) => {
    const status = match.fixture.status.short;
    
    if (status === 'NS') {
      return {
        text: formatMatchTime(match.fixture.date),
        color: 'bg-blue-500',
        isLive: false
      };
    }
    
    if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status)) {
      return {
        text: status === 'HT' ? 'HT' : `${match.fixture.status.elapsed || 0}'`,
        color: 'bg-red-500 animate-pulse',
        isLive: true
      };
    }
    
    if (status === 'FT') {
      return {
        text: 'FT',
        color: 'bg-gray-500',
        isLive: false
      };
    }
    
    return {
      text: status,
      color: 'bg-gray-400',
      isLive: false
    };
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Featured Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Featured Matches
        </CardTitle>
        
        {/* Day selector tabs */}
        <div className="flex gap-1 mt-2">
          {featuredMatches.map((dayData, index) => (
            <Button
              key={dayData.date}
              variant={selectedDay === index ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(index)}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {dayData.label}
              {dayData.matches.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {dayData.matches.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {featuredMatches[selectedDay] && (
          <div className="space-y-3">
            {featuredMatches[selectedDay].matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No featured matches for {featuredMatches[selectedDay].label.toLowerCase()}</p>
              </div>
            ) : (
              featuredMatches[selectedDay].matches.map((match) => {
                const statusInfo = getStatusDisplay(match);
                
                return (
                  <div
                    key={match.fixture.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/match/${match.fixture.id}`)}
                  >
                    {/* League info */}
                    <div className="flex items-center gap-2 mb-2">
                      <LazyImage
                        src={match.league.logo}
                        alt={match.league.name}
                        className="w-4 h-4"
                        fallbackSrc="/assets/fallback-logo.svg"
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        {match.league.name}
                      </span>
                      {statusInfo.isLive && (
                        <Star className="h-3 w-3 text-red-500 fill-current" />
                      )}
                    </div>

                    {/* Match info */}
                    <div className="flex items-center justify-between">
                      {/* Teams */}
                      <div className="flex items-center gap-3 flex-1">
                        {/* Home team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TeamLogo
                            src={match.teams.home.logo}
                            alt={match.teams.home.name}
                            size="sm"
                          />
                          <span className="text-sm font-medium truncate">
                            {match.teams.home.name}
                          </span>
                        </div>

                        {/* Score/Status */}
                        <div className="flex flex-col items-center px-3">
                          {match.goals.home !== null && match.goals.away !== null ? (
                            <div className="text-lg font-bold">
                              {match.goals.home} - {match.goals.away}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">vs</div>
                          )}
                          <Badge className={`text-xs px-2 py-0 ${statusInfo.color} text-white`}>
                            {statusInfo.text}
                          </Badge>
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-medium truncate">
                            {match.teams.away.name}
                          </span>
                          <TeamLogo
                            src={match.teams.away.logo}
                            alt={match.teams.away.name}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedMatchesThreeDays;
