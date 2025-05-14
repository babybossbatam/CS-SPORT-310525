
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { Award, TrendingUp, Rocket, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamColor } from '@/lib/colorUtils';
import LeagueFilter from '@/components/leagues/LeagueFilter';
import { RootState } from '@/lib/store';
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
  88,  // Eredivisie
  94,  // Primeira Liga
  203, // Super Lig
];

// Excluded competitions
const EXCLUDED_COMPETITIONS = [
  45,  // FA Cup
  48,  // Community Shield
  46,  // EFL Cup
  49,  // EFL Trophy
  528, // Copa del Rey
  137, // Coppa Italia
  81,  // DFB Pokal
  66,  // Coupe de France
];

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

interface TopScorersListProps {
  leagueId?: number;
}

const TopScorersList = ({ leagueId }: TopScorersListProps) => {
  const [, navigate] = useLocation();

  const { data: topScorers, isLoading } = useQuery({
    queryKey: [`/api/leagues/${leagueId}/topscorers`],
    enabled: !!leagueId,
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    select: (data: PlayerStatistics[]) => {
      // Filter out players from excluded competitions
      const filteredScorers = data.filter(scorer => {
        const leagueId = scorer.statistics[0]?.league?.id;
        // If no league ID specified, show only popular leagues
        if (!leagueId) {
          return POPULAR_LEAGUES.includes(leagueId);
        }
        // Otherwise check if it's not in excluded list
        return !EXCLUDED_COMPETITIONS.includes(leagueId);
      });

      // Sort by goals scored
      return filteredScorers.sort((a, b) => {
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
        <p>No top scorer data available</p>
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
                    <span className="text-sm text-gray-600">{scorer.player.position}</span>
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

      {leagueId && (
        <div className="text-center pt-2">
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center mx-auto"
            onClick={() => navigate(`/league/${leagueId}/stats`)}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            See full rankings
          </button>
        </div>
      )}
    </CardContent>
  );
};

export default TopScorersList;
