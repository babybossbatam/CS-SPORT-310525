import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, TrendingUp, History, Award } from 'lucide-react';

interface HistoricalMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
}

interface HeadToHeadStats {
  totalMatches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  lastFiveResults: ('H' | 'A' | 'D')[];
}

interface TeamFormStats {
  homeTeamForm: ('W' | 'L' | 'D')[];
  awayTeamForm: ('W' | 'L' | 'D')[];
  homeTeamPosition?: number;
  awayTeamPosition?: number;
}

interface HistoricalStatsProps {
  homeTeamId: number;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamLogo: string;
  previousMatches: HistoricalMatch[];
  headToHead: HeadToHeadStats;
  teamForm: TeamFormStats;
}

const HistoricalStats: React.FC<HistoricalStatsProps> = ({
  homeTeamName,
  homeTeamLogo,
  awayTeamName,
  awayTeamLogo,
  previousMatches,
  headToHead,
  teamForm
}) => {
  const [activeTab, setActiveTab] = useState('history');
  
  const getResultClass = (result: 'W' | 'L' | 'D' | 'H' | 'A') => {
    switch (result) {
      case 'W':
      case 'H':
        return 'bg-green-500';
      case 'L':
      case 'A':
        return 'bg-red-500';
      case 'D':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Card className="shadow-md animate-in fade-in duration-500">
      <CardHeader className="border-b p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Historical Statistics</h3>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="history" className="text-xs flex items-center gap-1">
                <History className="h-3 w-3" />
                <span className="hidden sm:inline">Head to Head</span>
              </TabsTrigger>
              <TabsTrigger value="form" className="text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Form</span>
              </TabsTrigger>
              <TabsTrigger value="previous" className="text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span className="hidden sm:inline">Previous</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-center w-1/3">
                    <div className="text-2xl font-bold text-blue-600">{headToHead.homeWins}</div>
                    <div className="text-sm text-gray-500">Home wins</div>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="text-2xl font-bold text-gray-500">{headToHead.draws}</div>
                    <div className="text-sm text-gray-500">Draws</div>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="text-2xl font-bold text-red-600">{headToHead.awayWins}</div>
                    <div className="text-sm text-gray-500">Away wins</div>
                  </div>
                </div>
                
                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-sm text-gray-500">Last 5 meetings:</span>
                  <div className="flex gap-1">
                    {headToHead.lastFiveResults.map((result, i) => (
                      <div 
                        key={i} 
                        className={`w-5 h-5 flex items-center justify-center rounded-full text-white text-xs ${getResultClass(result)}`}
                        title={result === 'H' ? 'Home win' : result === 'A' ? 'Away win' : 'Draw'}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-2">Win percentage</div>
                  <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-gray-400 to-red-600"
                      style={{ 
                        backgroundSize: `${headToHead.totalMatches * 100}%`,
                        backgroundPosition: `${-headToHead.homeWins * 100 / headToHead.totalMatches}% 0` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{Math.round(headToHead.homeWins / headToHead.totalMatches * 100)}%</span>
                    <span>{Math.round(headToHead.draws / headToHead.totalMatches * 100)}%</span>
                    <span>{Math.round(headToHead.awayWins / headToHead.totalMatches * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'form' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col items-center w-1/2">
                    <img src={homeTeamLogo} alt={homeTeamName} className="h-12 w-12 mb-2" />
                    <div className="text-sm font-medium">{homeTeamName}</div>
                    {teamForm.homeTeamPosition && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <span className="mr-1">Position:</span>
                        <span className="font-semibold text-sm">#{teamForm.homeTeamPosition}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center w-1/2">
                    <img src={awayTeamLogo} alt={awayTeamName} className="h-12 w-12 mb-2" />
                    <div className="text-sm font-medium">{awayTeamName}</div>
                    {teamForm.awayTeamPosition && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <span className="mr-1">Position:</span> 
                        <span className="font-semibold text-sm">#{teamForm.awayTeamPosition}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 font-medium">Home form</div>
                    <div className="flex gap-1">
                      {teamForm.homeTeamForm.map((result, i) => (
                        <div 
                          key={i} 
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs ${getResultClass(result)}`}
                          title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 font-medium">Away form</div>
                    <div className="flex gap-1">
                      {teamForm.awayTeamForm.map((result, i) => (
                        <div 
                          key={i} 
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs ${getResultClass(result)}`}
                          title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-center text-gray-500 mb-3">Form comparison (last 5 games)</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium">{homeTeamName}</div>
                    <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-700"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${teamForm.homeTeamForm.filter(r => r === 'W').length * 20}%` 
                        }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <div className="text-xs font-semibold">{teamForm.homeTeamForm.filter(r => r === 'W').length}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs font-medium">{awayTeamName}</div>
                    <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-700"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${teamForm.awayTeamForm.filter(r => r === 'W').length * 20}%` 
                        }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <div className="text-xs font-semibold">{teamForm.awayTeamForm.filter(r => r === 'W').length}</div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'previous' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-600">Previous Matches</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {previousMatches.map((match, i) => (
                    <div key={i} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                      <div className="text-xs text-gray-500 mb-1 flex justify-between">
                        <span>{match.competition}</span>
                        <span>{new Date(match.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{match.homeTeam}</div>
                        <div className="px-3 text-center">
                          <span className="font-bold">{match.homeScore} - {match.awayScore}</span>
                        </div>
                        <div className="text-sm font-medium">{match.awayTeam}</div>
                      </div>
                      <div className="mt-2 text-xs text-center">
                        {match.homeScore > match.awayScore ? (
                          <span className="text-blue-600">Home win</span>
                        ) : match.homeScore < match.awayScore ? (
                          <span className="text-red-600">Away win</span>
                        ) : (
                          <span className="text-gray-500">Draw</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {previousMatches.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No previous matches found
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default HistoricalStats;