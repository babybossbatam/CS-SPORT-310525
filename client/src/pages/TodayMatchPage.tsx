
import React, { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the heavy TodayMatchCard component
const TodayMatchCard = lazy(() => import('@/components/matches/TodayMatchPageCard'));

const TodayMatchPage = () => {
  const fixtures = useSelector((state: RootState) => state.fixtures.fixtures);

  const handleMatchClick = (matchId: number) => {
    // Handle match click - navigate to match details or open modal
    console.log('Match clicked:', matchId);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Today's Matches</h1>
        <p className="text-gray-600 mt-2">Stay updated with today's football matches</p>
      </div>
      
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <TodayMatchCard 
          fixtures={fixtures}
          onMatchClick={handleMatchClick}
        />
      </Suspense>
    </div>
  );
};

export default TodayMatchPage;
