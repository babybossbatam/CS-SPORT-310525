
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyStatsTabCardProps {
  match?: any;
}

interface TeamStatistic {
  type: string;
  value: number | string;
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: TeamStatistic[];
}

// Enhanced StatRow component with circular backgrounds
const StatRowWithBars: React.FC<{
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeColor?: string;
  awayColor?: string;
}> = ({ label, homeValue, awayValue, homeColor = '#ef4444', awayColor = '#10b981' }) => {
  // Convert values to numbers for comparison
  const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue.replace('%', '')) || 0 : homeValue || 0;
  const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue.replace('%', '')) || 0 : awayValue || 0;
  
  // Determine which team has higher value
  const homeIsHigher = homeNum > awayNum;
  const awayIsHigher = awayNum > homeNum;

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-end w-12">
          <span 
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              homeIsHigher 
                ? 'bg-red-500 text-white' 
                : 'text-gray-900'
            }`}
          >
            {homeValue}
          </span>
        </div>
        
        <span className="text-sm font-semibold text-gray-700 text-center flex-1 px-4">{label}</span>
        
        <div className="flex items-center justify-start w-12">
          <span 
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              awayIsHigher 
                ? 'bg-green-500 text-white' 
                : 'text-gray-900'
            }`}
          >
            {awayValue}
          </span>
        </div>
      </div>
    </div>
  );
};

