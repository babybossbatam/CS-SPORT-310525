
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  const homeTeam = match?.teams?.home;
  const awayTeam = match?.teams?.away;

  useEffect(() => {
    if (!actualHomeTeamId || !actualAwayTeamId) return;

    const fetchH2HData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/fixtures/headtohead/${actualHomeTeamId}-${actualAwayTeamId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch head-to-head data');
        }

        const data = await response.json();
        setH2hData(data?.response || []);
      } catch (err) {
        console.error('Error fetching H2H data:', err);
        setError('Failed to load head-to-head data');
      } finally {
        setLoading(false);
      }
    };

    fetchH2HData();
  }, [actualHomeTeamId, actualAwayTeamId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm">Loading head-to-head data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !h2hData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">{error || 'No head-to-head data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const homeWins = h2hData.filter(match => 
    (match.teams.home.id === actualHomeTeamId && match.goals.home > match.goals.away) ||
    (match.teams.away.id === actualHomeTeamId && match.goals.away > match.goals.home)
  ).length;

  const awayWins = h2hData.filter(match => 
    (match.teams.home.id === actualAwayTeamId && match.goals.home > match.goals.away) ||
    (match.teams.away.id === actualAwayTeamId && match.goals.away > match.goals.home)
  ).length;

  const draws = h2hData.filter(match => match.goals.home === match.goals.away).length;

  // Get the most recent match for displaying match info
  const recentMatch = h2hData[0];
  const matchDate = match?.fixture?.date ? new Date(match.fixture.date).toLocaleDateString() : '';
  const competition = match?.league?.name || 'Competition';

  return (
    <Card>
      <CardContent className="p-6">
        {/* Team Logos and Names */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center">
            <img 
              src={homeTeam?.logo} 
              alt={homeTeam?.name}
              className="w-16 h-16 object-contain mb-2"
            />
            <h3 className="text-sm font-medium text-center">{homeTeam?.name}</h3>
          </div>
          
          <div className="flex flex-col items-center">
            <img 
              src={awayTeam?.logo} 
              alt={awayTeam?.name}
              className="w-16 h-16 object-contain mb-2"
            />
            <h3 className="text-sm font-medium text-center">{awayTeam?.name}</h3>
          </div>
        </div>

        {/* Statistics - Wins, Draws, Wins */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{homeWins}</div>
              <div className="text-sm text-gray-500">Wins</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{draws}</div>
              <div className="text-sm text-gray-500">Draws</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{awayWins}</div>
              <div className="text-sm text-gray-500">Wins</div>
            </div>
          </div>
        </div>

        {/* Match Date and Competition */}
        <div className="text-center border-t pt-4">
          <div className="text-sm text-gray-600 mb-1">{matchDate}</div>
          <div className="text-sm text-gray-500">{competition}</div>
          <div className="flex items-center justify-center mt-2">
            <span className="text-lg font-medium">
              {homeTeam?.name} vs {awayTeam?.name}
            </span>
          </div>
        </div>

        {/* Total matches info */}
        <div className="text-center mt-3 text-xs text-gray-400">
          Based on {h2hData.length} previous meetings
        </div>
      </CardContent>
    </Card>
  );
};

export default MyH2HNew;
