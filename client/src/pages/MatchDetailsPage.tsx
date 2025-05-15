import React, { useState } from 'react';
import { MatchBottomNavBar, MatchTab } from '../components/match/MatchBottomNavBar';
import { MatchScoreboard } from '../components/matches/MatchScoreboard';

// Sample match data
const sampleMatch = {
  fixture: {
    id: 12345,
    referee: "John Smith",
    timezone: "UTC",
    date: "2025-05-15T19:45:00+00:00",
    timestamp: 1726470300,
    periods: {
      first: 1726470300,
      second: 1726473900
    },
    venue: {
      id: 555,
      name: "Stamford Bridge",
      city: "London"
    },
    status: {
      long: "Match Finished",
      short: "FT",
      elapsed: 90
    }
  },
  league: {
    id: 39,
    name: "Premier League",
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    flag: "https://media.api-sports.io/flags/gb.svg",
    season: 2024,
    round: "Regular Season - 38"
  },
  teams: {
    home: {
      id: 49,
      name: "Chelsea",
      logo: "https://media.api-sports.io/football/teams/49.png",
      winner: true
    },
    away: {
      id: 33,
      name: "Manchester United",
      logo: "https://media.api-sports.io/football/teams/33.png",
      winner: false
    }
  },
  goals: {
    home: 2,
    away: 1
  },
  score: {
    halftime: {
      home: 1,
      away: 0
    },
    fulltime: {
      home: 2,
      away: 1
    },
    extratime: {
      home: null,
      away: null
    },
    penalty: {
      home: null,
      away: null
    }
  }
};

// Match page content
const MatchContent = () => (
  <div className="p-4">
    <h2 className="text-lg font-bold mb-4">Match Summary</h2>
    <p className="mb-2">
      <span className="font-semibold">Referee:</span> {sampleMatch.fixture.referee}
    </p>
    <p className="mb-2">
      <span className="font-semibold">Venue:</span> {sampleMatch.fixture.venue.name}, {sampleMatch.fixture.venue.city}
    </p>
    <p className="mb-2">
      <span className="font-semibold">League:</span> {sampleMatch.league.name}, {sampleMatch.league.country}
    </p>
    <p className="mb-4">
      <span className="font-semibold">Round:</span> {sampleMatch.league.round}
    </p>
    
    <h3 className="text-md font-bold mb-2">Score Details</h3>
    <p className="mb-2">
      <span className="font-semibold">Full Time:</span> {sampleMatch.score.fulltime.home} - {sampleMatch.score.fulltime.away}
    </p>
    <p className="mb-2">
      <span className="font-semibold">Half Time:</span> {sampleMatch.score.halftime.home} - {sampleMatch.score.halftime.away}
    </p>
  </div>
);

// Lineups content
const LineupsContent = () => (
  <div className="p-4">
    <h2 className="text-lg font-bold mb-4">Team Lineups</h2>
    <div className="mb-4">
      <h3 className="text-md font-bold mb-2">{sampleMatch.teams.home.name}</h3>
      <p className="text-gray-600">Lineup data would be displayed here</p>
    </div>
    <div>
      <h3 className="text-md font-bold mb-2">{sampleMatch.teams.away.name}</h3>
      <p className="text-gray-600">Lineup data would be displayed here</p>
    </div>
  </div>
);

// Stats content
const StatsContent = () => (
  <div className="p-4">
    <h2 className="text-lg font-bold mb-4">Match Statistics</h2>
    <div className="flex justify-between items-center mb-3">
      <div className="w-16 text-center font-semibold">65%</div>
      <div className="flex-1 mx-2">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '65%' }}></div>
        </div>
        <p className="text-xs text-center mt-1">Possession</p>
      </div>
      <div className="w-16 text-center font-semibold">35%</div>
    </div>
    
    <div className="flex justify-between items-center mb-3">
      <div className="w-16 text-center font-semibold">15</div>
      <div className="flex-1 mx-2">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-xs text-center mt-1">Shots</p>
      </div>
      <div className="w-16 text-center font-semibold">5</div>
    </div>
    
    <div className="flex justify-between items-center mb-3">
      <div className="w-16 text-center font-semibold">8</div>
      <div className="flex-1 mx-2">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '80%' }}></div>
        </div>
        <p className="text-xs text-center mt-1">Shots on Target</p>
      </div>
      <div className="w-16 text-center font-semibold">2</div>
    </div>
  </div>
);

// Standings content
const StandingsContent = () => (
  <div className="p-4">
    <h2 className="text-lg font-bold mb-4">League Standings</h2>
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="text-left p-2">#</th>
          <th className="text-left p-2">Team</th>
          <th className="text-center p-2">P</th>
          <th className="text-center p-2">W</th>
          <th className="text-center p-2">D</th>
          <th className="text-center p-2">L</th>
          <th className="text-center p-2">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-200">
          <td className="p-2">1</td>
          <td className="p-2">Man City</td>
          <td className="text-center p-2">38</td>
          <td className="text-center p-2">28</td>
          <td className="text-center p-2">7</td>
          <td className="text-center p-2">3</td>
          <td className="text-center p-2">91</td>
        </tr>
        <tr className="border-b border-gray-200 bg-blue-50">
          <td className="p-2">2</td>
          <td className="p-2 font-semibold">Chelsea</td>
          <td className="text-center p-2">38</td>
          <td className="text-center p-2">26</td>
          <td className="text-center p-2">8</td>
          <td className="text-center p-2">4</td>
          <td className="text-center p-2">86</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="p-2">3</td>
          <td className="p-2">Liverpool</td>
          <td className="text-center p-2">38</td>
          <td className="text-center p-2">25</td>
          <td className="text-center p-2">7</td>
          <td className="text-center p-2">6</td>
          <td className="text-center p-2">82</td>
        </tr>
        <tr className="border-b border-gray-200 bg-red-50">
          <td className="p-2">4</td>
          <td className="p-2 font-semibold">Man United</td>
          <td className="text-center p-2">38</td>
          <td className="text-center p-2">22</td>
          <td className="text-center p-2">8</td>
          <td className="text-center p-2">8</td>
          <td className="text-center p-2">74</td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default function MatchDetailsPage() {
  const [activeTab, setActiveTab] = useState<MatchTab>('match');

  return (
    <div className="pb-20">
      {/* Match Header */}
      <div className="bg-gray-50 p-4">
        <MatchScoreboard match={sampleMatch} />
      </div>
      
      {/* Tab Content */}
      <div className="mb-16">
        {activeTab === 'match' && <MatchContent />}
        {activeTab === 'lineups' && <LineupsContent />}
        {activeTab === 'stats' && <StatsContent />}
        {activeTab === 'standings' && <StandingsContent />}
      </div>
      
      {/* Bottom Navigation */}
      <MatchBottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}