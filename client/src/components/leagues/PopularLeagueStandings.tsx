import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Trophy, Flag } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Types
interface TeamStanding {
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

interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: TeamStanding[][];
  };
}

// Popular leagues by country
const popularLeagues: Record<string, { id: number; name: string; flag: string }> = {
  'England': { 
    id: 39, 
    name: 'Premier League',
    flag: 'https://media.api-sports.io/flags/gb.svg'
  },
  'Europe': { 
    id: 2, 
    name: 'Champions League',
    flag: 'https://media.api-sports.io/flags/eu.svg'
  },
  'Germany': { 
    id: 78, 
    name: 'Bundesliga',
    flag: 'https://media.api-sports.io/flags/de.svg'
  },
  'Italy': { 
    id: 71, 
    name: 'Serie A',
    flag: 'https://media.api-sports.io/flags/it.svg'
  },
  'Brazil': { 
    id: 71, 
    name: 'Serie A',
    flag: 'https://media.api-sports.io/flags/br.svg'
  }
};

const PopularLeagueStandings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('England');
  const [standings, setStandings] = useState<Record<string, LeagueStandings | null>>({
    England: null,
    Europe: null,
    Germany: null,
    Italy: null,
    Brazil: null
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    England: false,
    Europe: false,
    Germany: false,
    Italy: false,
    Brazil: false
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch standings for selected country/region
  useEffect(() => {
    const fetchStandings = async (country: string) => {
      // Skip if already loaded
      if (standings[country] || loading[country]) return;
      
      setLoading(prev => ({ ...prev, [country]: true }));
      
      try {
        const leagueId = popularLeagues[country].id;
        const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
        const data = await response.json();
        
        setStandings(prev => ({ ...prev, [country]: data }));
      } catch (error) {
        console.error(`Error fetching ${country} standings:`, error);
        toast({
          title: 'Error',
          description: `Failed to load ${country} standings data`,
          variant: 'destructive',
        });
      } finally {
        setLoading(prev => ({ ...prev, [country]: false }));
      }
    };
    
    fetchStandings(activeTab);
  }, [activeTab, standings, loading, toast]);

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Trophy size={16} className="mr-2" /> 
          Popular Leagues Standings
        </CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="England" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.keys(popularLeagues).map((country) => (
            <TabsTrigger 
              key={country} 
              value={country}
              className="flex items-center justify-center gap-1"
            >
              <motion.div 
                className="relative"
                initial={{ y: 0 }}
                animate={{ y: activeTab === country ? [0, -2, 0] : 0 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src={popularLeagues[country].flag}
                  alt={country}
                  className="h-3 w-4 inline-block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>
              <span className="text-xs truncate">{country}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(popularLeagues).map((country) => (
          <TabsContent key={country} value={country} className="pt-2">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <img
                    src={popularLeagues[country].flag}
                    alt={country}
                    className="h-5 w-7 mr-2 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="font-medium">{popularLeagues[country].name}</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs flex items-center"
                  onClick={() => navigate(`/league/${popularLeagues[country].id}`)}
                >
                  View Full Table
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              {loading[country] ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-10 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (!standings[country]) ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  No standings data available
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 border-b pb-2 mb-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Team</div>
                    <div className="col-span-1 text-center">P</div>
                    <div className="col-span-1 text-center">W</div>
                    <div className="col-span-1 text-center">D</div>
                    <div className="col-span-1 text-center">L</div>
                    <div className="col-span-1 text-center">PTS</div>
                  </div>
                  
                  {/* Team Rows */}
                  <div className="space-y-2">
                    {standings[country]?.league.standings[0]?.slice(0, 10).map((team) => (
                      <div 
                        key={team.team.id}
                        className="grid grid-cols-12 text-sm items-center hover:bg-gray-50 py-1 rounded cursor-pointer"
                        onClick={() => navigate(`/team/${team.team.id}`)}
                      >
                        <div className="col-span-1 font-medium">{team.rank}</div>
                        <div className="col-span-6 flex items-center space-x-2">
                          <img 
                            src={team.team.logo} 
                            alt={team.team.name}
                            className="h-5 w-5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=Team';
                            }}
                          />
                          <span className="truncate">{team.team.name}</span>
                        </div>
                        <div className="col-span-1 text-center">{team.all.played}</div>
                        <div className="col-span-1 text-center">{team.all.win}</div>
                        <div className="col-span-1 text-center">{team.all.draw}</div>
                        <div className="col-span-1 text-center">{team.all.lose}</div>
                        <div className="col-span-1 text-center font-bold">{team.points}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default PopularLeagueStandings;