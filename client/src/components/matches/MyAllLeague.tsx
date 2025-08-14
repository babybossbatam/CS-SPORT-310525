import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyAllLeagueList from './MyAllLeagueList';
import { useCentralData } from '@/providers/CentralDataProvider';

const MyAllLeague: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Use cached fixtures from central data provider
  const { fixtures, isLoading } = useCentralData();

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading leagues...</span>
      </div>
    );
  }

  // Filter fixtures for the selected date if needed
  const relevantFixtures = fixtures?.filter(fixture => {
    const fixtureDate = new Date(fixture.fixture.date).toISOString().split('T')[0];
    return fixtureDate === selectedDate;
  }) || [];

  console.log(`📊 [MyAllLeague] Filtered to ${relevantFixtures.length} fixtures for date ${selectedDate}`);

  return (
    <MyAllLeagueList 
      selectedDate={selectedDate} 
      fixtures={relevantFixtures} 
    />
  );
};

export default MyAllLeague;