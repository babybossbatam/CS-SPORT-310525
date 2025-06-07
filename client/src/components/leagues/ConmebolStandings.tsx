
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Globe } from 'lucide-react';

interface ConmebolTeam {
  rank: number;
  team: {
    id: number;
    name: string;
    flag: string;
    logo: string;
  };
  qualificationStatus: string;
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    }
  };
  form: string;
  nextOpponent?: {
    flag: string;
    name: string;
  };
}

const CONMEBOL_STANDINGS: ConmebolTeam[] = [
  {
    rank: 1,
    team: {
      id: 26,
      name: 'Argentina',
      flag: 'https://media.api-sports.io/flags/ar.svg',
      logo: 'https://media.api-sports.io/football/teams/26.png'
    },
    qualificationStatus: 'FIFA World Cup 2026',
    points: 34,
    goalsDiff: 19,
    all: {
      played: 15,
      win: 11,
      draw: 1,
      lose: 3,
      goals: { for: 27, against: 8 }
    },
    form: 'WWWWL',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/co.svg', name: 'Colombia' }
  },
  {
    rank: 2,
    team: {
      id: 2382,
      name: 'Ecuador',
      flag: 'https://media.api-sports.io/flags/ec.svg',
      logo: 'https://media.api-sports.io/football/teams/2382.png'
    },
    qualificationStatus: '',
    points: 24,
    goalsDiff: 8,
    all: {
      played: 15,
      win: 7,
      draw: 6,
      lose: 2,
      goals: { for: 13, against: 5 }
    },
    form: 'DDWWW',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/pe.svg', name: 'Peru' }
  },
  {
    rank: 3,
    team: {
      id: 2383,
      name: 'Paraguay',
      flag: 'https://media.api-sports.io/flags/py.svg',
      logo: 'https://media.api-sports.io/football/teams/2383.png'
    },
    qualificationStatus: '',
    points: 24,
    goalsDiff: 4,
    all: {
      played: 15,
      win: 6,
      draw: 6,
      lose: 3,
      goals: { for: 13, against: 9 }
    },
    form: 'WDWDW',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/br.svg', name: 'Brazil' }
  },
  {
    rank: 4,
    team: {
      id: 6,
      name: 'Brazil',
      flag: 'https://media.api-sports.io/flags/br.svg',
      logo: 'https://media.api-sports.io/football/teams/6.png'
    },
    qualificationStatus: '',
    points: 22,
    goalsDiff: 4,
    all: {
      played: 15,
      win: 6,
      draw: 4,
      lose: 5,
      goals: { for: 20, against: 16 }
    },
    form: 'DLWDD',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/eg.svg', name: 'Egypt' }
  },
  {
    rank: 5,
    team: {
      id: 7,
      name: 'Uruguay',
      flag: 'https://media.api-sports.io/flags/uy.svg',
      logo: 'https://media.api-sports.io/football/teams/7.png'
    },
    qualificationStatus: '',
    points: 21,
    goalsDiff: 5,
    all: {
      played: 15,
      win: 5,
      draw: 6,
      lose: 4,
      goals: { for: 17, against: 12 }
    },
    form: 'LDLDW',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/co.svg', name: 'Colombia' }
  },
  {
    rank: 6,
    team: {
      id: 8,
      name: 'Colombia',
      flag: 'https://media.api-sports.io/flags/co.svg',
      logo: 'https://media.api-sports.io/football/teams/8.png'
    },
    qualificationStatus: '',
    points: 21,
    goalsDiff: 4,
    all: {
      played: 15,
      win: 5,
      draw: 6,
      lose: 4,
      goals: { for: 18, against: 14 }
    },
    form: 'DDLLL',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/ar.svg', name: 'Argentina' }
  },
  {
    rank: 7,
    team: {
      id: 2384,
      name: 'Venezuela',
      flag: 'https://media.api-sports.io/flags/ve.svg',
      logo: 'https://media.api-sports.io/football/teams/2384.png'
    },
    qualificationStatus: '',
    points: 18,
    goalsDiff: -2,
    all: {
      played: 15,
      win: 4,
      draw: 6,
      lose: 5,
      goals: { for: 15, against: 17 }
    },
    form: 'WWLLD',
    nextOpponent: { flag: 'https://media.api-sports.io/flags/uy.svg', name: 'Uruguay' }
  }
];

