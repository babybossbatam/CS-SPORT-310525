import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Trophy, Zap, History } from 'lucide-react';

// Sample team performance data
const performanceData = {
  id: 33,
  name: 'Manchester United',
  logo: 'https://media.api-sports.io/football/teams/33.png',
  current: {
    form: ['W', 'W', 'L', 'D', 'W'],
    streak: {
      wins: 2,
      unbeaten: 2
    },
    goals: {
      scored: 37,
      conceded: 22,
      perMatch: 1.85
    },
    possession: 55,
    cleanSheets: 9,
    league: {
      position: 4,
      points: 58,
      gamesPlayed: 32
    }
  },
  historical: {
    lastSeason: {
      position: 3,
      points: 71,
      gamesPlayed: 38,
      goalsScored: 58,
      goalsConceded: 43
    },
    trophies: [
      { name: 'Premier League', count: 13, lastWon: '2013' },
      { name: 'FA Cup', count: 12, lastWon: '2016' },
      { name: 'Champions League', count: 3, lastWon: '2008' }
    ],
    headToHead: [
      { opponent: 'Manchester City', played: 53, won: 24, drawn: 9, lost: 20 },
      { opponent: 'Liverpool', played: 58, won: 28, drawn: 10, lost: 20 },
      { opponent: 'Arsenal', played: 60, won: 25, drawn: 17, lost: 18 }
    ]
  }
};

const TeamPerformance = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('current');
  
  // Renders form indicator (W, L, D)
  const renderFormIndicator = (result: string) => {
    switch (result) {
      case 'W':
        return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">W</div>;
      case 'L':
        return <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">L</div>;
      case 'D':
        return <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">D</div>;
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
      <div className="flex items-center mb-4">
        <img 
          src={performanceData.logo} 
          alt={performanceData.name}
          className="w-10 h-10 mr-3"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
          }}
        />
        <div>
          <h3 className="text-lg font-semibold">{performanceData.name}</h3>
          <div className="text-sm text-gray-500">Team Performance</div>
        </div>
      </div>
      
      <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="text-xs">
            <Zap className="w-3 h-3 mr-1" /> Current
          </TabsTrigger>
          <TabsTrigger value="historical" className="text-xs">
            <History className="w-3 h-3 mr-1" /> Historical
          </TabsTrigger>
          <TabsTrigger value="headtohead" className="text-xs">
            <Trophy className="w-3 h-3 mr-1" /> H2H
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="pt-3">
          <div className="space-y-3">
            {/* Form display */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-semibold mb-2">Recent Form</div>
              <div className="flex space-x-2 justify-between">
                {performanceData.current.form.map((result, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {renderFormIndicator(result)}
                    <span className="text-xs mt-1">Match {5-index}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stats */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Goals Scored</span>
                  <span className="font-semibold">{performanceData.current.goals.scored}</span>
                </div>
                <Progress value={performanceData.current.goals.scored / 80 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Possession</span>
                  <span className="font-semibold">{performanceData.current.possession}%</span>
                </div>
                <Progress value={performanceData.current.possession} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Clean Sheets</span>
                  <span className="font-semibold">{performanceData.current.cleanSheets}/{performanceData.current.league.gamesPlayed}</span>
                </div>
                <Progress value={performanceData.current.cleanSheets / performanceData.current.league.gamesPlayed * 100} className="h-2" />
              </div>
            </div>
            
            {/* Current league position */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-semibold">League Position</div>
                <div className="text-2xl font-bold">{performanceData.current.league.position}</div>
              </div>
              <div>
                <div className="text-sm font-semibold">Points</div>
                <div className="text-2xl font-bold">{performanceData.current.league.points}</div>
              </div>
              <div>
                <div className="text-sm font-semibold">Form</div>
                <div className="flex items-center">
                  {performanceData.current.streak.wins > 1 && (
                    <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                  )}
                  {performanceData.current.streak.wins === 0 && (
                    <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                  )}
                  <span className="font-semibold">
                    {performanceData.current.streak.wins > 0 
                      ? `Won ${performanceData.current.streak.wins}`
                      : 'No wins'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="historical" className="pt-3">
          <div className="space-y-3">
            {/* Last season */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm font-semibold mb-2">Last Season Performance</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Finished</div>
                  <div className="font-bold text-lg">{performanceData.historical.lastSeason.position}{performanceData.historical.lastSeason.position === 1 ? 'st' : performanceData.historical.lastSeason.position === 2 ? 'nd' : performanceData.historical.lastSeason.position === 3 ? 'rd' : 'th'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Points</div>
                  <div className="font-bold text-lg">{performanceData.historical.lastSeason.points}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Goals</div>
                  <div className="font-bold text-lg">{performanceData.historical.lastSeason.goalsScored}</div>
                </div>
              </div>
            </div>
            
            {/* Trophies */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Major Trophies</div>
              {performanceData.historical.trophies.map((trophy, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm">{trophy.name}</span>
                  </div>
                  <div className="text-sm font-semibold">
                    {trophy.count} (Last: {trophy.lastWon})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="headtohead" className="pt-3">
          <div className="space-y-3">
            <div className="text-sm font-semibold">Head to Head Record</div>
            {performanceData.historical.headToHead.map((record, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-semibold">{record.opponent}</div>
                <div className="flex justify-between text-xs mt-1">
                  <div>
                    <span className="text-gray-500">Played:</span> {record.played}
                  </div>
                  <div>
                    <span className="text-green-500">W:</span> {record.won}
                  </div>
                  <div>
                    <span className="text-yellow-500">D:</span> {record.drawn}
                  </div>
                  <div>
                    <span className="text-red-500">L:</span> {record.lost}
                  </div>
                </div>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div className="bg-green-500 h-full" style={{ width: `${(record.won / record.played) * 100}%` }}></div>
                    <div className="bg-yellow-500 h-full" style={{ width: `${(record.drawn / record.played) * 100}%` }}></div>
                    <div className="bg-red-500 h-full" style={{ width: `${(record.lost / record.played) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPerformance;