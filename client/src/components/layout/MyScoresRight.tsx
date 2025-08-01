
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import { useDeviceInfo } from '@/hooks/use-mobile';

const MyScoresRight: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const { isMobile } = useDeviceInfo();

  return (
    <>
      {/* New optimized featured match component for testing - Hidden on mobile */}
      {!isMobile && (
        <MyHomeFeaturedMatchNew 
          selectedDate={selectedDate} 
          maxMatches={8}
        />
      )}

      {/* Popular Leagues and Teams sections */}
      <div className="grid grid-cols-2 gap-4">
        <PopularLeaguesList />
        <div className="w-full shadow-md bg-white">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">Popular Teams</h3>
            <PopularTeamsList />
          </div>
        </div>
      </div>
    </>
  );
};

export default MyScoresRight;