const ConmebolStandings: React.FC = () => {
  const getQualificationColor = (rank: number) => {
    if (rank <= 6) return '#4CAF50'; // Direct qualification (green)
    if (rank === 7) return '#FF9800'; // Playoff (orange)
    return '#f44336'; // Eliminated (red)
  };

  const getQualificationText = (rank: number) => {
    if (rank <= 6) return 'Direct Qualification';
    if (rank === 7) return 'Intercontinental Playoff';
    return 'Eliminated';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            CONMEBOL WC Qualification
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            2026 World Cup
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="min-w-[200px]">Team</TableHead>
                <TableHead className="w-12 text-center">P</TableHead>
                <TableHead className="w-16 text-center">F:A</TableHead>
                <TableHead className="w-12 text-center">+/-</TableHead>
                <TableHead className="w-12 text-center font-bold">PTS</TableHead>
                <TableHead className="w-12 text-center">W</TableHead>
                <TableHead className="w-12 text-center">D</TableHead>
                <TableHead className="w-12 text-center">L</TableHead>
                <TableHead className="w-20 text-center">Form</TableHead>
                <TableHead className="w-16 text-center">Next</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONMEBOL_STANDINGS.map((team) => (
                <TableRow 
                  key={team.team.id}
                  className="hover:bg-gray-50/50 transition-colors border-b"
                >
                  {/* Rank with colored indicator */}
                  <TableCell className="relative text-center font-bold">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: getQualificationColor(team.rank) }}
                    />
                    <span
                      style={{ color: getQualificationColor(team.rank) }}
                    >
                      {team.rank}
                    </span>
                  </TableCell>

                  {/* Team with flag and qualification status */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={team.team.flag} 
                        alt={team.team.name}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = team.team.logo;
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{team.team.name}</span>
                        {team.qualificationStatus && (
                          <span className="text-xs text-blue-600 font-medium">
                            {team.qualificationStatus}
                          </span>
                        )}
                        {!team.qualificationStatus && team.rank <= 7 && (
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getQualificationColor(team.rank) }}
                          >
                            {getQualificationText(team.rank)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="text-center text-sm">
                    {team.all.played}
                  </TableCell>

                  {/* Goals For:Against */}
                  <TableCell className="text-center text-sm">
                    {team.all.goals.for}:{team.all.goals.against}
                  </TableCell>

                  {/* Goal Difference */}
                  <TableCell className="text-center text-sm font-medium">
                    <span className={team.goalsDiff > 0 ? 'text-green-600' : team.goalsDiff < 0 ? 'text-red-600' : ''}>
                      {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                    </span>
                  </TableCell>

                  {/* Points */}
                  <TableCell className="text-center font-bold text-sm">
                    {team.points}
                  </TableCell>

                  {/* Wins */}
                  <TableCell className="text-center text-sm">
                    {team.all.win}
                  </TableCell>

                  {/* Draws */}
                  <TableCell className="text-center text-sm">
                    {team.all.draw}
                  </TableCell>

                  {/* Losses */}
                  <TableCell className="text-center text-sm">
                    {team.all.lose}
                  </TableCell>

                  {/* Form */}
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      {team.form.split('').map((result, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            result === 'W' ? 'bg-green-500' :
                            result === 'D' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Next Opponent */}
                  <TableCell className="text-center">
                    {team.nextOpponent && (
                      <img 
                        src={team.nextOpponent.flag} 
                        alt={team.nextOpponent.name}
                        className="w-6 h-4 object-cover rounded-sm mx-auto shadow-sm"
                        title={`vs ${team.nextOpponent.name}`}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Direct Qualification (1-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Intercontinental Playoff (7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Eliminated (8-10)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConmebolStandings;
