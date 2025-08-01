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
    if (!actualHomeTeamId || !actualAwayTeamId) return;

    const fetchH2HData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔍 [H2H] Fetching head-to-head data for teams: ${actualHomeTeamId} vs ${actualAwayTeamId}`);
        
        const response = await fetch(`/api/fixtures/headtohead?h2h=${actualHomeTeamId}-${actualAwayTeamId}&last=10`);
        
        console.log(`📡 [H2H] Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`❌ [H2H] API Error:`, errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`📊 [H2H] Raw API Response:`, data);

        const fixtures = data?.response || [];
        console.log(`✅ [H2H] Found ${fixtures.length} head-to-head matches`);
        
        setH2hData(fixtures);
      } catch (err) {
        console.error('❌ [H2H] Error:', err);
        setError(`Failed to load head-to-head data: ${err.message}`);
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
            <p className="text-sm text-red-600">{error}</p>
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
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">No head-to-head data available</p>
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
          {/* Statistics Summary - Only show if there are finished matches */}
          {finishedMatches.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{homeWins}</div>
                <div className="text-gray-500">Wins</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">{draws}</div>
                <div className="text-gray-500">Draws</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{awayWins}</div>
                <div className="text-gray-500">Wins</div>
              </div>
            </div>
          )}

          {finishedMatches.length === 0 && h2hData.length > 0 && (
            <div className="text-center text-gray-500 mb-4">
              <div className="text-sm">No completed matches found</div>
              <div className="text-xs">Showing upcoming fixtures</div>
            </div>
          )}

          {/* Recent Matches */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Matches</h4>
            {recentMatches.map((match, index) => (
              <div key={match.fixture.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-2 flex-1">
                  <img 
                    src={match.teams.home.logo} 
                    alt={match.teams.home.name}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs text-gray-700 truncate">
                    {match.teams.home.name}
                  </span>
                </div>

                <div className="flex flex-col items-center space-y-1 mx-4">
                  <span className="text-xs font-medium">
                    {match.goals.home !== null && match.goals.away !== null 
                      ? `${match.goals.home} - ${match.goals.away}` 
                      : match.fixture?.status?.short === 'NS' ? 'vs' : match.fixture?.status?.short
                    }
                  </span>
                  {match.fixture?.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(match.fixture.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-1 justify-end">
                  <span className="text-xs text-gray-700 truncate">
                    {match.teams.away.name}
                  </span>
                  <img 
                    src={match.teams.away.logo} 
                    alt={match.teams.away.name}
                    className="w-4 h-4 object-contain"
                  />
                </div>
              </div>
            ))}
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