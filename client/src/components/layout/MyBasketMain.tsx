
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, uiActions } from '@/lib/store';
import MyBasketmainLeft from '@/components/matches/MyBasketmainLeft';
import MyRightContent from '@/components/layout/MyRightContent';
import MyRightDetails from '@/components/layout/MyMainLayoutRight';

interface MyBasketMainProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyBasketMain: React.FC<MyBasketMainProps> = ({ fixtures, loading = false, children }) => {
  const dispatch = useDispatch();
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  // Get filters from Redux store
  const { selectedDate, timeFilterActive, liveFilterActive, selectedLeagues, selectedCountries } = useSelector((state: RootState) => state.ui);

  // Filter fixtures based on current filters
  const filteredFixtures = fixtures.filter(fixture => {
    // Date filter
    if (selectedDate) {
      const fixtureDate = new Date(fixture.fixture.date).toISOString().split('T')[0];
      const filterDate = selectedDate;
      if (fixtureDate !== filterDate) return false;
    }

    // Live filter
    if (liveFilterActive) {
      const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'];
      if (!liveStatuses.includes(fixture.fixture.status.short)) return false;
    }

    // League filter
    if (selectedLeagues.length > 0) {
      if (!selectedLeagues.includes(fixture.league.id)) return false;
    }

    // Country filter
    if (selectedCountries.length > 0) {
      if (!selectedCountries.includes(fixture.league.country)) return false;
    }

    return true;
  });

  const handleMatchClick = (matchId: number) => {
    console.log('🏀 [MyBasketMain] Basketball match clicked:', matchId);
    // Find the fixture by ID and set it as selected
    const fixture = filteredFixtures.find(f => f.fixture?.id === matchId);
    if (fixture) {
      setSelectedFixture(fixture);
    }
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🏀 [MyBasketMain] Basketball match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      source: 'MyBasketMain'
    });
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <div
      className="bg-[#FDFBF7] rounded-lg py-4"
      style={{ marginLeft: "150px", marginRight: "150px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Render children if provided, otherwise show MyBasketmainLeft */}
          {children ? (
            <div>
              {children}
            </div>
          ) : (
            <div>
              <MyBasketmainLeft
                fixtures={filteredFixtures}
                onMatchClick={handleMatchClick}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          )}
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedFixture ? (
            <MyRightDetails 
              selectedFixture={selectedFixture}
              onClose={handleBackToMain}
            />
          ) : (
            <MyRightContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBasketMain;
