
import React from 'react';
import MyMatchEventNew from './MyMatchEventNew';

// Example usage of the MyMatchEventNew component
const MyMatchEventNewExample: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      {/* Example 1: Basic usage with fixture ID */}
      <MyMatchEventNew
        fixtureId="718243"
        homeTeam="Switzerland"
        awayTeam="Spain"
        className="shadow-lg"
      />

      {/* Example 2: With custom settings */}
      <MyMatchEventNew
        fixtureId="12345"
        apiKey="your-api-key-here"
        theme="dark"
        refreshInterval={30}
        showErrors={true}
        showLogos={true}
        homeTeam="Barcelona"
        awayTeam="Real Madrid"
        className="border-2 border-blue-200"
      />

      {/* Example 3: Light theme with faster refresh */}
      <MyMatchEventNew
        fixtureId="67890"
        theme="light"
        refreshInterval={15}
        showLogos={false}
        homeTeam="Manchester City"
        awayTeam="Liverpool"
        className="rounded-xl"
      />
    </div>
  );
};

export default MyMatchEventNewExample;
</example>