const MyStatsTabCard: React.FC<MyStatsTabCardProps> = ({ match }) => {
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!match) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            No match data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUpcoming = match.fixture?.status?.short === "NS";
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;
  const fixtureId = match.fixture?.id;

  // Fetch match statistics
  useEffect(() => {
    if (!fixtureId || isUpcoming) return;

    const fetchMatchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stats for both teams
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${homeTeam.id}`),
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${awayTeam.id}`)
        ]);

        if (!homeResponse.ok || !awayResponse.ok) {
          throw new Error('Failed to fetch match statistics');
        }

        const homeData = await homeResponse.json();
        const awayData = await awayResponse.json();

        setHomeStats(homeData[0] || null);
        setAwayStats(awayData[0] || null);
      } catch (err) {
        console.error('Error fetching match statistics:', err);
        setError('Failed to load match statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId, homeTeam?.id, awayTeam?.id, isUpcoming]);

  // Helper function to get stat value with multiple possible field names
  const getStatValue = (stats: TeamStatistic[], type: string, alternativeTypes: string[] = []): string => {
    if (!stats || !Array.isArray(stats)) return '0';
    
    // Try primary type first
    let stat = stats.find(s => s.type === type);
    
    // If not found, try alternative types
    if (!stat && alternativeTypes.length > 0) {
      for (const altType of alternativeTypes) {
        stat = stats.find(s => s.type === altType);
        if (stat) break;
      }
    }
    
    return stat && stat.value !== null && stat.value !== undefined ? String(stat.value) : '0';
  };

  // Helper function to format percentage
  const formatPercentage = (value: string): string => {
    if (!value || value === '0' || value === 'null') return '0%';
    if (value.includes('%')) return value;
    const num = parseFloat(value);
    return isNaN(num) ? '0%' : `${num}%`;
  };

  // Calculate Expected Goals (xG) using available shot statistics
  const calculateExpectedGoals = (stats: TeamStatistic[]): string => {
    if (!stats || !Array.isArray(stats)) return '0.0';
    
    const shotsOnTarget = parseInt(getStatValue(stats, 'Shots on Goal', ['Shots on target'])) || 0;
    const shotsInsideBox = parseInt(getStatValue(stats, 'Shots insidebox', ['Shots inside box'])) || 0;
    const totalShots = parseInt(getStatValue(stats, 'Total Shots', ['Total shots'])) || 0;
    const goals = parseInt(getStatValue(stats, 'Goals', ['Goal'])) || 0;
    
    // Simple xG calculation based on shot quality
    // Shots on target: 0.25 xG each
    // Shots inside box (not on target): 0.15 xG each
    // Other shots: 0.05 xG each
    
    const shotsInsideBoxNotOnTarget = Math.max(0, shotsInsideBox - shotsOnTarget);
    const shotsOutsideBox = Math.max(0, totalShots - shotsInsideBox);
    
    const xG = (shotsOnTarget * 0.25) + (shotsInsideBoxNotOnTarget * 0.15) + (shotsOutsideBox * 0.05);
    
    // Cap xG at a reasonable maximum based on actual goals + buffer
    const maxXG = Math.max(goals + 1.5, 3.0);
    const finalXG = Math.min(xG, maxXG);
    
    return finalXG.toFixed(1);
  };

  // Debug function to log available statistics (remove in production)
  const logAvailableStats = (teamName: string, stats: TeamStatistic[]) => {
    if (stats && Array.isArray(stats)) {
      console.log(`📊 [${teamName}] Available statistics:`, stats.map(s => s.type));
    }
  };

  // If it's an upcoming match, show the preview
  if (isUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="text-center text-gray-600 py-8">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-lg font-medium mb-2">Statistics Coming Soon</h3>
              <p className="text-sm text-gray-500">
                Match statistics will be available once the game starts
              </p>
            </div>

            {/* Team Comparison Preview */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-center">Team Comparison Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <img 
                    src={homeTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={homeTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{homeTeam?.name}</div>
                </div>
                <div className="text-center text-gray-500">
                  VS
                </div>
                <div className="text-center">
                  <img 
                    src={awayTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={awayTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{awayTeam?.name}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">⏳</div>
            <p>Loading match statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || !homeStats || !awayStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">❌</div>
            <p>{error || 'No statistics available for this match'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For live/finished matches, show real statistics with bars
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Match Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Team Headers */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center space-x-2">
            <img 
              src={homeTeam?.logo || "/assets/fallback-logo.png"} 
              alt={homeTeam?.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-sm font-semibold truncate max-w-20">{homeTeam?.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold truncate max-w-20">{awayTeam?.name}</span>
            <img 
              src={awayTeam?.logo || "/assets/fallback-logo.png"} 
              alt={awayTeam?.name}
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>

        {/* Statistics with bars - Real API data */}
        <div className="space-y-3">
          {/* Debug logging - remove in production */}
          {console.log('📊 [Home Team] Statistics:', homeStats.statistics)}
          {homeStats && logAvailableStats(homeTeam?.name || 'Home', homeStats.statistics)}
          {awayStats && logAvailableStats(awayTeam?.name || 'Away', awayStats.statistics)}
          
          <StatRowWithBars 
            label="Ball Possession" 
            homeValue={formatPercentage(getStatValue(homeStats.statistics, 'Ball Possession'))}
            awayValue={formatPercentage(getStatValue(awayStats.statistics, 'Ball Possession'))}
          />
          
          <StatRowWithBars 
            label="Expected Goals (xG)" 
            homeValue={calculateExpectedGoals(homeStats.statistics)}
            awayValue={calculateExpectedGoals(awayStats.statistics)}
          />
          
          <StatRowWithBars 
            label="Shots on Goal" 
            homeValue={getStatValue(homeStats.statistics, 'Shots on Goal', ['Shots on target'])}
            awayValue={getStatValue(awayStats.statistics, 'Shots on Goal', ['Shots on target'])}
          />
          
          <StatRowWithBars 
            label="Shots off Goal" 
            homeValue={getStatValue(homeStats.statistics, 'Shots off Goal', ['Shots off target'])}
            awayValue={getStatValue(awayStats.statistics, 'Shots off Goal', ['Shots off target'])}
          />
          
          <StatRowWithBars 
            label="Total Shots" 
            homeValue={getStatValue(homeStats.statistics, 'Total Shots', ['Total shots'])}
            awayValue={getStatValue(awayStats.statistics, 'Total Shots', ['Total shots'])}
          />
          
          <StatRowWithBars 
            label="Blocked Shots" 
            homeValue={getStatValue(homeStats.statistics, 'Blocked Shots', ['Blocked shots'])}
            awayValue={getStatValue(awayStats.statistics, 'Blocked Shots', ['Blocked shots'])}
          />
          
          <StatRowWithBars 
            label="Shots insidebox" 
            homeValue={getStatValue(homeStats.statistics, 'Shots insidebox', ['Shots inside box'])}
            awayValue={getStatValue(awayStats.statistics, 'Shots insidebox', ['Shots inside box'])}
          />
          
          <StatRowWithBars 
            label="Shots outsidebox" 
            homeValue={getStatValue(homeStats.statistics, 'Shots outsidebox', ['Shots outside box'])}
            awayValue={getStatValue(awayStats.statistics, 'Shots outsidebox', ['Shots outside box'])}
          />
          
          <StatRowWithBars 
            label="Fouls" 
            homeValue={getStatValue(homeStats.statistics, 'Fouls')}
            awayValue={getStatValue(awayStats.statistics, 'Fouls')}
          />
          
          <StatRowWithBars 
            label="Corner Kicks" 
            homeValue={getStatValue(homeStats.statistics, 'Corner Kicks', ['Corners'])}
            awayValue={getStatValue(awayStats.statistics, 'Corner Kicks', ['Corners'])}
          />
          
          <StatRowWithBars 
            label="Offsides" 
            homeValue={getStatValue(homeStats.statistics, 'Offsides', ['Offside'])}
            awayValue={getStatValue(awayStats.statistics, 'Offsides', ['Offside'])}
          />
          
          <StatRowWithBars 
            label="Yellow Cards" 
            homeValue={getStatValue(homeStats.statistics, 'Yellow Cards')}
            awayValue={getStatValue(awayStats.statistics, 'Yellow Cards')}
          />
          
          <StatRowWithBars 
            label="Red Cards" 
            homeValue={getStatValue(homeStats.statistics, 'Red Cards')}
            awayValue={getStatValue(awayStats.statistics, 'Red Cards')}
          />
          
          <StatRowWithBars 
            label="Goalkeeper Saves" 
            homeValue={getStatValue(homeStats.statistics, 'Goalkeeper Saves', ['Saves'])}
            awayValue={getStatValue(awayStats.statistics, 'Goalkeeper Saves', ['Saves'])}
          />
          
          <StatRowWithBars 
            label="Total passes" 
            homeValue={getStatValue(homeStats.statistics, 'Total passes', ['Passes'])}
            awayValue={getStatValue(awayStats.statistics, 'Total passes', ['Passes'])}
          />
          
          <StatRowWithBars 
            label="Passes accurate" 
            homeValue={getStatValue(homeStats.statistics, 'Passes accurate', ['Accurate passes'])}
            awayValue={getStatValue(awayStats.statistics, 'Passes accurate', ['Accurate passes'])}
          />
          
          <StatRowWithBars 
            label="Passes %" 
            homeValue={formatPercentage(getStatValue(homeStats.statistics, 'Passes %', ['Pass accuracy']))}
            awayValue={formatPercentage(getStatValue(awayStats.statistics, 'Passes %', ['Pass accuracy']))}
          />
        </div>

        {/* Success message */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-xs text-green-700">
          <p>✅ Now using real-time match statistics from the API!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyStatsTabCard;
