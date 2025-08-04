import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyKeyPlayer from './MyKeyPlayer';

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
      console.log(`⚠️ [H2H] Match object:`, match);
      return;
    }

    // Validate team IDs are numbers
    if (isNaN(Number(actualHomeTeamId)) || isNaN(Number(actualAwayTeamId))) {
      console.log(`❌ [H2H] Invalid team IDs: home=${actualHomeTeamId}, away=${actualAwayTeamId}`);
      console.log(`❌ [H2H] Team ID types: home=${typeof actualHomeTeamId}, away=${typeof actualAwayTeamId}`);
      setError('Invalid team IDs provided');
      return;
    }

    // Additional validation - check if teams are the same
    if (Number(actualHomeTeamId) === Number(actualAwayTeamId)) {
      console.log(`❌ [H2H] Same team IDs provided: ${actualHomeTeamId}`);
      setError('Cannot get head-to-head data for the same team');
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
          if (response.status === 400 || 
              (errorData.message && errorData.message.includes('Invalid fixture ID')) ||
              (errorData.error && errorData.error.includes('Invalid fixture ID'))) {
            // Set empty data instead of throwing error for invalid fixture IDs
            console.log(`ℹ️ [H2H] Invalid fixture ID or no data available for teams ${actualHomeTeamId} vs ${actualAwayTeamId}`);
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

        // If no fixtures found, let's verify the teams exist
        if (fixtures.length === 0) {
          console.log(`🔍 [H2H] No fixtures found, checking if teams exist...`);
          try {
            const testResponse = await fetch(`/api/fixtures/test-teams/${actualHomeTeamId}/${actualAwayTeamId}`);
            const testData = await testResponse.json();
            console.log(`🧪 [H2H] Team verification:`, testData);
          } catch (testError) {
            console.log(`❌ [H2H] Team verification failed:`, testError);
          }
        }

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

  // Only show "No Previous Meetings" if we have no data AND no error (meaning successful fetch with empty result)
  if (!h2hData.length && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Head to Head</CardTitle>
        </CardHeader>
        <CardContent className="p-1">
          {/* 365scores-inspired No Data Layout */}
          <div className="flex items-center justify-between  p-1">
            {/* Home Team Section */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-22 h-22  flex items-center justify-center mr-3">
                <MyWorldTeamLogo
                  teamName={match?.teams?.home?.name || 'Home Team'}
                  teamLogo={match?.teams?.home?.logo}
                  teamId={match?.teams?.home?.id}
                  alt={match?.teams?.home?.name || 'Home Team'}
                  size="80px"
                  className="w-14 h-14 "
                />
              </div>
              <div className="text-sm font-bold py-4 text-gray-600 text-center max-w-100 truncate" title={match?.teams?.home?.name}>
                {match?.teams?.home?.name || 'Home Team'}
              </div>
            </div>

            {/* No Data Message */}
            <div className="flex items-center space-x-3 flex-2 px-4">
              <div className="text-center min-w-12">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center min-w-12">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Draws</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center min-w-12">
                <div className="text-lg font-bold text-gray-400">-</div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
            </div>

            {/* Away Team Section */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-22 h-22  flex items-center justify-center">
                <MyWorldTeamLogo
                  teamName={match?.teams?.away?.name || 'Away Team'}
                  teamLogo={match?.teams?.away?.logo}
                  teamId={match?.teams?.away?.id}
                  alt={match?.teams?.away?.name || 'Away Team'}
                  size="80px"
                  className="w-14 h-14 mr-4"
                />
              </div>
              <div className="text-sm py-4 text-gray-600 text-center font-bold  max-w-100 truncate" title={match?.teams?.away?.name}>
                {match?.teams?.away?.name || 'Away Team'}
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2"></div>
            <p className="text-sm font-medium">No Previous Meetings</p>
            
            {match?.teams?.home?.name && match?.teams?.away?.name ? (
              <div className="mt-2 space-y-2">
      
                
                {/* Analysis based on team names */}
                {(match.teams.home.name.toLowerCase().includes('alkmaar') && 
                  match.teams.away.name.toLowerCase().includes('ilves')) && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium mb-1">Analysis</p>
                    <p className="text-xs text-blue-600">
                      AZ Alkmaar (Netherlands) and Ilves (Finland) compete in different domestic leagues. 
                      They would only meet in UEFA competitions or international friendlies.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                These teams haven't played against each other
              </p>
            )}
            
            <div className="mt-3 text-xs text-gray-400 opacity-75">
              Team IDs: {actualHomeTeamId} vs {actualAwayTeamId}
            </div>
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

  // Check if we have any finished matches for statistics
  const hasFinishedMatches = finishedMatches.length > 0;

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
                  <MyWorldTeamLogo
                    teamName={match?.teams?.home?.name || 'Home Team'}
                    teamLogo={match?.teams?.home?.logo}
                    teamId={actualHomeTeamId}
                    alt={match?.teams?.home?.name || 'Home Team'}
                    size="32px"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                  {match?.teams?.home?.name || 'Home Team'}
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
                  <MyWorldTeamLogo
                    teamName={match?.teams?.away?.name || 'Away Team'}
                    teamLogo={match?.teams?.away?.logo}
                    teamId={actualAwayTeamId}
                    alt={match?.teams?.away?.name || 'Away Team'}
                    size="32px"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="text-xs text-gray-600 text-center max-w-16 truncate">
                  {match?.teams?.away?.name || 'Away Team'}
                </div>
              </div>
            </div>
          )}

          {!hasFinishedMatches && h2hData.length > 0 && (
            <div className="text-center text-gray-500 mb-4">
              <div className="text-sm">No completed matches found</div>
              <div className="text-xs">Showing upcoming/scheduled fixtures</div>
              <div className="text-xs text-blue-600 mt-1">
                These teams will meet soon - check back after their matches!
              </div>
            </div>
          )}

          {/* Historical Meetings - Clean format like reference image */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Previous Meetings</h4>
            
            {/* Clean Historical List - Simplified format */}
            <div className="bg-white rounded-lg overflow-hidden">
              {recentMatches.map((match, index) => {
                const isScheduled = match.goals.home === null || match.goals.away === null;
                
                // Determine which team is home/away in this historical match
                const isCurrentHomeTeamPlayingHome = match.teams.home.id === actualHomeTeamId;
                const homeTeamInMatch = isCurrentHomeTeamPlayingHome 
                  ? match.teams.home 
                  : match.teams.away;
                const awayTeamInMatch = isCurrentHomeTeamPlayingHome 
                  ? match.teams.away 
                  : match.teams.home;
                const homeScoreInMatch = isCurrentHomeTeamPlayingHome 
                  ? match.goals.home 
                  : match.goals.away;
                const awayScoreInMatch = isCurrentHomeTeamPlayingHome 
                  ? match.goals.away 
                  : match.goals.home;
                
                return (
                  <div 
                    key={match.fixture.id} 
                    className="py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {/* Date and Competition */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-gray-500">
                        {new Date(match.fixture.date).toLocaleDateString('en-GB', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {match.league?.name || 'Unknown Competition'}
                      </div>
                    </div>
                    
                    {/* Teams and Score */}
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center flex-1">
                        <span className="text-sm text-gray-800 font-medium">
                          {homeTeamInMatch.name}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="mx-6 min-w-16 text-center">
                        {isScheduled ? (
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(match.fixture.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            })}
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-gray-900">
                            {homeScoreInMatch} - {awayScoreInMatch}
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-end flex-1">
                        <span className="text-sm text-gray-800 font-medium">
                          {awayTeamInMatch.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* See All Link - Enhanced */}
            {h2hData.length > 5 && (
              <div className="text-center mt-4 p-3 bg-gray-50 rounded-lg">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-2 mx-auto transition-colors">
                  <span>See All {h2hData.length} Matches</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="text-xs text-gray-500 mt-1">
                  Showing recent {recentMatches.length} meetings
                </div>
              </div>
            )}

            {/* Historical Statistics Summary */}
            {hasFinishedMatches && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-800 mb-2">All-Time Record</h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{homeWins}</div>
                    <div className="text-xs text-gray-600">{match?.teams?.home?.name || 'Home'} Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">{draws}</div>
                    <div className="text-xs text-gray-600">Draws</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{awayWins}</div>
                    <div className="text-xs text-gray-600">{match?.teams?.away?.name || 'Away'} Wins</div>
                  </div>
                </div>
                <div className="text-center mt-2 text-xs text-gray-500">
                  Total matches: {finishedMatches.length}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TopTrendsCard homeTeamId={actualHomeTeamId} awayTeamId={actualAwayTeamId} />

    </>
  );
};

// Top Trends Card Component
const TopTrendsCard: React.FC<{ homeTeamId?: number; awayTeamId?: number }> = ({ homeTeamId, awayTeamId }) => {
  const [homeStats, setHomeStats] = useState<any>(null);
  const [awayStats, setAwayStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!homeTeamId || !awayTeamId) return;

    const fetchTeamStats = async () => {
      setLoading(true);
      try {
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/teams/${homeTeamId}/statistics`),
          fetch(`/api/teams/${awayTeamId}/statistics`)
        ]);

        if (homeResponse.ok && awayResponse.ok) {
          const homeData = await homeResponse.json();
          const awayData = await awayResponse.json();
          setHomeStats(homeData);
          setAwayStats(awayData);
        }
      } catch (error) {
        console.error('Error fetching team statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, [homeTeamId, awayTeamId]);

  // Calculate trends from actual stats
  const calculateTrends = () => {
    if (!homeStats || !awayStats) return [];

    const homeGoalsPerGame = homeStats.fixtures?.played?.total 
      ? (homeStats.goals?.for?.total / homeStats.fixtures.played.total).toFixed(1)
      : "0.0";
    
    const awayGoalsPerGame = awayStats.fixtures?.played?.total 
      ? (awayStats.goals?.for?.total / awayStats.fixtures.played.total).toFixed(1)
      : "0.0";

    const homeCleanSheets = homeStats.fixtures?.played?.total 
      ? Math.round((homeStats.clean_sheet?.total || 0) / homeStats.fixtures.played.total * 100)
      : 0;
    
    const awayCleanSheets = awayStats.fixtures?.played?.total 
      ? Math.round((awayStats.clean_sheet?.total || 0) / awayStats.fixtures.played.total * 100)
      : 0;

    const homeBothTeamsScore = homeStats.fixtures?.played?.total 
      ? Math.round(((homeStats.fixtures.played.total - (homeStats.failed_to_score?.total || 0)) / homeStats.fixtures.played.total) * 100)
      : 0;
    
    const awayBothTeamsScore = awayStats.fixtures?.played?.total 
      ? Math.round(((awayStats.fixtures.played.total - (awayStats.failed_to_score?.total || 0)) / awayStats.fixtures.played.total) * 100)
      : 0;

    return [
      { label: "Goals per game", home: homeGoalsPerGame, away: awayGoalsPerGame },
      { label: "Clean sheets", home: `${homeCleanSheets}%`, away: `${awayCleanSheets}%` },
      { label: "Both teams score", home: `${homeBothTeamsScore}%`, away: `${awayBothTeamsScore}%` },
      { label: "Wins", home: homeStats.fixtures?.wins?.total || 0, away: awayStats.fixtures?.wins?.total || 0 }
    ];
  };

  const trends = calculateTrends();

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div className="text-sm">Loading team statistics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!homeStats || !awayStats || trends.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div className="text-sm">No team statistics available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

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