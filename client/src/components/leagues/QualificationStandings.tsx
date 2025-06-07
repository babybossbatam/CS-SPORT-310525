
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
import { Trophy, Globe, Target } from 'lucide-react';

interface QualificationStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
    flag?: string;
  };
  points: number;
  goalsDiff: number;
  group?: string;
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
  nextMatch?: {
    name: string;
    logo: string;
    flag?: string;
  };
}

interface QualificationStandingsProps {
  standings: QualificationStanding[];
  title: string;
  tournament: string;
  year?: string | number;
  qualificationRules?: {
    direct: number;
    playoff: number;
    relegated?: number;
  };
}

const QualificationStandings: React.FC<QualificationStandingsProps> = ({
  standings,
  title,
  tournament,
  year,
  qualificationRules = { direct: 6, playoff: 1 }
}) => {
  const getQualificationColor = (rank: number, description: string) => {
    if (description.toLowerCase().includes('world cup') || 
        description.toLowerCase().includes('qualification') ||
        rank <= qualificationRules.direct) {
      return '#4CAF50'; // Direct qualification (green)
    }
    if (rank <= (qualificationRules.direct + qualificationRules.playoff)) {
      return '#FF9800'; // Playoff (orange)  
    }
    if (qualificationRules.relegated && rank > standings.length - qualificationRules.relegated) {
      return '#f44336'; // Relegation (red)
    }
    return '#9E9E9E'; // No qualification (gray)
  };

  const getStatusText = (rank: number, description: string) => {
    if (description) return description;
    
    if (rank <= qualificationRules.direct) return 'Direct Qualification';
    if (rank <= (qualificationRules.direct + qualificationRules.playoff)) return 'Playoff';
    if (qualificationRules.relegated && rank > standings.length - qualificationRules.relegated) return 'Relegation';
    return '';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {year && (
              <Badge variant="outline" className="text-xs">
                {year}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {tournament}
            </Badge>
          </div>
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
              {standings.map((standing) => (
                <TableRow 
                  key={standing.team.id}
                  className="hover:bg-gray-50/50 transition-colors border-b"
                >
                  {/* Rank with colored indicator */}
                  <TableCell className="relative text-center font-bold">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: getQualificationColor(standing.rank, standing.description) }}
                    />
                    <span
                      style={{ color: getQualificationColor(standing.rank, standing.description) }}
                    >
                      {standing.rank}
                    </span>
                  </TableCell>

                  {/* Team with flag and status */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={standing.team.flag || standing.team.logo} 
                        alt={standing.team.name}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = standing.team.logo;
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{standing.team.name}</span>
                        {standing.description && (
                          <span 
                            className="text-xs font-medium"
                            style={{ color: getQualificationColor(standing.rank, standing.description) }}
                          >
                            {getStatusText(standing.rank, standing.description)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="text-center text-sm">
                    {standing.all.played}
                  </TableCell>

                  {/* Goals For:Against */}
                  <TableCell className="text-center text-sm">
                    {standing.all.goals.for}:{standing.all.goals.against}
                  </TableCell>

                  {/* Goal Difference */}
                  <TableCell className="text-center text-sm font-medium">
                    <span className={standing.goalsDiff > 0 ? 'text-green-600' : standing.goalsDiff < 0 ? 'text-red-600' : ''}>
                      {standing.goalsDiff > 0 ? '+' : ''}{standing.goalsDiff}
                    </span>
                  </TableCell>

                  {/* Points */}
                  <TableCell className="text-center font-bold text-sm">
                    {standing.points}
                  </TableCell>

                  {/* Wins */}
                  <TableCell className="text-center text-sm">
                    {standing.all.win}
                  </TableCell>

                  {/* Draws */}
                  <TableCell className="text-center text-sm">
                    {standing.all.draw}
                  </TableCell>

                  {/* Losses */}
                  <TableCell className="text-center text-sm">
                    {standing.all.lose}
                  </TableCell>

                  {/* Form */}
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      {standing.form?.split('').map((result, i) => (
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
                    {standing.nextMatch && (
                      <img 
                        src={standing.nextMatch.flag || standing.nextMatch.logo} 
                        alt={standing.nextMatch.name}
                        className="w-6 h-4 object-cover rounded-sm mx-auto shadow-sm"
                        title={`vs ${standing.nextMatch.name}`}
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
              <span>Direct Qualification (1-{qualificationRules.direct})</span>
            </div>
            {qualificationRules.playoff > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Playoff ({qualificationRules.direct + 1}-{qualificationRules.direct + qualificationRules.playoff})</span>
              </div>
            )}
            {qualificationRules.relegated && qualificationRules.relegated > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Relegation</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualificationStandings;
