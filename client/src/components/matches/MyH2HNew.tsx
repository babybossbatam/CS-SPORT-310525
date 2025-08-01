import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyH2HNewProps {
  homeTeamId?: number;
  awayTeamId?: number;
  match?: any;
}

interface H2HMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
    };
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
    home: number;
    away: number;
  };
  league: {
    name: string;
    logo: string;
  };
}

const MyH2HNew: React.FC<MyH2HNewProps> = ({ homeTeamId, awayTeamId, match }) => {
  const [h2hData, setH2hData] = useState<H2HMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualHomeTeamId = homeTeamId || match?.teams?.home?.id;
  const actualAwayTeamId = awayTeamId || match?.teams?.away?.id;

  useEffect(() => {
    if (!actualHomeTeamId || !actualAwayTeamId) {
      console.log(`⚠️ [H2H] Missing team IDs: home=${actualHomeTeamId}, away=${actualAwayTeamId}`);
      return;
    }

    // Validate team IDs are numbers
    if (isNaN(Number(actualHomeTeamId)) || isNaN(Number(actualAwayTeamId))) {
      console.log(`❌ [H2H] Invalid team IDs: home=${actualHomeTeamId}, away=${actualAwayTeamId}`);
      setError('Invalid team IDs provided');
      return;
    }

    const fetchH2HData = async () => {
      let url = '';
      try {
        setLoading(true);
        setError(null);

        console.log(`🔍 [H2H] Fetching head-to-head data for teams: ${actualHomeTeamId} vs ${actualAwayTeamId}`);

        const h2hParam = `${actualHomeTeamId}-${actualAwayTeamId}`;
        const params = new URLSearchParams({
          h2h: h2hParam,
          last: '10'
        });
        url = `/api/fixtures/headtohead?${params.toString()}`;
        console.log(`🔍 [H2H] Fetching from: ${url}`);
        console.log(`🔍 [H2H] Raw team IDs: home=${actualHomeTeamId} (${typeof actualHomeTeamId}), away=${actualAwayTeamId} (${typeof actualAwayTeamId})`);
        console.log(`🔍 [H2H] H2H parameter: "${h2hParam}"`);

        const response = await fetch(url);

        console.log(`📡 [H2H] Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`❌ [H2H] API Error:`, errorData);
          console.error(`❌ [H2H] Full error details:`, {
            status: response.status,
            url: url,
            teams: `${actualHomeTeamId} vs ${actualAwayTeamId}`,
            errorData
          });

          // Handle specific error cases more gracefully
          if (response.status === 400) {
            // Set empty data instead of throwing error
            setH2hData([]);
            setError(null); // Don't show error, just show "no data"
            return;
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`📊 [H2H] Raw API Response:`, data);

        const fixtures = data?.response || [];
        console.log(`✅ [H2H] Found ${fixtures.length} head-to-head matches`);

        // Handle case where API returns success but with message about no data
        if (data?.message && fixtures.length === 0) {
          console.log(`ℹ️ [H2H] API message: ${data.message}`);
        }

        setH2hData(fixtures);
      } catch (err) {
        console.error('❌ [H2H] Error:', err);
        const errorMessage = `Failed to load head-to-head data: ${err.message}`;
        console.error('❌ [H2H] Detailed error context:', {
          homeTeam: actualHomeTeamId,
          awayTeam: actualAwayTeamId,
          url: url,
          error: err
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchH2HData();
  }, [actualHomeTeamId, actualAwayTeamId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Head to Head</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm">Loading head-to-head data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Head to Head</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-red-600">
              {error.includes('no head-to-head data') || error.includes('Invalid team combination') 
                ? 'No previous meetings found between these teams' 
                : error}
            </p>
            <div className="mt-2 text-xs text-gray-400">
              Teams: {actualHomeTeamId} vs {actualAwayTeamId}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!h2hData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Head to Head</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* 365scores-inspired No Data Layout */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-lg p-4">
            {/* Home Team Section */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">H</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                Home Team
              </div>
            </div>

            {/* No Data Message */}
            <div className="flex items-center space-x-4 flex-2">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Draws</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
            </div>

            {/* Away Team Section */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-red-600">A</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                Away Team
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium">No Previous Meetings</p>
            <p className="text-xs text-gray-400 mt-1">These teams haven't played against each other</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get recent 5 matches
  const recentMatches = h2hData.slice(0, 5);

  // Calculate statistics only from finished matches
  const finishedMatches = h2hData.filter(match => 
    match.fixture?.status?.short === 'FT' || 
    match.fixture?.status?.short === 'AET' ||
    match.fixture?.status?.short === 'PEN'
  );

  const homeWins = finishedMatches.filter(match => 
    (match.teams.home.id === actualHomeTeamId && match.goals.home > match.goals.away) ||
    (match.teams.away.id === actualHomeTeamId && match.goals.away > match.goals.home)
  ).length;

  const awayWins = finishedMatches.filter(match => 
    (match.teams.home.id === actualAwayTeamId && match.goals.home > match.goals.away) ||
    (match.teams.away.id === actualAwayTeamId && match.goals.away > match.goals.home)
  ).length;

  const draws = finishedMatches.filter(match => 
    match.goals.home === match.goals.away && 
    match.goals.home !== null && 
    match.goals.away !== null
  ).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Head to Head</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* 365scores-inspired H2H Header */}
          {finishedMatches.length > 0 && (
            <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-lg p-4">
              {/* Home Team Section */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">H</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                  Home Team
                </div>
              </div>

              {/* Score Summary */}
              <div className="flex items-center space-x-4 flex-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{homeWins}</div>
                  <div className="text-xs text-gray-500">Wins</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{draws}</div>
                  <div className="text-xs text-gray-500">Draws</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{awayWins}</div>
                  <div className="text-xs text-gray-500">Wins</div>
                </div>
              </div>

              {/* Away Team Section */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">A</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                  Away Team
                </div>
              </div>
            </div>
          )}

          {finishedMatches.length === 0 && h2hData.length > 0 && (
            <div className="text-center text-gray-500 mb-4">
              <div className="text-sm">No completed matches found</div>
              <div className="text-xs">Showing upcoming fixtures</div>
            </div>
          )}

          {/* Recent Matches - 365scores style */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Previous Meetings</h4>
            
            {/* Detailed List View - 365scores inspired */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {recentMatches.map((match, index) => {
                const isHomeWinner = match.goals.home > match.goals.away;
                const isAwayWinner = match.goals.away > match.goals.home;
                const isDraw = match.goals.home === match.goals.away && match.goals.home !== null;
                const isScheduled = match.goals.home === null || match.goals.away === null;
                
                return (
                  <div 
                    key={match.fixture.id} 
                    className={`border-b border-gray-100 last:border-b-0 p-3 hover:bg-gray-50 transition-colors ${
                      index === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className={`flex-1 ${
                        isHomeWinner ? 'font-bold text-gray-900' : 'text-gray-600'
                      }`}>
                        <div className="text-sm truncate max-w-24">
                          {match.teams.home.name}
                        </div>
                      </div>

                      {/* Competition Info */}
                      <div className="flex-2 text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          {match.league?.name || 'Unknown Competition'}
                        </div>
                        
                        {/* Score or Time */}
                        <div className="text-sm font-bold text-gray-900">
                          {isScheduled ? (
                            new Date(match.fixture.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            })
                          ) : (
                            `${match.goals.home} - ${match.goals.away}`
                          )}
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className={`flex-1 text-right ${
                        isAwayWinner ? 'font-bold text-gray-900' : 'text-gray-600'
                      }`}>
                        <div className="text-sm truncate max-w-24">
                          {match.teams.away.name}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex-1 text-right text-xs text-gray-500 ml-3">
                        {new Date(match.fixture.date).toLocaleDateString('en-US', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Match Status Indicator */}
                    {!isScheduled && (
                      <div className="mt-2 flex justify-center">
                        <div className={`w-2 h-2 rounded-full ${
                          isHomeWinner ? 'bg-blue-500' : 
                          isAwayWinner ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Compact Cards View - Alternative Layout */}
            <div className="space-y-2 mt-4">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Match Details</h5>
              {recentMatches.slice(0, 3).map((match, index) => (
                <div key={`compact-${match.fixture.id}`} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    {/* Home Team with Logo */}
                    <div className="flex items-center space-x-2 flex-1">
                      <img 
                        src={match.teams.home.logo} 
                        alt={match.teams.home.name}
                        className="w-5 h-5 object-contain"
                      />
                      <span className={`text-sm truncate max-w-16 ${
                        match.goals.home > match.goals.away ? 'font-bold text-gray-900' : 'text-gray-700'
                      }`}>
                        {match.teams.home.name}
                      </span>
                    </div>

                    {/* Score and Competition */}
                    <div className="flex flex-col items-center space-y-1 mx-4 min-w-20">
                      <div className="flex items-center space-x-2">
                        {match.goals.home !== null && match.goals.away !== null ? (
                          <>
                            <span className={`text-sm font-bold ${
                              match.goals.home > match.goals.away ? 'text-green-600' : 
                              match.goals.home < match.goals.away ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {match.goals.home}
                            </span>
                            <span className="text-xs text-gray-400">-</span>
                            <span className={`text-sm font-bold ${
                              match.goals.away > match.goals.home ? 'text-green-600' : 
                              match.goals.away < match.goals.home ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {match.goals.away}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            {match.fixture?.status?.short === 'NS' ? 'SCH' : match.fixture?.status?.short}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 text-center bg-gray-100 px-2 py-1 rounded max-w-20 truncate">
                        {match.league?.name}
                      </div>
                    </div>

                    {/* Away Team with Logo */}
                    <div className="flex items-center space-x-2 flex-1 justify-end">
                      <span className={`text-sm truncate max-w-16 ${
                        match.goals.away > match.goals.home ? 'font-bold text-gray-900' : 'text-gray-700'
                      }`}>
                        {match.teams.away.name}
                      </span>
                      <img 
                        src={match.teams.away.logo} 
                        alt={match.teams.away.name}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">
                      {new Date(match.fixture.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {h2hData.length > 5 && (
            <div className="text-center mt-3">
              <span className="text-xs text-gray-500">
                Showing {recentMatches.length} of {h2hData.length} matches
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <TopTrendsCard homeTeamId={actualHomeTeamId} awayTeamId={actualAwayTeamId} />
    </>
  );
};

// Top Trends Card Component
const TopTrendsCard: React.FC<{ homeTeamId?: number; awayTeamId?: number }> = ({ homeTeamId, awayTeamId }) => {
  const trends = [
    { label: "Goals per game", home: "2.1", away: "1.8" },
    { label: "Clean sheets", home: "40%", away: "30%" },
    { label: "Both teams score", home: "65%", away: "70%" },
    { label: "Over 2.5 goals", home: "60%", away: "55%" }
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Trends</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{trend.label}</span>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-medium text-blue-600">{trend.home}</span>
                <span className="text-xs text-gray-400">vs</span>
                <span className="text-xs font-medium text-red-600">{trend.away}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyH2HNew;