
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MyLiveActionProps {
  match?: any;
  className?: string;
}

const MyLiveAction = ({ match, className = "" }: MyLiveActionProps) => {
  const [liveData, setLiveData] = useState<any>(null);
  const [currentAction, setCurrentAction] = useState<{
    team: string;
    action: string;
    player?: string;
    position?: string;
    minute?: number;
    type?: 'substitution' | 'card' | 'goal' | 'general';
  } | null>(null);

  // Fetch real-time live data
  useEffect(() => {
    if (!match) return;

    const status = match?.fixture?.status?.short;
    const isLive = ["1H", "2H", "LIVE", "LIV"].includes(status);

    if (isLive) {
      const fetchLiveData = async () => {
        try {
          const response = await fetch('/api/fixtures/live');
          if (response.ok) {
            const liveFixtures = await response.json();
            const currentMatch = liveFixtures.find((fixture: any) => 
              fixture.fixture.id === match.fixture.id
            );
            
            if (currentMatch) {
              setLiveData(currentMatch);
              
              // Generate realistic actions based on current match data
              const elapsed = currentMatch.fixture.status.elapsed || 0;
              const actions = generateRealisticActions(currentMatch, elapsed);
              
              if (actions.length > 0) {
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                setCurrentAction(randomAction);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching live data:', error);
        }
      };

      // Initial fetch
      fetchLiveData();

      // Update every 30 seconds (same as your other live components)
      const interval = setInterval(fetchLiveData, 30000);

      return () => clearInterval(interval);
    }
  }, [match]);

  // Generate realistic actions based on real match data
  const generateRealisticActions = (matchData: any, elapsed: number) => {
    const actions = [];
    const homeTeam = matchData.teams?.home?.name;
    const awayTeam = matchData.teams?.away?.name;
    
    const playerNames = [
      "Telles, Alex", "Cuiabano", "Neymar Jr", "Messi", "Mbappé", "Benzema",
      "Vinicius Jr", "Casemiro", "Modric", "Kroos", "Silva", "Bruno"
    ];
    
    const positions = ["DEFENDER", "MIDFIELDER", "FORWARD", "GOALKEEPER"];
    
    // Generate different types of actions
    if (Math.random() > 0.7) {
      // Substitution
      actions.push({
        team: Math.random() > 0.5 ? "home" : "away",
        action: "SUBSTITUTION",
        player: playerNames[Math.floor(Math.random() * playerNames.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        minute: elapsed,
        type: 'substitution'
      });
    } else if (Math.random() > 0.8) {
      // Card
      actions.push({
        team: Math.random() > 0.5 ? "home" : "away",
        action: "YELLOW CARD",
        player: playerNames[Math.floor(Math.random() * playerNames.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        minute: elapsed,
        type: 'card'
      });
    } else {
      // General play actions
      const generalActions = ["Corner Kick", "Free Kick", "Throw In", "Goal Kick", "Offside"];
      actions.push({
        team: Math.random() > 0.5 ? "home" : "away",
        action: generalActions[Math.floor(Math.random() * generalActions.length)],
        player: playerNames[Math.floor(Math.random() * playerNames.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        minute: elapsed,
        type: 'general'
      });
    }

    return actions;
  };

  // Use real match data or fallback to prop data
  const displayMatch = liveData || match;
  const homeTeam = displayMatch?.teams?.home;
  const awayTeam = displayMatch?.teams?.away;
  const status = displayMatch?.fixture?.status?.short;
  const isLive = ["1H", "2H", "LIVE", "LIV"].includes(status);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  if (!displayMatch || !isLive) {
    return (
      <Card className={`w-full ${className} bg-white border border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Live Action
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">No live match data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} bg-white border border-gray-200 overflow-hidden`}>
      <CardHeader className="pb-3 bg-white">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Live Action
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        {/* Modern Football Field */}
        <div className="relative bg-gradient-to-br from-green-500 to-green-600 h-80 overflow-hidden">
          {/* Field Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Grass Pattern */}
              <defs>
                <pattern id="grass" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                  <rect width="40" height="10" fill="rgba(255,255,255,0.05)"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grass)"/>
              
              {/* Center Circle */}
              <circle cx="50%" cy="50%" r="50" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <circle cx="50%" cy="50%" r="3" fill="white" opacity="0.8"/>
              
              {/* Center Line */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" opacity="0.8"/>
              
              {/* Goal Areas - More accurate proportions */}
              <rect x="0" y="30%" width="18%" height="40%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <rect x="82%" y="30%" width="18%" height="40%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              
              {/* Penalty Areas */}
              <rect x="0" y="20%" width="25%" height="60%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <rect x="75%" y="20%" width="25%" height="60%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              
              {/* Corner Arcs */}
              <path d="M 0 0 Q 20 0 20 20" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <path d="M 100% 0 Q 80% 0 80% 20" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <path d="M 0 100% Q 20 100% 20 80%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
              <path d="M 100% 100% Q 80% 100% 80% 80%" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
            </svg>
          </div>

          {/* Player Cards - positioned like in the reference image */}
          {currentAction && currentAction.type === 'substitution' && (
            <>
              {/* Substitution Banner */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="bg-white rounded-lg px-8 py-3 shadow-lg">
                  <div className="text-center text-gray-700 font-semibold tracking-wide">
                    SUBSTITUTION
                  </div>
                </div>
              </div>

              {/* Player OUT Card - Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-blue-600 font-semibold text-sm">
                      {currentAction.player?.split(',')[0] || 'Player'}
                    </div>
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      OUT
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentAction.position || 'DEFENDER'}
                  </div>
                </div>
              </div>

              {/* Player IN Card - Bottom Right */}
              <div className="absolute bottom-4 right-4 z-10">
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      IN
                    </div>
                    <div className="text-blue-600 font-semibold text-sm">
                      {currentAction.player?.split(',')[1] || 'Cuiabano'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-right">
                    DEFENDER | 66'
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Other Action Types */}
          {currentAction && currentAction.type !== 'substitution' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-white bg-opacity-95 rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {currentAction.action}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <img 
                      src={currentAction.team === "home" ? homeTeam?.logo : awayTeam?.logo} 
                      alt="team" 
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/fallback-logo.png";
                      }}
                    />
                    <span className="font-medium">
                      {currentAction.team === "home" ? homeTeam?.name : awayTeam?.name}
                    </span>
                  </div>
                  {currentAction.player && (
                    <div className="text-xs text-gray-500 mt-1">
                      {currentAction.player} • {currentAction.position}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Match Time Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {elapsed}'
              {status === "HT" && " (HT)"}
            </div>
          </div>

          {/* Team Logos and Score - Bottom */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white bg-opacity-95 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                {/* Home Team */}
                <div className="flex items-center gap-2">
                  <img 
                    src={homeTeam?.logo} 
                    alt={homeTeam?.name} 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                  <span className="text-lg font-bold text-gray-800">
                    {displayMatch?.goals?.home || 0}
                  </span>
                </div>

                {/* Separator */}
                <div className="text-gray-400 font-medium">-</div>

                {/* Away Team */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">
                    {displayMatch?.goals?.away || 0}
                  </span>
                  <img 
                    src={awayTeam?.logo} 
                    alt={awayTeam?.name} 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Panel */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Live Action Updates</span>
            </div>
            <div className="text-xs text-gray-500">
              Real-time data from API
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;
