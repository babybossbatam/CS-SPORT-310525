
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';

interface StandingTeam {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  standings: StandingTeam[][];
}

const basketballLeagues = [
  { id: 12, name: 'NBA', country: 'USA' },
  { id: 120, name: 'EuroLeague', country: 'Europe' },
  { id: 127, name: 'Liga ACB', country: 'Spain' },
  { id: 133, name: 'Lega Basket Serie A', country: 'Italy' },
  { id: 132, name: 'Bundesliga', country: 'Germany' },
];

const MyBasketStandings: React.FC = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(12); // Default to NBA

  const { data: standings, isLoading, error } = useQuery({
    queryKey: ['basket-standings', selectedLeagueId],
    queryFn: async () => {
      // Using mock data since basketball API doesn't have standings endpoint
      // You can replace this with actual API call when available
      const mockStandings = [
        {
          rank: 1,
          team: { id: 145, name: "Los Angeles Lakers", logo: "https://media.api-sports.io/basketball/teams/145.png" },
          all: { played: 25, win: 18, lose: 7 },
          points: 36
        },
        {
          rank: 2,
          team: { id: 149, name: "Golden State Warriors", logo: "https://media.api-sports.io/basketball/teams/149.png" },
          all: { played: 25, win: 17, lose: 8 },
          points: 34
        },
        {
          rank: 3,
          team: { id: 150, name: "Boston Celtics", logo: "https://media.api-sports.io/basketball/teams/150.png" },
          all: { played: 25, win: 16, lose: 9 },
          points: 32
        },
        {
          rank: 4,
          team: { id: 155, name: "Chicago Bulls", logo: "https://media.api-sports.io/basketball/teams/155.png" },
          all: { played: 25, win: 15, lose: 10 },
          points: 30
        },
        {
          rank: 5,
          team: { id: 142, name: "Miami Heat", logo: "https://media.api-sports.io/basketball/teams/142.png" },
          all: { played: 25, win: 14, lose: 11 },
          points: 28
        }
      ];
      
      return [mockStandings];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!selectedLeagueId,
  });

  const selectedLeague = basketballLeagues.find(league => league.id === selectedLeagueId);

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">League Standings</CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 py-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !standings?.length) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Basketball Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">No basketball standings available</p>
        </CardContent>
      </Card>
    );
  }

  const currentStandings = standings[0] || [];

  return (
    <Card className="w-full shadow-md bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-800">
            Basketball Standings
          </CardTitle>
          <Select 
            value={selectedLeagueId.toString()} 
            onValueChange={(value) => setSelectedLeagueId(parseInt(value))}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {basketballLeagues.map((league) => (
                <SelectItem key={league.id} value={league.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">{league.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center text-xs text-gray-500 font-medium py-1 border-b">
          <span className="w-8">#</span>
          <span className="w-8"></span>
          <span className="flex-1">Team</span>
          <span className="w-8">P</span>
          <span className="w-8">W</span>
          <span className="w-8">L</span>
          <span className="w-12">Pts</span>
        </div>
        {currentStandings.slice(0, 10).map((team: StandingTeam) => (
          <div key={team.team.id} className="flex items-center text-xs py-1 hover:bg-gray-50 rounded">
            <span className="w-8 font-medium text-gray-700">
              {team.rank}
            </span>
            <div className="w-8">
              <MyWorldTeamLogo 
                teamId={team.team.id}
                teamName={team.team.name}
                logoUrl={team.team.logo}
                size="xs"
              />
            </div>
            <span className="flex-1 font-medium text-gray-900 truncate">
              {team.team.name}
            </span>
            <span className="w-8 text-gray-600">{team.all.played}</span>
            <span className="w-8 text-green-600 font-medium">{team.all.win}</span>
            <span className="w-8 text-red-600 font-medium">{team.all.lose}</span>
            <span className="w-12 font-bold text-gray-900">{team.points}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MyBasketStandings;
