
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MyAvatarInfo from '@/components/matches/MyAvatarInfo';

interface TopScorer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
      date: string;
      place: string;
      country: string;
    };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
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
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    substitutes: {
      in: number;
      out: number;
      bench: number;
    };
    shots: {
      total: number;
      on: number;
    };
    goals: {
      total: number;
      conceded: number;
      assists: number;
      saves: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: number;
    };
    tackles: {
      total: number;
      blocks: number;
      interceptions: number;
    };
    duels: {
      total: number;
      won: number;
    };
    dribbles: {
      attempts: number;
      success: number;
      past: number;
    };
    fouls: {
      drawn: number;
      committed: number;
    };
    cards: {
      yellow: number;
      yellowred: number;
      red: number;
    };
    penalty: {
      won: number;
      commited: number;
      scored: number;
      missed: number;
      saved: number;
    };
  }>;
}

const MyBasketTopScorer: React.FC = () => {
  const { data: topScorers, isLoading, error } = useQuery({
    queryKey: ['basket-top-scorers'],
    queryFn: async () => {
      // Using mock data since basketball API doesn't have top scorers endpoint
      // You can replace this with actual API call when available
      const mockTopScorers = [
        {
          player: {
            id: 1,
            name: "LeBron James",
            photo: "https://media.api-sports.io/basketball/players/1.png"
          },
          statistics: [{
            team: { name: "Los Angeles Lakers" },
            goals: { total: 28 }
          }]
        },
        {
          player: {
            id: 2,
            name: "Stephen Curry",
            photo: "https://media.api-sports.io/basketball/players/2.png"
          },
          statistics: [{
            team: { name: "Golden State Warriors" },
            goals: { total: 26 }
          }]
        },
        {
          player: {
            id: 3,
            name: "Kevin Durant",
            photo: "https://media.api-sports.io/basketball/players/3.png"
          },
          statistics: [{
            team: { name: "Phoenix Suns" },
            goals: { total: 25 }
          }]
        }
      ];
      
      return mockTopScorers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Scorers - Basketball</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !topScorers?.length) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Scorers - Basketball</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">No basketball scoring data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">Top Scorers - Basketball</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topScorers.slice(0, 5).map((scorer: TopScorer, index: number) => {
          const stats = scorer.statistics[0];
          const goals = stats?.goals?.total || 0;
          
          return (
            <div key={scorer.player.id} className="flex items-center space-x-3 hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-xs font-medium text-gray-500 w-4">
                  {index + 1}
                </span>
                <MyAvatarInfo
                  playerId={scorer.player.id}
                  playerName={scorer.player.name}
                  size="small"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {scorer.player.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stats?.team?.name || 'Unknown Team'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">
                {goals}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyBasketTopScorer;
