
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import TodayMatchCard from '@/components/matches/TodayMatchCard';

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
      
      <TodayMatchCard 
        fixtures={fixtures}
        onMatchClick={handleMatchClick}
      />
    </div>
  );
};

export default TodayMatchPage;
