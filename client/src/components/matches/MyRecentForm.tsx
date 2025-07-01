
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamInfo {
  id?: number;
  name: string;
  logo: string;
}

interface FormMatch {
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  isHome: boolean;
}

interface TeamForm {
  teamId: number;
  teamName: string;
  recentMatches: FormMatch[];
  formString: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
}

interface MyRecentFormProps {
  homeTeam?: TeamInfo;
  awayTeam?: TeamInfo;
  leagueId?: number;
  season?: number;
  match?: any; // Accept match data directly like MyMatchdetailsScoreboard
}

const MyRecentForm: React.FC<MyRecentFormProps> = ({
  homeTeam,
  awayTeam,
  leagueId,
  season,
  match,
}) => {
  // Extract team data from match prop if available, otherwise use individual props
  const effectiveHomeTeam = match ? {
    id: match.teams?.home?.id,
    name: match.teams?.home?.name || 'Unknown',
    logo: match.teams?.home?.logo || '/assets/fallback-logo.svg'
  } : homeTeam;
  
  const effectiveAwayTeam = match ? {
    id: match.teams?.away?.id,
    name: match.teams?.away?.name || 'Unknown',
    logo: match.teams?.away?.logo || '/assets/fallback-logo.svg'
  } : awayTeam;
  
  const effectiveLeagueId = match ? match.league?.id : leagueId;
  const effectiveSeason = match ? match.league?.season : season;
  const [isLoading, setIsLoading] = useState(true);
  const [homeForm, setHomeForm] = useState<TeamForm | null>(null);
  const [awayForm, setAwayForm] = useState<TeamForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamForm = async () => {
      if (!effectiveHomeTeam?.id || !effectiveAwayTeam?.id) {
        console.log('⚠️ [MyRecentForm] Missing team IDs, using fallback data');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch recent fixtures for both teams
        const [homeFixtures, awayFixtures] = await Promise.all([
          fetch(`/api/teams/${effectiveHomeTeam.id}/fixtures?last=5&league=${effectiveLeagueId}&season=${effectiveSeason || new Date().getFullYear()}`),
          fetch(`/api/teams/${effectiveAwayTeam.id}/fixtures?last=5&league=${effectiveLeagueId}&season=${effectiveSeason || new Date().getFullYear()}`)
        ]);

        let homeFormData: TeamForm | null = null;
        let awayFormData: TeamForm | null = null;

        // Process home team form
        if (homeFixtures.ok) {
          const homeData = await homeFixtures.json();
          if (homeData?.response) {
            homeFormData = processTeamFixtures(homeData.response, effectiveHomeTeam.id, effectiveHomeTeam.name);
          }
        }

        // Process away team form
        if (awayFixtures.ok) {
          const awayData = await awayFixtures.json();
          if (awayData?.response) {
            awayFormData = processTeamFixtures(awayData.response, effectiveAwayTeam.id, effectiveAwayTeam.name);
          }
        }

        setHomeForm(homeFormData);
        setAwayForm(awayFormData);

      } catch (err) {
        console.error('❌ [MyRecentForm] Error fetching form data:', err);
        setError('Failed to load recent form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamForm();
  }, [effectiveHomeTeam?.id, effectiveAwayTeam?.id, effectiveLeagueId, effectiveSeason]);

  const processTeamFixtures = (fixtures: any[], teamId: number, teamName: string): TeamForm => {
    const recentMatches: FormMatch[] = [];
    let wins = 0, draws = 0, losses = 0;

    // Take last 5 completed matches
    const completedFixtures = fixtures
      .filter(f => f.fixture?.status?.short === 'FT')
      .slice(-5);

    completedFixtures.forEach(fixture => {
      const isHome = fixture.teams?.home?.id === teamId;
      const homeScore = fixture.goals?.home || 0;
      const awayScore = fixture.goals?.away || 0;
      const opponent = isHome ? fixture.teams?.away?.name : fixture.teams?.home?.name;

      let result: 'W' | 'D' | 'L';
      if (homeScore === awayScore) {
        result = 'D';
        draws++;
      } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        result = 'W';
        wins++;
      } else {
        result = 'L';
        losses++;
      }

      recentMatches.push({
        date: fixture.fixture?.date,
        opponent: opponent || 'Unknown',
        result,
        score: `${homeScore}-${awayScore}`,
        isHome
      });
    });

    const formString = recentMatches.map(m => m.result).join('');
    const points = wins * 3 + draws;

    return {
      teamId,
      teamName,
      recentMatches: recentMatches.reverse(), // Most recent first
      formString,
      points,
      wins,
      draws,
      losses
    };
  };

  const getResultBadgeColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      case 'L': return 'bg-red-500 text-white';
    }
  };

  const getFormTrend = (form: TeamForm) => {
    if (!form.recentMatches.length) return { icon: Minus, color: 'text-gray-500' };
    
    const recentResults = form.recentMatches.slice(0, 3);
    const wins = recentResults.filter(m => m.result === 'W').length;
    const losses = recentResults.filter(m => m.result === 'L').length;
    
    if (wins > losses) return { icon: TrendingUp, color: 'text-green-500' };
    if (losses > wins) return { icon: TrendingDown, color: 'text-red-500' };
    return { icon: Minus, color: 'text-yellow-500' };
  };

  if (!effectiveHomeTeam || !effectiveAwayTeam) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Recent Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-gray-500">Team data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            Recent Form
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading form data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Recent Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const homeTrend = homeForm ? getFormTrend(homeForm) : { icon: Minus, color: 'text-gray-500' };
  const awayTrend = awayForm ? getFormTrend(awayForm) : { icon: Minus, color: 'text-gray-500' };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Recent Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Home Team Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img 
                  src={
                    effectiveHomeTeam?.id
                      ? `/api/team-logo/square/${effectiveHomeTeam.id}?size=24`
                      : effectiveHomeTeam?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={effectiveHomeTeam?.name} 
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}  
                />
                <span className="font-medium text-sm">{effectiveHomeTeam?.name}</span>
                <homeTrend.icon className={`h-4 w-4 ${homeTrend.color}`} />
              </div>
              <div className="text-xs text-gray-500">
                {homeForm ? `${homeForm.points} pts` : 'N/A'}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {homeForm?.recentMatches.length ? (
                homeForm.recentMatches.map((match, index) => (
                  <Badge 
                    key={index}
                    className={`${getResultBadgeColor(match.result)} text-xs px-2 py-1`}
                    title={`${match.result} vs ${match.opponent} (${match.score})`}
                  >
                    {match.result}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500">No recent matches</span>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200"></div>

          {/* Away Team Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img 
                  src={
                    effectiveAwayTeam?.id
                      ? `/api/team-logo/square/${effectiveAwayTeam.id}?size=24`
                      : effectiveAwayTeam?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={effectiveAwayTeam?.name} 
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}  
                />
                <span className="font-medium text-sm">{effectiveAwayTeam?.name}</span>
                <awayTrend.icon className={`h-4 w-4 ${awayTrend.color}`} />
              </div>
              <div className="text-xs text-gray-500">
                {awayForm ? `${awayForm.points} pts` : 'N/A'}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {awayForm?.recentMatches.length ? (
                awayForm.recentMatches.map((match, index) => (
                  <Badge 
                    key={index}
                    className={`${getResultBadgeColor(match.result)} text-xs px-2 py-1`}
                    title={`${match.result} vs ${match.opponent} (${match.score})`}
                  >
                    {match.result}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-500">No recent matches</span>
              )}
            </div>
          </div>

          {/* Form Summary */}
          {(homeForm || awayForm) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-md">
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Last 5 Matches</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">{effectiveHomeTeam?.name}:</span> {homeForm?.wins || 0}W {homeForm?.draws || 0}D {homeForm?.losses || 0}L
                  </div>
                  <div>
                    <span className="font-medium">{effectiveAwayTeam?.name}:</span> {awayForm?.wins || 0}W {awayForm?.draws || 0}D {awayForm?.losses || 0}L
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyRecentForm;
