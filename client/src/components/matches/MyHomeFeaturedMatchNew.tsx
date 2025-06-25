import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import TeamLogo from './TeamLogo';
import LazyImage from '../common/LazyImage';
import MyColoredBar from './MyColoredBar';
import MyWorldTeamLogo from '../common/MyWorldTeamLogo';
import "../../styles/flasheffect.css";

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
  { id: 6, name: 'Africa Cup of Nations', country: 'World' },
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
  maxMatches = 8
}) => {
  const [, navigate] = useLocation();
  const [featuredMatches, setFeaturedMatches] = useState<DayMatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Flash animation states for real-time updates
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());

  // Status and score tracking for flash effects
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  useEffect(() => {
    fetchFeaturedMatches();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchFeaturedMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Flash effect cleanup
  useEffect(() => {
    if (halftimeFlashMatches.size > 0) {
      const timeout = setTimeout(() => setHalftimeFlashMatches(new Set()), 2000);
      return () => clearTimeout(timeout);
    }
  }, [halftimeFlashMatches]);

  useEffect(() => {
    if (fulltimeFlashMatches.size > 0) {
      const timeout = setTimeout(() => setFulltimeFlashMatches(new Set()), 2000);
      return () => clearTimeout(timeout);
    }
  }, [fulltimeFlashMatches]);

  useEffect(() => {
    if (goalFlashMatches.size > 0) {
      const timeout = setTimeout(() => setGoalFlashMatches(new Set()), 2000);
      return () => clearTimeout(timeout);
    }
  }, [goalFlashMatches]);

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

      // Priority leagues: 38 (UEFA U21) first, then 15 (FIFA Club World Cup)
      const priorityLeagueIds = [38, 15];
      const allFixtures: FeaturedMatch[] = [];

      // Fetch fixtures directly from priority leagues like MyNewLeague does
      for (const leagueId of priorityLeagueIds) {
        try {
          console.log(`🔍 [FeaturedMatches] Fetching data for league ${leagueId}`);

          // Fetch fixtures for the league
          const fixturesResponse = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
          const fixturesData = await fixturesResponse.json();
          console.log(`📊 [FeaturedMatches] League ${leagueId} fixtures count:`, fixturesData?.length || 0);

          if (Array.isArray(fixturesData)) {
            const processedFixtures = fixturesData
              .filter((fixture: any) => {
                // Must have valid teams
                const hasValidTeams = fixture.teams?.home?.name && fixture.teams?.away?.name;
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
              }));

            allFixtures.push(...processedFixtures);
          }
        } catch (leagueError) {
          console.warn(`Failed to fetch data for league ${leagueId}:`, leagueError);
        }
      }

      // Also include other popular league matches from date-based fetching
      for (const dateInfo of dates) {
        try {
          console.log(`🔍 [FeaturedMatches] Fetching for ${dateInfo.label}: ${dateInfo.date}`);

          const response = await apiRequest('GET', `/api/fixtures/date/${dateInfo.date}?all=true`);
          const fixtures = await response.json();

          if (fixtures?.length) {
            const otherLeagueFixtures = fixtures
              .filter((fixture: any) => {
                // Must have valid teams
                const hasValidTeams = fixture.teams?.home?.name && fixture.teams?.away?.name;

                // Only show matches from popular leagues (excluding priority leagues we already fetched)
                const isPopularLeague = POPULAR_LEAGUES.some(league => league.id === fixture.league?.id);
                const isPriorityLeague = priorityLeagueIds.includes(fixture.league?.id);

                return hasValidTeams && isPopularLeague && !isPriorityLeague;
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
              }));

            allFixtures.push(...otherLeagueFixtures);
          }
        } catch (error) {
          console.error(`❌ [FeaturedMatches] Error fetching for ${dateInfo.label}:`, error);
        }
      }

      // Remove duplicates based on fixture ID
      const uniqueFixtures = allFixtures.filter((fixture, index, self) => 
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      );

      console.log(`📋 [FeaturedMatches] Total unique fixtures found:`, uniqueFixtures.length);

      // Check for status and score changes for flash effects
      const currentStatuses = new Map<number, string>();
      const currentScores = new Map<number, {home: number, away: number}>();
      const newHalftimeMatches = new Set<number>();
      const newFulltimeMatches = new Set<number>();
      const newGoalMatches = new Set<number>();

      uniqueFixtures.forEach((fixture) => {
        const matchId = fixture.fixture.id;
        const currentStatus = fixture.fixture.status.short;
        const currentScore = {
          home: fixture.goals.home ?? 0,
          away: fixture.goals.away ?? 0
        };

        currentStatuses.set(matchId, currentStatus);
        currentScores.set(matchId, currentScore);

        const previousStatus = previousMatchStatuses.get(matchId);
        const previousScore = previousMatchScores.get(matchId);

        // Check for status changes
        if (previousStatus && previousStatus !== currentStatus) {
          // Check if status just changed to halftime
          if (currentStatus === 'HT' && previousStatus !== 'HT') {
            console.log(`🟡 [HALFTIME FLASH] Match ${matchId} reached halftime!`, {
              home: fixture.teams?.home?.name,
              away: fixture.teams?.away?.name,
              previousStatus,
              currentStatus
            });
            newHalftimeMatches.add(matchId);
          }

          // Check if status just changed to fulltime
          if (currentStatus === 'FT') {
            console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
              home: fixture.teams?.home?.name,
              away: fixture.teams?.away?.name,
              previousStatus,
              currentStatus
            });
            newFulltimeMatches.add(matchId);
          }
        }

        // Check for goal changes (when score changes but status stays the same or during live matches)
        if (previousScore && ['1H', '2H', 'LIVE'].includes(currentStatus)) {
          const scoreChanged = currentScore.home !== previousScore.home || currentScore.away !== previousScore.away;
          if (scoreChanged) {
            console.log(`⚽ [GOAL FLASH] Match ${matchId} score changed!`, {
              home: fixture.teams?.home?.name,
              away: fixture.teams?.away?.name,
              previousScore: `${previousScore.home}-${previousScore.away}`,
              currentScore: `${currentScore.home}-${currentScore.away}`,
              status: currentStatus
            });
            newGoalMatches.add(matchId);
          }
        }
      });

      // Update previous statuses and scores AFTER checking for changes
      setPreviousMatchStatuses(currentStatuses);
      setPreviousMatchScores(currentScores);

      // Trigger flash for new events
      if (newHalftimeMatches.size > 0) {
        setHalftimeFlashMatches(newHalftimeMatches);
      }
      if (newFulltimeMatches.size > 0) {
        setFulltimeFlashMatches(newFulltimeMatches);
      }
      if (newGoalMatches.size > 0) {
        setGoalFlashMatches(newGoalMatches);
      }

      // Group fixtures by date
      const allMatches: DayMatches[] = [];
      for (const dateInfo of dates) {
        const fixturesForDay = uniqueFixtures
          .filter((fixture) => {
            const matchDate = new Date(fixture.fixture.date);
            const year = matchDate.getFullYear();
            const month = String(matchDate.getMonth() + 1).padStart(2, "0");
            const day = String(matchDate.getDate()).padStart(2, "0");
            const matchDateString = `${year}-${month}-${day}`;
            return matchDateString === dateInfo.date;
          })
          .sort((a: FeaturedMatch, b: FeaturedMatch) => {
            // Priority sort: live matches first, then by league priority, then by time
            const aStatus = a.fixture.status.short;
            const bStatus = b.fixture.status.short;

            const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
            const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;

            // Priority leagues first
            const aPriority = priorityLeagueIds.indexOf(a.league.id);
            const bPriority = priorityLeagueIds.indexOf(b.league.id);

            if (aPriority !== -1 && bPriority === -1) return -1;
            if (aPriority === -1 && bPriority !== -1) return 1;
            if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;

            // Finally by time
            return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
          })
          .slice(0, maxMatches);

        console.log(`✅ [FeaturedMatches] Found ${fixturesForDay.length} featured matches for ${dateInfo.label}`);

        allMatches.push({
          date: dateInfo.date,
          label: dateInfo.label,
          matches: fixturesForDay
        });
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
    const elapsed = match.fixture.status.elapsed;

    if (status === 'NS') {
      return {
        text: formatMatchTime(match.fixture.date),
        color: 'bg-blue-500',
        isLive: false
      };
    }

    if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status)) {
      let displayText = status;
      
      if (status === 'HT') {
        displayText = 'Half Time';
      } else if (status === '1H' || status === '2H' || status === 'LIVE') {
        displayText = elapsed ? `${elapsed}'` : 'LIVE';
      } else if (status === 'ET') {
        displayText = elapsed ? `${elapsed}' ET` : 'Extra Time';
      } else if (status === 'P') {
        displayText = 'Penalties';
      }

      return {
        text: displayText,
        color: 'bg-red-500 animate-pulse',
        isLive: true
      };
    }

    if (status === 'FT') {
      return {
        text: 'Full Time',
        color: 'bg-gray-500',
        isLive: false
      };
    }

    if (status === 'PST') {
      return {
        text: 'Postponed',
        color: 'bg-yellow-500',
        isLive: false
      };
    }

    if (status === 'CANC') {
      return {
        text: 'Cancelled',
        color: 'bg-red-600',
        isLive: false
      };
    }

    return {
      text: status,
      color: 'bg-gray-400',
      isLive: false
    };
  };

  const handlePrevious = () => {
    const currentMatches = featuredMatches[selectedDay]?.matches || [];
    if (currentMatches.length > 0) {
      setCurrentMatchIndex((prev) => 
        prev === 0 ? currentMatches.length - 1 : prev - 1
      );
    }
  };

  const handleNext = () => {
    const currentMatches = featuredMatches[selectedDay]?.matches || [];
    if (currentMatches.length > 0) {
      setCurrentMatchIndex((prev) => 
        prev === currentMatches.length - 1 ? 0 : prev + 1
      );
    }
  };

  const currentMatches = featuredMatches[selectedDay]?.matches || [];
  const currentMatch = currentMatches[currentMatchIndex];

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
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4 overflow-hidden">
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
              onClick={() => {
                setSelectedDay(index);
                setCurrentMatchIndex(0);
              }}
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
        {currentMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No featured matches</p>
            <p className="text-sm">Check back later for upcoming games</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation arrows */}
            {currentMatches.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg z-30 border border-gray-200 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg z-30 border border-gray-200 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Single match display */}
            {currentMatch && (
              <div 
                className={`cursor-pointer transition-all duration-300 ${
                  halftimeFlashMatches.has(currentMatch.fixture.id) ? 'halftime-flash' : ''
                } ${
                  fulltimeFlashMatches.has(currentMatch.fixture.id) ? 'fulltime-flash' : ''
                } ${
                  goalFlashMatches.has(currentMatch.fixture.id) ? 'goal-flash' : ''
                }`}
                onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
              >
                {/* League header */}
                <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                  <LazyImage
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    className="w-6 h-6"
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {currentMatch.league.name}
                  </span>
                  {getStatusDisplay(currentMatch).isLive && (
                    <Star className="h-4 w-4 text-red-500 fill-current" />
                  )}
                </div>

                {/* Match day indicator */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-800">
                    {(() => {
                      if (getStatusDisplay(currentMatch).isLive) {
                        return 'Live Now';
                      }
                      
                      const matchDate = new Date(currentMatch.fixture.date);
                      const today = new Date();
                      const tomorrow = addDays(today, 1);
                      const dayAfterTomorrow = addDays(today, 2);
                      
                      const matchDateString = format(matchDate, 'yyyy-MM-dd');
                      const todayString = format(today, 'yyyy-MM-dd');
                      const tomorrowString = format(tomorrow, 'yyyy-MM-dd');
                      const dayAfterTomorrowString = format(dayAfterTomorrow, 'yyyy-MM-dd');
                      
                      if (matchDateString === todayString) {
                        return 'Today';
                      } else if (matchDateString === tomorrowString) {
                        return 'Tomorrow';
                      } else if (matchDateString === dayAfterTomorrowString) {
                        return format(matchDate, 'EEEE'); // Show day name like "Friday"
                      } else {
                        // For dates beyond day after tomorrow, show the day name
                        return format(matchDate, 'EEEE, MMM d');
                      }
                    })()}
                  </div>
                </div>

                {/* Teams display using MyColoredBar component */}
                <div className="relative mb-6">
                  <MyColoredBar
                    homeTeam={{
                      id: currentMatch.teams.home.id,
                      name: currentMatch.teams.home.name,
                      logo: currentMatch.teams.home.logo
                    }}
                    awayTeam={{
                      id: currentMatch.teams.away.id,
                      name: currentMatch.teams.away.name,
                      logo: currentMatch.teams.away.logo
                    }}
                    homeScore={currentMatch.goals.home}
                    awayScore={currentMatch.goals.away}
                    status={currentMatch.fixture.status.short}
                    fixture={{
                      id: currentMatch.fixture.id,
                      date: currentMatch.fixture.date,
                      status: currentMatch.fixture.status
                    }}
                    onClick={() => navigate(`/match/${currentMatch.fixture.id}`)}
                    getTeamColor={(teamId: number) => {
                      // Simple team color generator based on team ID
                      const colors = [
                        '#3B82F6', // blue
                        '#EF4444', // red
                        '#10B981', // green
                        '#F59E0B', // amber
                        '#8B5CF6', // violet
                        '#EC4899', // pink
                        '#14B8A6', // teal
                        '#F97316'  // orange
                      ];
                      return colors[teamId % colors.length];
                    }}
                    className="h-20 rounded-lg shadow-lg"
                    league={{
                      country: currentMatch.league.country
                    }}
                  />
                </div>

                {/* Match Details */}
                <div className="text-center text-sm text-gray-600 mb-4">
                  {format(new Date(currentMatch.fixture.date), 'EEEE, do MMMM | HH:mm')}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-around border-t border-gray-200 pt-4">
                  <button 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/match/${currentMatch.fixture.id}`);
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
                      navigate(`/league/${currentMatch.league.id}/standings`);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-500">
                      <path d="M4 6H6V8H4V6ZM4 11H6V13H4V11ZM4 16H6V18H4V16ZM20 8V6H8.023V8H18.8H20ZM8 11H20V13H8V11ZM8 16H20V18H8V16Z" fill="currentColor"/>
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Groups</span>
                  </button>
                </div>

                {/* Slide indicators */}
                {currentMatches.length > 1 && (
                  <div className="flex justify-center mt-4 gap-1">
                    {currentMatches.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMatchIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMatchIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHomeFeaturedMatchNew;