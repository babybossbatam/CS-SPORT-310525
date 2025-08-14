
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyAllLeagueList from './MyAllLeagueList';
import { useCachedQuery } from '@/lib/cachingHelper';

const MyAllLeague: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  // Fetch fixtures for the selected date
  const { data: fixtures = [], isLoading } = useCachedQuery(
    ['fixtures', selectedDate],
    () => fetch(`/api/fixtures/date/${selectedDate}`).then(res => res.json()),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading leagues...</span>
      </div>
    );
  }

  return (
    <MyAllLeagueList selectedDate={selectedDate} fixtures={fixtures} />
  );
};

export default MyAllLeague;
