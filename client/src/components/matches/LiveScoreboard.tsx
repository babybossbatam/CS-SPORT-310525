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
          <Skeleton className="h-20 w-full" />
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
      
      {/* Match display with straight line background */}
      <div 
        className="relative h-20 cursor-pointer overflow-hidden"
        onClick={() => navigate(`/match/${featured.fixture.id}`)}
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-blue-800"></div>
          <div className="w-1/2 bg-red-700"></div>
        </div>
        
        {/* Content */}
        <div className="relative flex items-center justify-between h-full px-2 text-white z-10">
          {/* Home Team Logo */}
          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
            <img 
              src={featured.teams.home.logo} 
              alt={featured.teams.home.name}
              className="max-h-16 max-w-16 rounded-full border-2 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
              }}
            />
          </div>
          
          {/* Home Team Name */}
          <div className="flex-1 text-right font-bold mr-2 text-shadow">
            {featured.teams.home.name}
          </div>
          
          {/* VS */}
          <div className="flex-shrink-0 bg-white text-gray-800 font-bold rounded-full w-8 h-8 flex items-center justify-center mx-2 shadow-md">
            VS
          </div>
          
          {/* Away Team Name */}
          <div className="flex-1 text-left font-bold ml-2 text-shadow">
            {featured.teams.away.name}
          </div>
          
          {/* Away Team Logo */}
          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
            <img 
              src={featured.teams.away.logo} 
              alt={featured.teams.away.name}
              className="max-h-16 max-w-16 rounded-full border-2 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
              }}
            />
          </div>
        </div>
      </div>
      
      <CardContent className="p-3 text-center bg-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/match/${featured.fixture.id}`)}
          className="text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          View Match Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;