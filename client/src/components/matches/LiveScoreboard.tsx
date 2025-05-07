import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

const LiveScoreboard = () => {
  const [, navigate] = useLocation();
  const { live: liveFixtures, upcoming: upcomingFixtures, loading } = useSelector((state: RootState) => state.fixtures);
  
  // Loading state
  if (loading) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Loading Matches...</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // No matches state
  const availableFixtures = [...liveFixtures, ...(upcomingFixtures || [])];
  if (availableFixtures.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Featured Matches</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p>No matches available right now.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Use first match as featured
  const featured = availableFixtures[0];
  
  return (
    <Card className="m-4 overflow-hidden">
      <CardHeader className="bg-gray-700 text-white p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={featured.league.logo} 
              alt={featured.league.name}
              className="h-5 w-5 mr-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm">{featured.league.name}</span>
          </div>
          <div className="text-xs bg-blue-500 px-2 py-1 rounded">
            Featured Match
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-blue-700 to-red-700 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <img 
                src={featured.teams.home.logo} 
                alt={featured.teams.home.name}
                className="h-16 w-16 mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="mt-2 font-semibold">{featured.teams.home.name}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold bg-white text-black rounded-full w-10 h-10 flex items-center justify-center mx-auto">
                VS
              </div>
            </div>
            
            <div className="text-center">
              <img 
                src={featured.teams.away.logo} 
                alt={featured.teams.away.name}
                className="h-16 w-16 mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="mt-2 font-semibold">{featured.teams.away.name}</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
            className="text-sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Match Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;