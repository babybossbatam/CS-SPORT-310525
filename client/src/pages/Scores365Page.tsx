
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LiveActionWidget from '@/components/matches/LiveActionWidget';
import { enhancedApiWrapper } from '@/lib/enhancedApiWrapper';

const Scores365Page: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchEvents, setMatchEvents] = useState<{ [key: number]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const matches = await enhancedApiWrapper.fetchLiveFixtures('Scores365Page');
      setLiveMatches(matches);
      
      if (matches.length > 0) {
        setSelectedMatch(matches[0]);
        fetchMatchEvents(matches[0].fixture.id);
      }
    } catch (error) {
      console.error('Error fetching live matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchEvents = async (fixtureId: number) => {
    try {
      const response = await fetch(`/api/fixtures/${fixtureId}/events`);
      if (response.ok) {
        const events = await response.json();
        setMatchEvents(prev => ({
          ...prev,
          [fixtureId]: events
        }));
      }
    } catch (error) {
      console.error('Error fetching match events:', error);
    }
  };

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    if (!matchEvents[match.fixture.id]) {
      fetchMatchEvents(match.fixture.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            365scores Live Action Replica
          </h1>
          <p className="text-gray-600">
            Experience live football matches with our 365scores-inspired widget
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Matches Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  Live Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading live matches...</p>
                  </div>
                ) : liveMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No live matches at the moment</p>
                    <Button 
                      onClick={fetchLiveMatches} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveMatches.map((match) => (
                      <div
                        key={match.fixture.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMatch?.fixture.id === match.fixture.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleMatchSelect(match)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive" size="sm">
                            {match.fixture.status.elapsed || 0}'
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {match.league.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <img 
                              src={match.teams.home.logo} 
                              alt=""
                              className="w-4 h-4"
                            />
                            <span className="truncate max-w-20">
                              {match.teams.home.name}
                            </span>
                          </div>
                          
                          <span className="font-bold px-2">
                            {match.goals.home} - {match.goals.away}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-20">
                              {match.teams.away.name}
                            </span>
                            <img 
                              src={match.teams.away.logo} 
                              alt=""
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Live Action Widget */}
          <div className="lg:col-span-2">
            {selectedMatch ? (
              <div className="space-y-6">
                {/* Match Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {selectedMatch.league.name} • {selectedMatch.league.country}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={selectedMatch.teams.home.logo} 
                          alt={selectedMatch.teams.home.name}
                          className="w-12 h-12"
                        />
                        <div>
                          <h3 className="font-bold text-lg">
                            {selectedMatch.teams.home.name}
                          </h3>
                          <p className="text-sm text-gray-600">Home</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">
                          {selectedMatch.goals.home} - {selectedMatch.goals.away}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedMatch.fixture.status.elapsed || 0}'
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <h3 className="font-bold text-lg">
                            {selectedMatch.teams.away.name}
                          </h3>
                          <p className="text-sm text-gray-600">Away</p>
                        </div>
                        <img 
                          src={selectedMatch.teams.away.logo} 
                          alt={selectedMatch.teams.away.name}
                          className="w-12 h-12"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 365scores Live Action Widget */}
                <LiveActionWidget
                  fixtureId={selectedMatch.fixture.id}
                  homeTeam={selectedMatch.teams.home}
                  awayTeam={selectedMatch.teams.away}
                  events={matchEvents[selectedMatch.fixture.id] || []}
                  status={selectedMatch.fixture.status}
                />

                {/* Match Events */}
                {matchEvents[selectedMatch.fixture.id] && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Match Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {matchEvents[selectedMatch.fixture.id].slice(0, 10).map((event, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Badge variant="outline" size="sm">
                              {event.time.elapsed}'
                            </Badge>
                            <div className="flex-1">
                              <span className="font-medium">{event.type}</span>
                              {event.detail && (
                                <span className="text-gray-600"> - {event.detail}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {event.team?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600">Select a live match to view the action widget</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scores365Page;
