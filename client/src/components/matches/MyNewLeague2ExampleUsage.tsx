
import React, { useState } from 'react';
import MyNewLeague2 from './MyNewLeague2';
import MyMatchdetailsScoreboard from './MyMatchdetailsScoreboard';

const MyNewLeague2ExampleUsage = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // This function handles when a match is clicked in MyNewLeague2
  const handleMatchCardClick = (fixture) => {
    console.log('🎯 [Parent] Received match data from MyNewLeague2:', fixture);
    
    // Set the selected match to pass to MyMatchdetailsScoreboard
    setSelectedMatch(fixture);
  };

  return (
    <div className="space-y-4">
      {/* Show match details if a match is selected */}
      {selectedMatch && (
        <div className="mb-4">
          <MyMatchdetailsScoreboard 
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        </div>
      )}

      {/* League matches component */}
      <MyNewLeague2
        selectedDate={selectedDate}
        onMatchCardClick={handleMatchCardClick}
      />
    </div>
  );
};

export default MyNewLeague2ExampleUsage;
