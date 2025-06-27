
import React, { useEffect, useRef, useState } from 'react';

interface MyLMTProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
  sportradarMatchId?: number;
}

interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
  };
  player: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface LiveStats {
  possession_home?: number;
  possession_away?: number;
  shots_home?: number;
  shots_away?: number;
  shots_on_target_home?: number;
  shots_on_target_away?: number;
  corners_home?: number;
  corners_away?: number;
  fouls_home?: number;
  fouls_away?: number;
  yellow_cards_home?: number;
  yellow_cards_away?: number;
  red_cards_home?: number;
  red_cards_away?: number;
}

declare global {
  interface Window {
    SIR: any;
  }
}

const MyLMT: React.FC<MyLMTProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = "",
  sportradarMatchId
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({});
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [showEvents, setShowEvents] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Determine if match is currently live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  // Fetch live events and stats (similar to 365scores network calls)
  const fetchLiveData = async () => {
    if (!isLive || !matchId) return;

    try {
      // Fetch match events
      const eventsResponse = await fetch(`/api/fixtures/${matchId}/events`);
      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        setLiveEvents(events || []);
        
        // Update current minute from latest event
        if (events.length > 0) {
          const latestEvent = events[events.length - 1];
          setCurrentMinute(latestEvent.time?.elapsed || 0);
        }
      }

      // Fetch live statistics
      const statsResponse = await fetch(`/api/fixtures/${matchId}/statistics`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData && statsData.length > 0) {
          // Convert stats array to object format
          const formattedStats: LiveStats = {};
          statsData.forEach((teamStats: any) => {
            const isHome = teamStats.team.id === homeTeam?.id;
            teamStats.statistics?.forEach((stat: any) => {
              const statType = stat.type.toLowerCase().replace(/\s+/g, '_');
              const key = `${statType}_${isHome ? 'home' : 'away'}`;
              formattedStats[key as keyof LiveStats] = stat.value;
            });
          });
          setLiveStats(formattedStats);
        }
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  // Fetch live data every 30 seconds (like 365scores)
  useEffect(() => {
    if (!isLive) return;

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);

    return () => clearInterval(interval);
  }, [isLive, matchId]);

  useEffect(() => {
    if (!isLive || !widgetRef.current) return;

    let timeoutId: NodeJS.Timeout;

    const loadSportradarScript = () => {
      // Check if script is already loaded
      if (window.SIR) {
        setScriptLoaded(true);
        initializeWidget();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="sportradar.com"]');
      if (existingScript) {
        // Wait for existing script to load
        timeoutId = setTimeout(() => {
          if (window.SIR) {
            setScriptLoaded(true);
            initializeWidget();
          } else {
            setError('Sportradar script failed to load');
          }
        }, 3000);
        return;
      }

      // Create and load the script
      try {
        const script = document.createElement('script');
        script.innerHTML = `
          (function(a,b,c,d,e,f,g,h,i){a[e]||(i=a[e]=function(){(a[e].q=a[e].q||[]).push(arguments)},i.l=1*new Date,i.o=f,
          g=b.createElement(c),h=b.getElementsByTagName(c)[0],g.async=1,g.src=d,g.setAttribute("n",e),h.parentNode.insertBefore(g,h)
          )})(window,document,"script", "https://widgets.sir.sportradar.com/684f7b877efd1cd0e619d23b/widgetloader", "SIR", {
              theme: false,
              language: "en"
          });
        `;

        document.head.appendChild(script);
        setScriptLoaded(true);

        // Wait for the actual widget loader to be available
        timeoutId = setTimeout(() => {
          if (window.SIR) {
            initializeWidget();
          } else {
            setError('Sportradar widget not available');
          }
        }, 2000);

      } catch (err) {
        console.error('Error loading Sportradar script:', err);
        setError('Failed to load Sportradar script');
      }
    };

    const initializeWidget = () => {
      if (!window.SIR || !widgetRef.current || widgetInitialized) return;

      try {
        // Use the provided match ID - no demo fallback for live matches
        const useMatchId = sportradarMatchId || matchId;
        
        if (!useMatchId) {
          setError('No match ID available');
          return;
        }
        
        console.log('Initializing Sportradar widget with match ID:', useMatchId);
        
        window.SIR("addWidget", ".sr-widget-lmt", "match.lmtPlus", {
          layout: "topdown", 
          scoreboardLargeJerseys: true,
          matchId: useMatchId
        });
        
        setWidgetInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Sportradar widget:', err);
        setError('Failed to initialize widget');
      }
    };

    loadSportradarScript();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLive, sportradarMatchId, matchId, widgetInitialized]);

  const homeTeamData = homeTeam;
  const awayTeamData = awayTeam;

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Match Tracker</span>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <p className="mb-1">Match not live</p>
              <p className="text-xs opacity-60">
                {homeTeamData?.name} vs {awayTeamData?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-gray-800 text-sm font-semibold">Live Match Tracker</span>
            </div>
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              LIVE
            </div>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {error}
            </div>
          )}
        </div>

        {/* 365scores-style Live Action Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => { setShowEvents(true); setShowStats(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                showEvents 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Live Events
            </button>
            <button
              onClick={() => { setShowEvents(false); setShowStats(true); }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                showStats 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Match Stats
            </button>
          </div>
        </div>

        {/* Live Action Content */}
        <div className="relative min-h-96">
          {showEvents && (
            <div className="p-4">
              {/* Live Events Timeline */}
              <div className="space-y-3">
                {liveEvents.length > 0 ? (
                  liveEvents.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full text-xs font-bold">
                          {event.time.elapsed}'
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {event.type === 'Goal' && (
                            <span className="text-green-600">⚽</span>
                          )}
                          {event.type === 'Card' && (
                            <span className={event.detail === 'Yellow Card' ? 'text-yellow-500' : 'text-red-500'}>
                              {event.detail === 'Yellow Card' ? '🟨' : '🟥'}
                            </span>
                          )}
                          {event.type === 'subst' && (
                            <span className="text-blue-600">🔄</span>
                          )}
                          <span className="font-medium text-sm">
                            {event.player?.name || 'Unknown Player'}
                          </span>
                          <span className="text-xs text-gray-500">
                            - {event.team?.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {event.detail} {event.comments && `(${event.comments})`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No live events yet</p>
                    <p className="text-xs mt-1">Events will appear here as the match progresses</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showStats && (
            <div className="p-4">
              {/* Live Statistics */}
              <div className="space-y-4">
                {/* Possession */}
                {(liveStats.possession_home || liveStats.possession_away) && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Possession</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold w-8">{liveStats.possession_home || 0}%</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${liveStats.possession_home || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8">{liveStats.possession_away || 0}%</span>
                    </div>
                  </div>
                )}

                {/* Other Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Shots</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{liveStats.shots_home || 0}</span>
                      <span className="text-sm font-bold">{liveStats.shots_away || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">On Target</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{liveStats.shots_on_target_home || 0}</span>
                      <span className="text-sm font-bold">{liveStats.shots_on_target_away || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Corners</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{liveStats.corners_home || 0}</span>
                      <span className="text-sm font-bold">{liveStats.corners_away || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Fouls</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{liveStats.fouls_home || 0}</span>
                      <span className="text-sm font-bold">{liveStats.fouls_away || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Yellow Cards</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{liveStats.yellow_cards_home || 0}</span>
                      <span className="text-sm font-bold">{liveStats.yellow_cards_away || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Red Cards</div>
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-red-600">{liveStats.red_cards_home || 0}</span>
                      <span className="text-sm font-bold text-red-600">{liveStats.red_cards_away || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sportradar Widget (Hidden when showing custom live action) */}
          <div 
            ref={widgetRef}
            className={`sr-widget sr-widget-lmt w-full ${(showEvents || showStats) ? 'hidden' : ''}`}
            style={{ minHeight: '400px' }}
          >
            {!widgetInitialized && !error && !(showEvents || showStats) && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-3"></div>
                  <p>Loading Live Match Tracker...</p>
                  <p className="text-xs mt-1 opacity-60">
                    {homeTeamData?.name} vs {awayTeamData?.name}
                  </p>
                  {(sportradarMatchId || matchId) && (
                    <p className="text-xs mt-1 opacity-40">
                      Match ID: {sportradarMatchId || matchId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Include the custom CSS for Sportradar theming */}
      <style jsx>{`
        .sr-bb {
          font-family: "Roboto", "Noto", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
          text-align: left;
          background: #FFFFFF;
        }
        
        .sr-bb .srt-primary-1 {
          background-color: #FF0000;
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.16);
        }
        
        .sr-bb .srt-base-1 {
          background-color: transparent;
          color: #000000;
          border-color: rgba(0, 0, 0, 0.12);
        }
        
        .sr-bb .srt-home-1 {
          background-color: #00003c;
          color: #ffffff;
          border-color: #00003c;
        }
        
        .sr-bb .srt-away-1 {
          background-color: #ff0000;
          color: #ffffff;
          border-color: #ff0000;
        }
      `}</style>
    </div>
  );
};

export default MyLMT;
