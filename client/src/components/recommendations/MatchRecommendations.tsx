import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getTeamColor } from '@/lib/colorExtractor';
import { useLocation } from 'wouter';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  id: number;
  date: string;
  venue: {
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
}

interface Match {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface MatchRecommendationsProps {
  userId?: number;
  favoriteTeams?: number[];
  favoriteLeagues?: number[];
  recentlyViewedMatches?: number[];
}

type RecommendationType = 'trending' | 'personalized' | 'derby' | 'important';

const MatchRecommendations: React.FC<MatchRecommendationsProps> = ({
  userId,
  favoriteTeams = [],
  favoriteLeagues = [],
  recentlyViewedMatches = []
}) => {
  const [selectedTab, setSelectedTab] = useState<RecommendationType>('trending');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch popular fixtures
  const { data: trendingMatches, isLoading: trendingLoading } = useQuery<Match[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch upcoming major derbies - fallback to live fixtures for demo
  const { data: derbyMatches, isLoading: derbyLoading } = useQuery<Match[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Fetch personalized recommendations - fallback to fixtures by date for demo
  const { data: personalizedMatches, isLoading: personalizedLoading } = useQuery<Match[]>({
    queryKey: ['/api/fixtures/date/2025-05-09'],
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: true
  });
  
  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };
  
  const handleAddToFavorites = (match: Match) => {
    toast({
      title: "Added to favorites",
      description: `${match.teams.home.name} vs ${match.teams.away.name} added to your favorites`,
    });
  };
  
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const getLiveStatus = (match: Match) => {
    const { status } = match.fixture;
    if (status.short === 'NS') return 'Upcoming';
    if (status.short === 'FT') return 'Finished';
    if (status.short === '1H') return `Live: ${status.elapsed}'`;
    if (status.short === '2H') return `Live: ${status.elapsed}'`;
    if (status.short === 'HT') return 'Halftime';
    return status.long;
  };
  
  const getMatchImportance = (match: Match) => {
    // Simple simulation of match importance
    const isTopLeague = [2, 3, 39, 140, 135, 78].includes(match.league.id);
    const isBigTeam = ['barcelona', 'real madrid', 'manchester', 'liverpool', 'chelsea', 'juventus', 'milan', 'bayern', 'paris'].some(
      team => match.teams.home.name.toLowerCase().includes(team) || match.teams.away.name.toLowerCase().includes(team)
    );
    
    if (isTopLeague && isBigTeam) return 'High';
    if (isTopLeague || isBigTeam) return 'Medium';
    return 'Low';
  };
  
  // Render the match card
  const renderMatchCard = (match: Match, showImportance = false) => {
    const homeTeamColor = getTeamColor(match.teams.home.name);
    const awayTeamColor = getTeamColor(match.teams.away.name);
    const isLive = ['1H', '2H', 'HT'].includes(match.fixture.status.short);
    const importance = getMatchImportance(match);
    
    return (
      <Card 
        key={match.fixture.id}
        className={`mb-3 overflow-hidden border transition-all hover:shadow-md ${
          isLive ? 'border-red-400' : ''
        }`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${homeTeamColor}, ${awayTeamColor})` }}></div>
        
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <img 
                src={match.league.logo} 
                alt={match.league.name}
                className="h-4 w-4 mr-1"
              />
              <span className="text-xs font-medium truncate max-w-[150px]">{match.league.name}</span>
            </div>
            {showImportance && (
              <Badge variant={importance === 'High' ? 'default' : importance === 'Medium' ? 'secondary' : 'outline'}>
                {importance} Importance
              </Badge>
            )}
          </div>
          
          <div className="flex items-center mb-3">
            <div className="flex-1 flex flex-col items-start">
              <div className="flex items-center mb-1">
                <img 
                  src={match.teams.home.logo} 
                  alt={match.teams.home.name}
                  className="h-5 w-5 mr-1.5"
                />
                <span className="text-sm font-medium truncate">{match.teams.home.name}</span>
              </div>
              <div className="flex items-center">
                <img 
                  src={match.teams.away.logo} 
                  alt={match.teams.away.name}
                  className="h-5 w-5 mr-1.5"
                />
                <span className="text-sm font-medium truncate">{match.teams.away.name}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              {isLive ? (
                <div className="flex flex-col items-center">
                  <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold mb-1">LIVE</div>
                  <div className="text-xl font-bold">
                    {match.goals.home ?? 0} - {match.goals.away ?? 0}
                  </div>
                  <div className="text-xs font-medium text-red-600">
                    {match.fixture.status.elapsed}'
                  </div>
                </div>
              ) : match.fixture.status.short === 'FT' ? (
                <div className="flex flex-col items-center">
                  <div className="text-xl font-bold">
                    {match.goals.home ?? 0} - {match.goals.away ?? 0}
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    FT
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium">VS</div>
                  <div className="text-xs text-gray-500">
                    {formatMatchTime(match.fixture.date)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatMatchDate(match.fixture.date)}</span>
            </div>
            
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleAddToFavorites(match)}
              >
                <Star className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleMatchClick(match.fixture.id)}
              >
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Match Recommendations
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger 
              value="trending" 
              className="flex-1"
              onClick={() => setSelectedTab('trending')}
            >
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="personalized" 
              className="flex-1"
              onClick={() => setSelectedTab('personalized')}
            >
              For You
            </TabsTrigger>
            <TabsTrigger 
              value="derby" 
              className="flex-1"
              onClick={() => setSelectedTab('derby')}
            >
              Derbies
            </TabsTrigger>
            <TabsTrigger 
              value="important" 
              className="flex-1"
              onClick={() => setSelectedTab('important')}
            >
              Important
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trending" className="mt-0">
            <ScrollArea className="h-96">
              {trendingLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-pulse">Loading trending matches...</div>
                </div>
              ) : trendingMatches && trendingMatches.length > 0 ? (
                trendingMatches.map(match => renderMatchCard(match))
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No trending matches available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="personalized" className="mt-0">
            <ScrollArea className="h-96">
              {personalizedLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-pulse">Loading personalized recommendations...</div>
                </div>
              ) : personalizedMatches && personalizedMatches.length > 0 ? (
                personalizedMatches.map(match => renderMatchCard(match))
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>Follow teams or leagues to get personalized recommendations</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="derby" className="mt-0">
            <ScrollArea className="h-96">
              {derbyLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-pulse">Loading derby matches...</div>
                </div>
              ) : derbyMatches && derbyMatches.length > 0 ? (
                derbyMatches.map(match => renderMatchCard(match))
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No upcoming derby matches found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="important" className="mt-0">
            <ScrollArea className="h-96">
              {trendingLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-pulse">Loading important matches...</div>
                </div>
              ) : trendingMatches && trendingMatches.length > 0 ? (
                // Reuse trending matches but with importance badges
                trendingMatches
                  .sort((a, b) => {
                    const aImportance = getMatchImportance(a);
                    const bImportance = getMatchImportance(b);
                    return aImportance === 'High' ? -1 : bImportance === 'High' ? 1 : 0;
                  })
                  .map(match => renderMatchCard(match, true))
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No important matches available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchRecommendations;