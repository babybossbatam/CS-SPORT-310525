
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addDays, subDays, isValid } from "date-fns";
import { Clock, Filter, Zap, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/utils";
import LazyMatchItem from "./LazyMatchItem";
import { NoLiveMatchesEmpty } from "./NoLiveMatchesEmpty";

interface MyBasketmainLeftProps {
  fixtures?: any[];
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

const MyBasketmainLeft: React.FC<MyBasketmainLeftProps> = ({
  fixtures = [],
  onMatchClick,
  onMatchCardClick
}) => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [popularFilterActive, setPopularFilterActive] = useState(false);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  // Basketball-specific popular leagues
  const POPULAR_BASKETBALL_LEAGUES = [
    "NBA",
    "EuroLeague", 
    "EuroCup",
    "Basketball Champions League",
    "FIBA World Cup",
    "Olympics",
    "NCAA",
    "WNBA",
    "Turkish Basketball Super League",
    "Spanish Liga ACB",
    "Italian Lega Basket Serie A",
    "German Basketball Bundesliga",
    "French Pro A",
    "VTB United League"
  ];

  // Apply UTC date filtering to fixtures - similar to MyMainLayout
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🏀 [MyBasketmainLeft UTC] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    const filtered = fixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        // Extract UTC date from fixture date (no timezone conversion)
        const fixtureUTCDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureUTCDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC

        // Simple UTC date matching
        const shouldInclude = fixtureDateString === selectedDate;

        if (!shouldInclude) {
          console.log(
            `❌ [MyBasketmainLeft UTC FILTER] Basketball match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureUTCDate: fixture.fixture.date,
              extractedUTCDate: fixtureDateString,
              selectedDate,
              status: fixture.fixture.status.short,
              reason: 'UTC date mismatch'
            },
          );
          return false;
        }

        console.log(
          `✅ [MyBasketmainLeft UTC FILTER] Basketball match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          {
            fixtureUTCDate: fixture.fixture.date,
            extractedUTCDate: fixtureDateString,
            selectedDate,
            status: fixture.fixture.status.short
          },
        );

        return true;
      }

      return false;
    });

    console.log(
      `✅ [MyBasketmainLeft UTC] After UTC filtering: ${filtered.length} basketball matches for ${selectedDate}`,
    );
    return filtered;
  }, [fixtures, selectedDate]);

  // Fetch live basketball fixtures
  const { data: liveBasketballFixtures = [], isLoading: isLoadingLive } = useQuery({
    queryKey: ["basketball-live-fixtures"],
    queryFn: async () => {
      console.log("🏀 Fetching basketball live fixtures");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      // Filter for basketball only
      const basketballFixtures = data.filter((fixture: any) => 
        fixture.league?.name?.toLowerCase().includes('basketball') ||
        fixture.league?.name?.toLowerCase().includes('nba') ||
        fixture.league?.name?.toLowerCase().includes('euroleague') ||
        fixture.league?.name?.toLowerCase().includes('wnba') ||
        fixture.league?.name?.toLowerCase().includes('ncaa') ||
        fixture.league?.sport?.toLowerCase() === 'basketball'
      );
      console.log(`🏀 Received ${basketballFixtures.length} basketball live fixtures`);
      return basketballFixtures;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: liveFilterActive,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
  });

  // Group fixtures by league similar to football components
  const groupedBasketballFixtures = useMemo(() => {
    let fixturesToGroup = liveFilterActive ? liveBasketballFixtures : filteredFixtures;

    // Apply popular filter if active
    if (popularFilterActive) {
      fixturesToGroup = fixturesToGroup.filter((fixture: any) =>
        POPULAR_BASKETBALL_LEAGUES.some(league => 
          fixture.league?.name?.toLowerCase().includes(league.toLowerCase())
        )
      );
    }

    const grouped: Record<string, any> = {};

    fixturesToGroup.forEach((fixture: any) => {
      const leagueName = fixture.league?.name || 'Unknown League';
      const country = fixture.league?.country || 'Unknown';
      
      if (!grouped[leagueName]) {
        grouped[leagueName] = {
          league: fixture.league,
          country: country,
          matches: [],
          isPopular: POPULAR_BASKETBALL_LEAGUES.some(popular => 
            leagueName.toLowerCase().includes(popular.toLowerCase())
          )
        };
      }
      
      grouped[leagueName].matches.push(fixture);
    });

    // Sort matches within each league by time
    Object.values(grouped).forEach((leagueData: any) => {
      leagueData.matches.sort((a: any, b: any) => {
        const aDate = parseISO(a.fixture.date);
        const bDate = parseISO(b.fixture.date);
        
        if (!isValid(aDate) || !isValid(bDate)) return 0;
        
        const aTime = aDate.getTime();
        const bTime = bDate.getTime();
        const nowTime = new Date().getTime();
        
        // Live matches first
        const aLive = ['LIVE', '1Q', '2Q', '3Q', '4Q', 'OT', 'HT'].includes(a.fixture.status.short);
        const bLive = ['LIVE', '1Q', '2Q', '3Q', '4Q', 'OT', 'HT'].includes(b.fixture.status.short);
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        // Then by time proximity
        const aDistance = Math.abs(aTime - nowTime);
        const bDistance = Math.abs(bTime - nowTime);
        return aDistance - bDistance;
      });
    });

    return grouped;
  }, [filteredFixtures, liveBasketballFixtures, liveFilterActive, popularFilterActive]);

  // Sort leagues by popularity and match count
  const sortedLeagues = useMemo(() => {
    return Object.entries(groupedBasketballFixtures)
      .sort(([, a], [, b]) => {
        // Popular leagues first
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        
        // Then by match count
        return b.matches.length - a.matches.length;
      });
  }, [groupedBasketballFixtures]);

  const handleMatchClick = (matchId: number) => {
    console.log('🏀 [MyBasketmainLeft] Basketball match clicked:', matchId);
    onMatchClick?.(matchId);
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🏀 [MyBasketmainLeft] Basketball match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      source: 'MyBasketmainLeft'
    });
    onMatchCardClick?.(fixture);
  };

  const toggleLeague = (leagueName: string) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueName)) {
      newExpanded.delete(leagueName);
    } else {
      newExpanded.add(leagueName);
    }
    setExpandedLeagues(newExpanded);
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'LIVE': { label: 'LIVE', color: 'bg-red-500' },
      '1Q': { label: '1st Quarter', color: 'bg-red-500' },
      '2Q': { label: '2nd Quarter', color: 'bg-red-500' },
      '3Q': { label: '3rd Quarter', color: 'bg-red-500' },
      '4Q': { label: '4th Quarter', color: 'bg-red-500' },
      'OT': { label: 'Overtime', color: 'bg-red-500' },
      'HT': { label: 'Halftime', color: 'bg-orange-500' },
      'FT': { label: 'Final', color: 'bg-gray-500' },
      'NS': { label: 'Scheduled', color: 'bg-blue-500' },
      'PST': { label: 'Postponed', color: 'bg-yellow-500' },
      'CANC': { label: 'Cancelled', color: 'bg-gray-500' }
    };
    
    return statusMap[status] || { label: status, color: 'bg-gray-500' };
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getHeaderTitle = () => {
    if (liveFilterActive) return "🔴 Live Basketball Games";
    if (timeFilterActive) return "⏰ Basketball by Time";
    if (popularFilterActive) return "⭐ Popular Basketball Leagues";
    return "🏀 Today's Basketball Matches";
  };

  const totalMatches = Object.values(groupedBasketballFixtures).reduce(
    (sum, league: any) => sum + league.matches.length, 0
  );

  if (liveFilterActive && isLoadingLive) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading live basketball games...</p>
      </div>
    );
  }

  if (liveFilterActive && liveBasketballFixtures.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <NoLiveMatchesEmpty sport="Basketball" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Basketball Matches</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={liveFilterActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setLiveFilterActive(!liveFilterActive);
                setTimeFilterActive(false);
                setPopularFilterActive(false);
              }}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Button>
            <Button
              variant={timeFilterActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTimeFilterActive(!timeFilterActive);
                setLiveFilterActive(false);
                setPopularFilterActive(false);
              }}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              By Time
            </Button>
            <Button
              variant={popularFilterActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPopularFilterActive(!popularFilterActive);
                setLiveFilterActive(false);
                setTimeFilterActive(false);
              }}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Popular
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {totalMatches} matches
          </span>
          <span className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            {Object.keys(groupedBasketballFixtures).length} leagues
          </span>
        </div>
      </div>

      {/* Header */}
      <CardHeader className="flex items-start gap-2 p-3 bg-white border border-stone-200 font-semibold rounded-lg">
        {getHeaderTitle()}
      </CardHeader>

      {/* Leagues and Matches */}
      {sortedLeagues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No basketball matches found for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLeagues.map(([leagueName, leagueData]: [string, any]) => {
            const isExpanded = expandedLeagues.has(leagueName);
            const matchesToShow = isExpanded ? leagueData.matches : leagueData.matches.slice(0, 3);
            
            return (
              <Card key={leagueName} className="border bg-card text-card-foreground shadow-md overflow-hidden">
                {/* League Header */}
                <div 
                  className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b cursor-pointer hover:from-orange-100 hover:to-orange-150 transition-colors"
                  onClick={() => toggleLeague(leagueName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={leagueData.league?.logo || '/assets/fallback-logo.png'}
                        alt={leagueName}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/fallback-logo.png';
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{leagueName}</h3>
                        <p className="text-xs text-gray-600">{leagueData.country}</p>
                      </div>
                      {leagueData.isPopular && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{leagueData.matches.length} matches</span>
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {matchesToShow.map((match: any, index: number) => {
                      const status = getStatusDisplay(match.fixture.status.short);
                      const isLive = ['LIVE', '1Q', '2Q', '3Q', '4Q', 'OT'].includes(match.fixture.status.short);
                      
                      return (
                        <LazyMatchItem
                          key={match.fixture.id}
                          isVisible={true}
                        >
                          <div
                            className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleMatchCardClick(match)}
                          >
                            {/* Home Team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <img
                                src={match.teams.home.logo || '/assets/fallback-logo.png'}
                                alt={match.teams.home.name}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/fallback-logo.png';
                                }}
                              />
                              <span className="font-medium text-sm truncate">{match.teams.home.name}</span>
                            </div>

                            {/* Score/Time/Status */}
                            <div className="flex items-center gap-3 px-3">
                              {isLive ? (
                                <div className="text-center">
                                  <div className="text-lg font-bold">
                                    {match.goals?.home || 0} - {match.goals?.away || 0}
                                  </div>
                                  <Badge className={`text-xs ${status.color} text-white animate-pulse`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              ) : match.fixture.status.short === 'FT' ? (
                                <div className="text-center">
                                  <div className="text-lg font-bold">
                                    {match.goals?.home || 0} - {match.goals?.away || 0}
                                  </div>
                                  <Badge className={`text-xs ${status.color} text-white`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="text-sm font-medium">
                                    {formatTime(match.fixture.date)}
                                  </div>
                                  <Badge className={`text-xs ${status.color} text-white`}>
                                    {status.label}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="font-medium text-sm truncate">{match.teams.away.name}</span>
                              <img
                                src={match.teams.away.logo || '/assets/fallback-logo.png'}
                                alt={match.teams.away.name}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/fallback-logo.png';
                                }}
                              />
                            </div>
                          </div>
                        </LazyMatchItem>
                      );
                    })}
                    
                    {/* Show More Button */}
                    {!isExpanded && leagueData.matches.length > 3 && (
                      <div 
                        className="p-3 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleLeague(leagueName)}
                      >
                        <span className="text-sm text-blue-600 font-medium">
                          Show {leagueData.matches.length - 3} more matches
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBasketmainLeft;
