
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp } from 'lucide-react';
import { CardContent } from "@/components/ui/card";

// Popular leagues for top scorers
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
];

interface Player {
  id: number;
  name: string;
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
      position: string;
    };
    goals: {
      total: number;
    };
  }[];
}

const HomeTopScorersList = () => {
  const [, navigate] = useLocation();

  const { data: topScorers, isLoading } = useQuery({
    queryKey: [`/api/leagues/${POPULAR_LEAGUES[0]}/topscorers`],
    staleTime: 30 * 60 * 1000,
    select: (data: PlayerStatistics[]) => {
      return data.sort((a, b) => {
        const goalsA = a.statistics[0]?.goals?.total || 0;
        const goalsB = b.statistics[0]?.goals?.total || 0;
        return goalsB - goalsA;
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-32 bg-gray-200 animate-pulse" />
              <div className="h-3 w-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!topScorers || topScorers.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        <p>Loading top scorers...</p>
      </div>
    );
  }

  return (
    <CardContent className="space-y-2">
      {topScorers.slice(0, 3).map((scorer, index) => {
        const playerStats = scorer.statistics[0];
        const goals = playerStats.goals.total || 0;

        return (
          <div key={scorer.player.id} className="group">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={scorer.player.photo} alt={scorer.player.name} />
                  <AvatarFallback>{scorer.player.name.slice(0, 2)}</AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{scorer.player.name}</span>
                    <span className="text-sm text-gray-600">{playerStats.games.position}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {playerStats.team.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-xl">{goals}</span>
                <span className="text-sm text-gray-500">Goals</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-center pt-2">
        <button 
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center mx-auto"
          onClick={() => navigate(`/league/${POPULAR_LEAGUES[0]}/stats`)}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          See full rankings
        </button>
      </div>
    </CardContent>
  );
};

export default HomeTopScorersList;
