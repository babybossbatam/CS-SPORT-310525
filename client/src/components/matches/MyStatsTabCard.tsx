import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import MyStats from './MyStats';

interface MyStatsTabCardProps {
  match?: any;
  onTabChange?: (tab: string) => void;
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

interface MyShotsProps {
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  homeTeam: any;
  awayTeam: any;
}

// StatRowWithBars component for MyShots
interface StatRowWithBarsProps {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeTeam?: any;
  awayTeam?: any;
}

const StatRowWithBars: React.FC<StatRowWithBarsProps> = ({ 
  label, 
  homeValue, 
  awayValue, 
  homeTeam, 
  awayTeam 
}) => {
  const homeNum = parseFloat(String(homeValue)) || 0;
  const awayNum = parseFloat(String(awayValue)) || 0;
  const total = homeNum + awayNum;
  
  const homePercentage = total > 0 ? (homeNum / total) * 100 : 50;
  const awayPercentage = total > 0 ? (awayNum / total) * 100 : 50;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      {/* Home team value and logo */}
      <div className="flex items-center space-x-2 w-16 justify-end">
        <span className="text-sm font-medium">{homeValue}</span>
        {homeTeam?.logo && (
          <img 
            src={homeTeam.logo} 
            alt={homeTeam.name}
            className="w-4 h-4 object-contain"
          />
        )}
      </div>

      {/* Center section with bars and label */}
      <div className="flex-1 mx-4">
        <div className="text-xs text-center text-gray-600 mb-1">{label}</div>
        <div className="flex items-center h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${homePercentage}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${awayPercentage}%` }}
          />
        </div>
      </div>

      {/* Away team logo and value */}
      <div className="flex items-center space-x-2 w-16">
        {awayTeam?.logo && (
          <img 
            src={awayTeam.logo} 
            alt={awayTeam.name}
            className="w-4 h-4 object-contain"
          />
        )}
        <span className="text-sm font-medium">{awayValue}</span>
      </div>
    </div>
  );
};

// New MyShots Component
const MyShots: React.FC<MyShotsProps> = ({ homeStats, awayStats, homeTeam, awayTeam }) => {
  const getStatValue = (stats: TeamStats | null, type: string, alternatives: string[] = []): string => {
    // First try the exact type
    let stat = stats?.statistics.find((s) => s.type === type);
    
    // If not found, try alternatives
    if (!stat && alternatives.length > 0) {
      for (const alt of alternatives) {
        stat = stats?.statistics.find((s) => s.type === alt);
        if (stat) break;
      }
    }
    
    return stat ? String(stat.value) : '0';
  };

  return (
    <div className="space-y-0">
      <StatRowWithBars 
        label="Blocked Shots" 
        homeValue={getStatValue(homeStats, 'Blocked Shots', ['Blocked shots'])}
        awayValue={getStatValue(awayStats, 'Blocked Shots', ['Blocked shots'])}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
      
      <StatRowWithBars 
        label="Shots Inside Box" 
        homeValue={getStatValue(homeStats, 'Shots insidebox', ['Shots inside box'])}
        awayValue={getStatValue(awayStats, 'Shots insidebox', ['Shots inside box'])}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
      
      <StatRowWithBars 
        label="Shots Outside Box" 
        homeValue={getStatValue(homeStats, 'Shots outsidebox', ['Shots outside box'])}
        awayValue={getStatValue(awayStats, 'Shots outsidebox', ['Shots outside box'])}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
    </div>
  );
};


const MyStatsTabCard: React.FC<MyStatsTabCardProps> = ({ match, onTabChange }) => {
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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



  // If it's an upcoming match, show the preview
  if (isUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="">
            <div className="text-center text-gray-600">
              <div className="text-4xl ">📊</div>
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
          <CardTitle className="text-center">Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 ">
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
          <CardTitle className="text-center">Stats</CardTitle>
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
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent className="">
        <Card>
          <CardContent className="p-4">
            <MyStats
              homeStats={homeStats}
              awayStats={awayStats}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              isExpanded={isExpanded}
              onToggleExpanded={() => {
                // Always ensure Stats tab is active first - this will hide MyMatchTabCard and show MyStatsTabCard
                if (onTabChange) {
                  onTabChange('stats');
                }

                // Always expand when "See All" is clicked to show all statistics
                setIsExpanded(true);
              }}
            />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Shot Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <MyShots
              homeStats={homeStats}
              awayStats={awayStats}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default MyStatsTabCard;