import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Activity, Star } from 'lucide-react';
import FanDashboard from '@/components/dashboard/FanDashboard';
import LeagueStandings from '@/components/stats/LeagueStandings';
import TeamPerformanceStats from '@/components/stats/TeamPerformanceStats';

const MyScores: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Scores</h1>
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="w-full flex justify-center gap-2 mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            Fan Dashboard
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            League Standings
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Team Stats
          </TabsTrigger>
        </TabsList>
        
        {/* Fan Dashboard Tab */}
        <TabsContent value="dashboard">
          <FanDashboard />
        </TabsContent>
        
        {/* League Standings Tab */}
        <TabsContent value="standings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Premier League */}
            <LeagueStandings leagueId={39} season={2024} />
            
            {/* Champions League */}
            <LeagueStandings leagueId={2} season={2024} />
            
            {/* La Liga */}
            <LeagueStandings leagueId={140} season={2024} />
            
            {/* Serie A */}
            <LeagueStandings leagueId={135} season={2024} />
          </div>
        </TabsContent>
        
        {/* Team Stats Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Teams</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 divide-y">
                  {/* Select a team from Popular Leagues */}
                  <button 
                    className="p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {}}
                  >
                    <p className="font-medium">Manchester United</p>
                    <p className="text-sm text-gray-500">Premier League</p>
                  </button>
                  <button 
                    className="p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {}}
                  >
                    <p className="font-medium">Real Madrid</p>
                    <p className="text-sm text-gray-500">La Liga</p>
                  </button>
                  <button 
                    className="p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {}}
                  >
                    <p className="font-medium">Bayern Munich</p>
                    <p className="text-sm text-gray-500">Bundesliga</p>
                  </button>
                  <button 
                    className="p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {}}
                  >
                    <p className="font-medium">Paris Saint-Germain</p>
                    <p className="text-sm text-gray-500">Ligue 1</p>
                  </button>
                </div>
              </CardContent>
            </Card>
            
            {/* Manchester United (Example) */}
            <TeamPerformanceStats teamId={33} leagueId={39} season={2024} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyScores;