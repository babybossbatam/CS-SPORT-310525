// Assuming this is the content of MyMainLayout.tsx

import React from 'react';
// Removed import MatchPredictionsCard from "@/components/matches/MatchPredictionsCard";

interface MyMainLayoutProps {
  selectedFixture: any; // Replace 'any' with the actual type
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ selectedFixture }) => {
  return (
    <div>
      {/* Other components and content */}
      {selectedFixture && (
        <div>
          <p>Selected Fixture:</p>
          <p>Home Team: {selectedFixture.teams?.home?.name || 'Home Team'}</p>
          <p>Away Team: {selectedFixture.teams?.away?.name || 'Away Team'}</p>
          {/* Removed MatchPredictionsCard component usage */}
        </div>
      )}
      {/* More components and content */}
    </div>
  );
};

export default MyMainLayout;