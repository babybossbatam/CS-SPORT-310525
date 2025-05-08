import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, TrendingUp, History } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample player data
const samplePlayers = [
  {
    id: 521,
    name: 'Cristiano Ronaldo',
    position: 'Forward',
    photo: 'https://media.api-sports.io/football/players/874.png',
    team: {
      id: 33,
      name: 'Manchester United',
      logo: 'https://media.api-sports.io/football/teams/33.png'
    },
    stats: {
      goals: 24,
      assists: 3,
      rating: '8.2',
      appearances: 28,
    },
    form: ['goal', 'assist', 'goal', 'goal', 'blank'] // last 5 games performance
  },
  {
    id: 154,
    name: 'Lionel Messi',
    position: 'Forward',
    photo: 'https://media.api-sports.io/football/players/154.png',
    team: {
      id: 85,
      name: 'Paris Saint-Germain',
      logo: 'https://media.api-sports.io/football/teams/85.png'
    },
    stats: {
      goals: 21,
      assists: 14,
      rating: '8.5',
      appearances: 30,
    },
    form: ['goal', 'goal', 'assist', 'goal', 'assist'] // last 5 games performance
  },
  {
    id: 276,
    name: 'Erling Haaland',
    position: 'Forward',
    photo: 'https://media.api-sports.io/football/players/1100.png',
    team: {
      id: 50,
      name: 'Manchester City',
      logo: 'https://media.api-sports.io/football/teams/50.png'
    },
    stats: {
      goals: 32,
      assists: 5,
      rating: '8.6',
      appearances: 29,
    },
    form: ['goal', 'goal', 'goal', 'blank', 'goal'] // last 5 games performance
  }
];

type PlayerPerformance = 'goal' | 'assist' | 'blank';

const PlayerSpotlight = () => {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  
  // Cycle through players every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlightIndex((current) => (current + 1) % samplePlayers.length);
    }, 10000); // Change player every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const currentPlayer = samplePlayers[spotlightIndex];
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-start">
          <Skeleton className="h-16 w-16 rounded-full mr-4" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton className="h-14 w-full rounded mb-2" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  // Render a form indicator for the player's recent performances
  const renderFormIndicator = (performance: PlayerPerformance) => {
    switch (performance) {
      case 'goal':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'assist':
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case 'blank':
        return <div className="w-2 h-2 rounded-full bg-gray-300"></div>;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
      <h3 className="text-lg font-semibold mb-3">Player Spotlight</h3>
      
      <div className="flex items-start">
        {/* Player photo */}
        <div className="relative">
          <img 
            src={currentPlayer.photo} 
            alt={currentPlayer.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Player';
            }}
          />
          <img 
            src={currentPlayer.team.logo}
            alt={currentPlayer.team.name}
            className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full border-2 border-white bg-white"
          />
        </div>
        
        {/* Player info */}
        <div className="ml-4 flex-1">
          <h4 className="font-semibold text-lg">{currentPlayer.name}</h4>
          <div className="text-sm text-gray-600 flex items-center">
            <span>{currentPlayer.position}</span>
            <span className="mx-2">•</span>
            <span>{currentPlayer.team.name}</span>
          </div>
          
          {/* Form indicators */}
          <div className="flex mt-2 space-x-1">
            {currentPlayer.form.map((performance, i) => (
              <div key={i} className="flex items-center justify-center">
                {renderFormIndicator(performance as PlayerPerformance)}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tabs for different stats */}
      <div className="mt-4">
        <Tabs defaultValue="stats" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats" className="text-xs">
              <Star className="w-3 h-3 mr-1" /> Stats
            </TabsTrigger>
            <TabsTrigger value="form" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Form
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="w-3 h-3 mr-1" /> History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="pt-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Goals</span>
                  <span className="font-semibold">{currentPlayer.stats.goals}</span>
                </div>
                <Progress value={Math.min(currentPlayer.stats.goals / 40 * 100, 100)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Assists</span>
                  <span className="font-semibold">{currentPlayer.stats.assists}</span>
                </div>
                <Progress value={Math.min(currentPlayer.stats.assists / 20 * 100, 100)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Rating</span>
                  <span className="font-semibold">{currentPlayer.stats.rating}</span>
                </div>
                <Progress value={parseFloat(currentPlayer.stats.rating) / 10 * 100} className="h-2" />
              </div>
              
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm text-gray-500">Appearances</div>
                  <div className="font-bold">{currentPlayer.stats.appearances}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm text-gray-500">G/A per 90</div>
                  <div className="font-bold">
                    {((currentPlayer.stats.goals + currentPlayer.stats.assists) / currentPlayer.stats.appearances).toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm text-gray-500">Shot Accuracy</div>
                  <div className="font-bold">72%</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="form" className="pt-4">
            <div className="space-y-2">
              <div className="flex p-2 bg-gray-50 rounded items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm flex-1">Goals</span>
                <span className="font-bold text-sm">{currentPlayer.form.filter(f => f === 'goal').length}</span>
              </div>
              <div className="flex p-2 bg-gray-50 rounded items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm flex-1">Assists</span>
                <span className="font-bold text-sm">{currentPlayer.form.filter(f => f === 'assist').length}</span>
              </div>
              <div className="flex p-2 bg-gray-50 rounded items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                <span className="text-sm flex-1">No contributions</span>
                <span className="font-bold text-sm">{currentPlayer.form.filter(f => f === 'blank').length}</span>
              </div>
              
              <div className="text-sm text-gray-600 mt-3">
                <p>Last 5 matches form analysis</p>
                <p className="mt-1">Player has been directly involved in {currentPlayer.form.filter(f => f !== 'blank').length} goals in the last 5 matches.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-semibold">Career Statistics</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <div className="text-gray-500">Total Goals</div>
                    <div className="font-bold">
                      {currentPlayer.id === 521 ? '819' : currentPlayer.id === 154 ? '793' : '200'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Total Assists</div>
                    <div className="font-bold">
                      {currentPlayer.id === 521 ? '229' : currentPlayer.id === 154 ? '350' : '60'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-semibold">Achievements</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm">
                    <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                    <span>
                      {currentPlayer.id === 521 ? 'Champions League (5)' : 
                       currentPlayer.id === 154 ? 'Ballon d\'Or (7)' : 
                       'Golden Boot (3)'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                    <span>
                      {currentPlayer.id === 521 ? 'Premier League (3)' : 
                       currentPlayer.id === 154 ? 'Champions League (4)' : 
                       'Premier League (2)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="text-center mt-4">
        <button 
          className="text-blue-600 text-sm hover:underline"
          onClick={() => navigate(`/player/${currentPlayer.id}`)}
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
};

export default PlayerSpotlight;