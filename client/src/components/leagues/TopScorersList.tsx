import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Award, TrendingUp, Rocket, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamColor } from '@/lib/colorExtractor';
import LeagueFilter from '@/components/leagues/LeagueFilter';
import { RootState } from '@/lib/store';

interface Player {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

interface PlayerStatistics {
  player: Player;
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    goals: {
      total: number;
      conceded: number;
      assists: number;
      saves: number;
    };
  }[];
}

// Default top league to show scorers for if none is selected
const DEFAULT_LEAGUE_ID = 39; // Premier League

const TopScorersList = () => {
  // Get selected league from Redux, fallback to default league
  const selectedLeague = useSelector((state: RootState) => state.ui.selectedLeague || DEFAULT_LEAGUE_ID);
  const currentSeason = useSelector((state: any) => state.ui.currentSeason || new Date().getFullYear());
  
  // Query for top scorers data
  const { data: topScorers, isLoading, error } = useQuery<PlayerStatistics[]>({
    queryKey: [`/api/leagues/${selectedLeague}/topscorers`],
    staleTime: 30 * 60 * 1000, // 30 minutes cache
  });
  
  // No longer need maxGoals calculation since progress bar was removed
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error || !topScorers || topScorers.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        <div className="flex flex-col items-center">
          <Award className="h-10 w-10 text-gray-400 mb-2" />
          <p>No top scorer data available</p>
        </div>
      </div>
    );
  }
  
  // Take only top 5 scorers
  const top5Scorers = topScorers.slice(0, 5);
  
  return (
    <div className="space-y-3">
      <LeagueFilter />
      
      {top5Scorers.map((scorer, index) => {
        const playerStats = scorer.statistics[0];
        const goals = playerStats.goals.total || 0;
        const teamColor = getTeamColor(playerStats.team.name);
        
        return (
          <div key={scorer.player.id} className="group">
            {/* Player row with hover effect */}
            <div className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50">
              {/* Rank circle */}
              <div 
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : teamColor || '#3b82f6' }}
              >
                {index + 1}
              </div>
              
              {/* Player photo */}
              <Avatar className="h-10 w-10 border-2" style={{ borderColor: teamColor || '#e5e7eb' }}>
                <AvatarImage src={scorer.player.photo} alt={scorer.player.name} />
                <AvatarFallback>{scorer.player.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              
              {/* Player details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{scorer.player.name}</div>
                  <div className="text-sm font-bold">{goals} {goals === 1 ? 'goal' : 'goals'}</div>
                </div>
                
                {/* Team name */}
                <div className="mt-1">
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    <img src={playerStats.team.logo} alt={playerStats.team.name} className="h-3.5 w-3.5 mr-1" />
                    {playerStats.team.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* See more button */}
      <div className="text-center pt-2">
        <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center mx-auto">
          <TrendingUp className="h-3 w-3 mr-1" />
          See full rankings
        </button>
      </div>
    </div>
  );
};

export default TopScorersList;