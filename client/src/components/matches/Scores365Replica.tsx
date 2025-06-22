
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Trophy, Star, Filter, Search, Globe, TrendingUp } from "lucide-react";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import { getCountryFlagWithFallbackSync } from "@/lib/flagUtils";

interface Match {
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
    round?: string;
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
  score?: {
    halftime?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface LeagueGroup {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  matches: Match[];
}

const Scores365Replica: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('live');
  const [favoriteLeagues, setFavoriteLeagues] = useState<number[]>([2, 39, 140, 135, 78]); // Popular leagues

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch live matches
        const liveResponse = await fetch('/api/fixtures/live');
        const liveData = await liveResponse.json();
        setLiveMatches(liveData || []);

        // Fetch matches for selected date
        const dateResponse = await fetch(`/api/fixtures/date/${selectedDate}?all=true`);
        const dateData = await dateResponse.json();
        setMatches(dateData || []);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh live matches every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'live') {
        fetch('/api/fixtures/live')
          .then(res => res.json())
          .then(data => setLiveMatches(data || []))
          .catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate, activeTab]);

  // Group matches by league
  const groupMatchesByLeague = (matchList: Match[]): LeagueGroup[] => {
    const grouped = matchList.reduce((acc, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: match.league,
          matches: []
        };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {} as Record<number, LeagueGroup>);

    return Object.values(grouped).sort((a, b) => {
      // Sort by favorite leagues first, then by league name
      const aIsFavorite = favoriteLeagues.includes(a.league.id);
      const bIsFavorite = favoriteLeagues.includes(b.league.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return a.league.name.localeCompare(b.league.name);
    });
  };

  // Filter matches based on selected league
  const filterMatches = (matchList: Match[]) => {
    if (selectedLeague === 'all') return matchList;
    if (selectedLeague === 'favorites') {
      return matchList.filter(match => favoriteLeagues.includes(match.league.id));
    }
    return matchList.filter(match => match.league.id.toString() === selectedLeague);
  };

  // Get match status display
  const getMatchStatus = (match: Match) => {
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (['1H', '2H', 'ET', 'P'].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === 'HT') return 'HT';
    if (status === 'FT') return 'FT';
    if (status === 'NS') {
      const kickoff = new Date(match.fixture.date);
      return kickoff.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    return status;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    if (['1H', '2H', 'ET', 'P'].includes(status)) return 'bg-red-500';
    if (status === 'HT') return 'bg-orange-500';
    if (status === 'FT') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const isLive = (status: string) => ['1H', '2H', 'ET', 'P', 'HT'].includes(status);

  // Render match card (365scores style)
  const renderMatchCard = (match: Match) => (
    <div 
      key={match.fixture.id}
      className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      {/* Time/Status */}
      <div className="flex flex-col items-center w-16 text-xs">
        <Badge 
          variant="secondary" 
          className={`text-white text-xs px-2 py-1 ${getStatusColor(match.fixture.status.short)}`}
        >
          {getMatchStatus(match)}
        </Badge>
        {isLive(match.fixture.status.short) && (
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 animate-pulse"></div>
        )}
      </div>

      {/* Teams */}
      <div className="flex-1 mx-4">
        {/* Home Team */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MyWorldTeamLogo
              logoUrl={match.teams.home.logo}
              teamName={match.teams.home.name}
              size="w-5 h-5"
            />
            <span className="text-sm font-medium truncate">{match.teams.home.name}</span>
          </div>
          <span className="text-lg font-bold min-w-[20px] text-center">
            {match.goals.home ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MyWorldTeamLogo
              logoUrl={match.teams.away.logo}
              teamName={match.teams.away.name}
              size="w-5 h-5"
            />
            <span className="text-sm font-medium truncate">{match.teams.away.name}</span>
          </div>
          <span className="text-lg font-bold min-w-[20px] text-center">
            {match.goals.away ?? '-'}
          </span>
        </div>
      </div>

      {/* League Info */}
      <div className="flex flex-col items-end text-xs text-gray-500 w-20">
        <MyCircularFlag 
          country={match.league.country}
          size="w-4 h-4"
        />
        <span className="text-center mt-1 truncate w-full">
          {match.league.name.length > 15 
            ? match.league.name.substring(0, 15) + '...' 
            : match.league.name
          }
        </span>
      </div>
    </div>
  );

  // Render league section
  const renderLeagueSection = (leagueGroup: LeagueGroup) => (
    <div key={leagueGroup.league.id} className="mb-6">
      {/* League Header */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border-b-2 border-blue-500">
        <MyCircularFlag 
          country={leagueGroup.league.country}
          size="w-6 h-6"
        />
        <img 
          src={leagueGroup.league.logo} 
          alt={leagueGroup.league.name}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            e.currentTarget.src = "/assets/fallback-logo.png";
          }}
        />
        <h3 className="font-semibold text-gray-800">{leagueGroup.league.name}</h3>
        <Badge variant="outline" className="ml-auto">
          {leagueGroup.matches.length}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const isFavorite = favoriteLeagues.includes(leagueGroup.league.id);
            setFavoriteLeagues(prev => 
              isFavorite 
                ? prev.filter(id => id !== leagueGroup.league.id)
                : [...prev, leagueGroup.league.id]
            );
          }}
        >
          <Star 
            className={`w-4 h-4 ${
              favoriteLeagues.includes(leagueGroup.league.id) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-400'
            }`} 
          />
        </Button>
      </div>

      {/* Matches */}
      <div className="bg-white">
        {leagueGroup.matches.map(renderMatchCard)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 365scores style */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-blue-600">CS Sport</h1>
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                365scores Style
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by league" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  <SelectItem value="favorites">⭐ Favorites</SelectItem>
                  <SelectItem value="2">UEFA Champions League</SelectItem>
                  <SelectItem value="39">Premier League</SelectItem>
                  <SelectItem value="140">La Liga</SelectItem>
                  <SelectItem value="135">Serie A</SelectItem>
                  <SelectItem value="78">Bundesliga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-gray-100">
              <TabsTrigger value="live" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live
              </TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Date Navigator */}
      {activeTab !== 'live' && (
        <div className="bg-white border-b p-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Today
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="live">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  Live Matches ({liveMatches.length})
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-red-500" />
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading live matches...</p>
                  </div>
                ) : liveMatches.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No live matches at the moment</p>
                  </div>
                ) : (
                  <div>
                    {groupMatchesByLeague(filterMatches(liveMatches)).map(renderLeagueSection)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Matches ({matches.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading matches...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No matches scheduled for this date</p>
                  </div>
                ) : (
                  <div>
                    {groupMatchesByLeague(filterMatches(matches)).map(renderLeagueSection)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Matches</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div>
                  {groupMatchesByLeague(
                    filterMatches(matches.filter(m => m.fixture.status.short === 'NS'))
                  ).map(renderLeagueSection)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div>
                  {groupMatchesByLeague(
                    filterMatches(matches.filter(m => m.fixture.status.short === 'FT'))
                  ).map(renderLeagueSection)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Scores365Replica;
