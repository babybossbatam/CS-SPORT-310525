
import React from 'react';
import MyMatchEvents from './MyMatchEvents';

// Example usage of the enhanced MyMatchEvents component with different widget types

const MatchEventsWidgetExample: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Custom Widget (existing functionality) */}
      <MyMatchEvents
        widgetType="custom"
        matchId="12345"
        homeTeam="Barcelona"
        awayTeam="Real Madrid"
        matchStatus="1H"
      />

      {/* Sportradar Widget */}
      <MyMatchEvents
        widgetType="sportradar"
        matchId="12345"
        homeTeam="Barcelona"
        awayTeam="Real Madrid"
        matchStatus="1H"
        sportradarConfig={{
          clientAlias: "your_client_alias_here",
          matchId: "56690809"
        }}
      />

      {/* API-Football Widget */}
      <MyMatchEvents
        widgetType="api-football"
        matchId="12345"
        homeTeam="Barcelona"
        awayTeam="Real Madrid"
        matchStatus="1H"
        apiFootballConfig={{
          apiKey: "your_api_key_here",
          fixtureId: "718243",
          theme: "dark"
        }}
      />
    </div>
  );
};

export default MatchEventsWidgetExample;
