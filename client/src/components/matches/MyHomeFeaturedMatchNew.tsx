
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

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

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

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 3
}) => {
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

      console.log(`🚀 [FeaturedMatches] Starting fetch for dates:`, dates);

      const allMatches: DayMatches[] = [];

      for (const dateInfo of dates) {
        try {
          console.log(`🔍 [FeaturedMatches] Fetching for ${dateInfo.label}: ${dateInfo.date}`);
          
          // Try main endpoint first
          let response = await apiRequest('GET', `/api/fixtures/date/${dateInfo.date}?all=true`);
          
          // If main endpoint fails, try fallback
          if (!response.ok) {
            console.warn(`⚠️ [FeaturedMatches] Main API failed for ${dateInfo.label}, trying fallback...`);
            try {
              response = await apiRequest('GET', `/api/fixtures/date/${dateInfo.date}`);
            } catch (fallbackError) {
              console.error(`❌ [FeaturedMatches] Both endpoints failed for ${dateInfo.label}:`, response.status, response.statusText);
              allMatches.push({
                date: dateInfo.date,
                label: dateInfo.label,
                matches: []
              });
              continue;
            }
          }
          
          if (!response.ok) {
            console.error(`❌ [FeaturedMatches] API response not OK for ${dateInfo.label}:`, response.status, response.statusText);
            allMatches.push({
              date: dateInfo.date,
              label: dateInfo.label,
              matches: []
            });
            continue;
          }
          
          const fixtures = await response.json();
          console.log(`📊 [FeaturedMatches] Raw fixtures for ${dateInfo.label}:`, fixtures?.length || 0, 'fixtures');

          if (!fixtures?.length) {
            console.log(`📭 [FeaturedMatches] No fixtures for ${dateInfo.label}`);
            allMatches.push({
              date: dateInfo.date,
              label: dateInfo.label,
              matches: []
            });
            continue;
          }

          // Get all fixtures with valid teams (no league filtering)
          const featuredForDay = fixtures
            .filter((fixture: any) => {
              // Must have valid teams
              const hasValidTeams = fixture.teams?.home?.name && fixture.teams?.away?.name;
              
              if (!hasValidTeams) {
                console.log(`⚠️ [FeaturedMatches] Invalid fixture data:`, {
                  id: fixture.fixture?.id,
                  homeTeam: fixture.teams?.home?.name,
                  awayTeam: fixture.teams?.away?.name,
                  league: fixture.league?.name
                });
              }
              
              return hasValidTeams;
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
            // Sort by match time only
            .sort((a: FeaturedMatch, b: FeaturedMatch) => {
              return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
            })
            .slice(0, maxMatches); // Use maxMatches prop

          console.log(`✅ [FeaturedMatches] Found ${featuredForDay.length} featured matches for ${dateInfo.label}`);
          
          if (featuredForDay.length > 0) {
            console.log(`🎯 [FeaturedMatches] Sample matches for ${dateInfo.label}:`, featuredForDay.slice(0, 2).map(m => ({
              id: m.fixture.id,
              teams: `${m.teams.home.name} vs ${m.teams.away.name}`,
              league: m.league.name,
              date: m.fixture.date
            })));
          }

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

      console.log(`🏁 [FeaturedMatches] Final matches summary:`, allMatches.map(day => ({
        date: day.date,
        label: day.label,
        matchCount: day.matches.length
      })));

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
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
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
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
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
              className="text-xs h-7"
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

      <CardContent className="pt-0">
        {featuredMatches[selectedDay] && (
          <div className="space-y-3">
            {featuredMatches[selectedDay].matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No featured matches</p>
                <p className="text-sm">Check back later for upcoming games</p>
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

                    {/* Status and Countdown */}
                    <div className="flex justify-center items-center mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">
                          {statusInfo.isLive ? 'Live Now' : 
                           match.fixture.date.includes(format(new Date(), 'yyyy-MM-dd')) ? 'Today' :
                           match.fixture.date.includes(format(addDays(new Date(), 1), 'yyyy-MM-dd')) ? 'Tomorrow' : 
                           'Day After Tomorrow'}
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Team Layout with Colored Bars */}
                    <div className="relative mb-4">
                      <div className="flex items-center h-14 rounded-lg overflow-hidden">
                        {/* Home team section */}
                        <div className="flex-1 flex items-center h-full bg-gradient-to-r from-yellow-400 to-yellow-500 relative">
                          <div className="absolute left-2 z-10 w-10 h-10 bg-white/20 rounded-full p-1 flex items-center justify-center">
                            <TeamLogo
                              src={match.teams.home.logo}
                              alt={match.teams.home.name}
                              size="sm"
                              className="w-8 h-8"
                            />
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-white font-bold text-sm uppercase tracking-wide pr-8">
                              {match.teams.home.name.length > 12 ? 
                                match.teams.home.name.substring(0, 12) + '...' : 
                                match.teams.home.name}
                            </div>
                          </div>
                        </div>

                        {/* VS section */}
                        <div className="w-12 h-full bg-gray-800 flex items-center justify-center relative z-20">
                          <span className="text-white font-bold text-xs">VS</span>
                        </div>

                        {/* Away team section */}
                        <div className="flex-1 flex items-center h-full bg-gradient-to-l from-red-500 to-red-600 relative">
                          <div className="flex-1 text-center">
                            <div className="text-white font-bold text-sm uppercase tracking-wide pl-8">
                              {match.teams.away.name.length > 12 ? 
                                match.teams.away.name.substring(0, 12) + '...' : 
                                match.teams.away.name}
                            </div>
                          </div>
                          <div className="absolute right-2 z-10 w-10 h-10 bg-white/20 rounded-full p-1 flex items-center justify-center">
                            <TeamLogo
                              src={match.teams.away.logo}
                              alt={match.teams.away.name}
                              size="sm"
                              className="w-8 h-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="text-center text-xs text-gray-600 mb-3">
                      {format(new Date(match.fixture.date), 'EEEE, do MMMM | HH:mm')}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-around border-t border-gray-200 pt-3">
                      <button 
                        className="flex flex-col items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/match/${match.fixture.id}`);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
                          <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
                        </svg>
                        <span className="text-xs text-gray-600 mt-1">Match Page</span>
                      </button>
                      <button 
                        className="flex flex-col items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to lineups when available
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
                          <path d="M21.5 4H2.5C2.22386 4 2 4.22386 2 4.5V19.5C2 19.7761 2.22386 20 2.5 20H21.5C21.7761 20 22 19.7761 22 19.5V4.5C22 4.22386 21.7761 4 21.5 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path d="M21.5 9H18.5C18.2239 9 18 9.22386 18 9.5V14.5C18 14.7761 18.2239 15 18.5 15H21.5C21.7761 15 22 14.7761 22 14.5V9.5C22 9.22386 21.7761 9 21.5 9Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path d="M5.5 9H2.5C2.22386 9 2 9.22386 2 9.5V14.5C2 14.7761 2.22386 15 2.5 15H5.5C5.77614 15 6 14.7761 6 14.5V9.5C6 9.22386 5.77614 9 5.5 9Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        <span className="text-xs text-gray-600 mt-1">Lineups</span>
                      </button>
                      <button 
                        className="flex flex-col items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to stats when available
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
                          <path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM19.931 11H13V4.069C14.7598 4.29335 16.3953 5.09574 17.6498 6.3502C18.9043 7.60466 19.7066 9.24017 19.931 11ZM4 12C4 7.928 7.061 4.564 11 4.069V12C11.003 12.1526 11.0409 12.3024 11.111 12.438C11.126 12.468 11.133 12.501 11.152 12.531L15.354 19.254C14.3038 19.7442 13.159 19.9988 12 20C7.589 20 4 16.411 4 12ZM17.052 18.196L13.805 13H19.931C19.6746 15.0376 18.6436 16.8982 17.052 18.196Z" fill="currentColor"/>
                        </svg>
                        <span className="text-xs text-gray-600 mt-1">Stats</span>
                      </button>
                      <button 
                        className="flex flex-col items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/league/${match.league.id}/standings`);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
                          <path d="M4 6H6V8H4V6ZM4 11H6V13H4V11ZM4 16H6V18H4V16ZM20 8V6H8.023V8H18.8H20ZM8 11H20V13H8V11ZM8 16H20V18H8V16Z" fill="currentColor"/>
                        </svg>
                        <span className="text-xs text-gray-600 mt-1">Groups</span>
                      </button>
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

export default MyHomeFeaturedMatchNew;
