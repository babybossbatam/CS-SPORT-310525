
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MyLiveActionProps {
  match?: any;
  className?: string;
}

const MyLiveAction = ({ match, className = "" }: MyLiveActionProps) => {
  const [currentAction, setCurrentAction] = useState<{
    team: string;
    action: string;
    player?: string;
    position?: string;
    minute?: number;
  } | null>(null);

  // Sample live actions for demonstration
  const liveActions = [
    { team: "home", action: "Attacking", player: "Neymar Jr", position: "Forward", minute: 23 },
    { team: "away", action: "Defending", player: "Thiago Silva", position: "Defender", minute: 23 },
    { team: "home", action: "Shot on Goal", player: "Lionel Messi", position: "Midfielder", minute: 24 },
    { team: "away", action: "Corner Kick", player: "Casemiro", position: "Midfielder", minute: 25 },
    { team: "home", action: "Free Kick", player: "Sergio Ramos", position: "Defender", minute: 26 },
  ];

  // Simulate live action updates
  useEffect(() => {
    if (!match) return;

    const status = match?.fixture?.status?.short;
    const isLive = ["1H", "2H", "LIVE", "LIV"].includes(status);

    if (isLive) {
      const interval = setInterval(() => {
        const randomAction = liveActions[Math.floor(Math.random() * liveActions.length)];
        setCurrentAction(randomAction);
      }, 8000); // Update every 8 seconds

      return () => clearInterval(interval);
    }
  }, [match]);

  // Get team data
  const homeTeam = match?.teams?.home;
  const awayTeam = match?.teams?.away;
  const status = match?.fixture?.status?.short;
  const isLive = ["1H", "2H", "LIVE", "LIV"].includes(status);

  if (!match || !isLive) {
    return (
      <Card className={`w-full ${className} bg-gradient-to-br from-green-50 to-green-100`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-600 font-normal flex items-center gap-2">
            Live Action
            <Badge variant="outline" className="text-xs">
              No Live Match
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">No live match data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} bg-gradient-to-br from-green-50 to-green-100 overflow-hidden`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-600 font-normal flex items-center gap-2">
          Live Action
          <Badge variant="destructive" className="text-xs animate-pulse">
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Football Field */}
        <div className="relative bg-gradient-to-br from-green-400 to-green-600 h-64 overflow-hidden">
          {/* Field Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Center Circle */}
              <circle cx="50%" cy="50%" r="40" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <circle cx="50%" cy="50%" r="2" fill="white" opacity="0.6"/>
              
              {/* Center Line */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" opacity="0.6"/>
              
              {/* Goal Areas */}
              <rect x="0" y="35%" width="15%" height="30%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <rect x="85%" y="35%" width="15%" height="30%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              
              {/* Penalty Areas */}
              <rect x="0" y="25%" width="25%" height="50%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <rect x="75%" y="25%" width="25%" height="50%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              
              {/* Corner Arcs */}
              <path d="M 0 0 Q 15 0 15 15" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <path d="M 100% 0 Q 85% 0 85% 15" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <path d="M 0 100% Q 15 100% 15 85%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
              <path d="M 100% 100% Q 85% 100% 85% 85%" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
            </svg>
          </div>

          {/* Live Action Display */}
          {currentAction && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-lg p-4 text-center text-white backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold">{currentAction.action}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <img 
                    src={currentAction.team === "home" ? homeTeam?.logo : awayTeam?.logo} 
                    alt="team" 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                  <span className="text-sm font-medium">
                    {currentAction.team === "home" ? homeTeam?.name : awayTeam?.name}
                  </span>
                </div>
                {currentAction.player && (
                  <div className="text-xs text-gray-200 mt-1">
                    {currentAction.player} • {currentAction.position}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Indicators */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between items-center">
              {/* Home Team Stats */}
              <div className="bg-white bg-opacity-20 rounded-lg p-2 text-white text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <img 
                    src={homeTeam?.logo} 
                    alt={homeTeam?.name} 
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                  <span className="font-medium">{match?.goals?.home || 0}</span>
                </div>
                <div className="text-[10px] opacity-80">
                  {homeTeam?.name?.length > 8 ? homeTeam.name.substring(0, 8) + '...' : homeTeam?.name}
                </div>
              </div>

              {/* Match Time */}
              <div className="bg-red-500 bg-opacity-90 rounded-lg px-3 py-1 text-white text-xs font-medium backdrop-blur-sm">
                {match?.fixture?.status?.elapsed || 0}'
              </div>

              {/* Away Team Stats */}
              <div className="bg-white bg-opacity-20 rounded-lg p-2 text-white text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{match?.goals?.away || 0}</span>
                  <img 
                    src={awayTeam?.logo} 
                    alt={awayTeam?.name} 
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.png";
                    }}
                  />
                </div>
                <div className="text-[10px] opacity-80">
                  {awayTeam?.name?.length > 8 ? awayTeam.name.substring(0, 8) + '...' : awayTeam?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Top Scorers / Season
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            {/* Home Team Top Scorer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img 
                  src={homeTeam?.logo} 
                  alt={homeTeam?.name} 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
                <div>
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">Neymar Jr</div>
                    <div className="text-[10px]">🇧🇷 #10 | Forward</div>
                  </div>
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-gray-400 font-medium">VS</div>

            {/* Away Team Top Scorer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-xs text-gray-600">
                    <div className="font-medium">Lionel Messi</div>
                    <div className="text-[10px]">🇦🇷 #10 | Forward</div>
                  </div>
                </div>
                <img 
                  src={awayTeam?.logo} 
                  alt={awayTeam?.name} 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.png";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLiveAction;
