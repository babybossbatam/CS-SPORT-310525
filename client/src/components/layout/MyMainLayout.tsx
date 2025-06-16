
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useLocation } from "wouter";
import TodayMatchPageCard from '@/components/matches/TodayMatchPageCard';
import TodaysMatchesByCountryNew from '@/components/matches/TodaysMatchesByCountryNew';
import MyHomeFeaturedMatchNew from '@/components/matches/MyHomeFeaturedMatchNew';
import HomeTopScorersList from '@/components/leagues/HomeTopScorersList';
import LeagueStandingsFilter from '@/components/leagues/LeagueStandingsFilter';
import PopularLeaguesList from '@/components/leagues/PopularLeaguesList';
import PopularTeamsList from '@/components/teams/PopularTeamsList';
import ScoreDetailsCard from '@/components/matches/ScoreDetailsCard';
import MyRightContent from '@/components/layout/MyRightContent';

import { Card, CardContent } from '@/components/ui/card';

interface MyMainLayoutProps {
  fixtures: any[];
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ fixtures }) => {
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-lg py-4" style={{ marginLeft: '150px', marginRight: '150px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* New TodayMatchPageCard for testing */}
          <div>
            <TodayMatchPageCard 
              fixtures={fixtures}
              onMatchClick={handleMatchClick}
              onMatchCardClick={handleMatchCardClick}
            />
          </div>

          
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedFixture ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToMain}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to Main
                </button>
              </div>
              <ScoreDetailsCard currentFixture={selectedFixture} />
            </div>
          ) : (
            <MyRightContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMainLayout;
