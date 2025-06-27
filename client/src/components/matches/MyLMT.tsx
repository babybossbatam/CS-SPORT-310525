import React, { useEffect, useRef } from 'react';

interface MyLMTProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
  sportradarMatchId?: number; // Sportradar specific match ID
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
  sportradarMatchId = 61239863 // Default match ID from the demo
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  // Determine if match is currently live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  useEffect(() => {
    if (!isLive || !widgetRef.current) return;

    const loadSportradarWidget = () => {
      // Check if Sportradar script is already loaded
      if (window.SIR && !scriptLoadedRef.current) {
        initializeWidget();
        return;
      }

      // Load Sportradar script if not already loaded
      if (!document.querySelector('script[src*="sportradar.com"]')) {
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

        // Wait for script to load and initialize
        setTimeout(() => {
          if (window.SIR) {
            initializeWidget();
          }
        }, 1000);
      }
    };

    const initializeWidget = () => {
      if (window.SIR && widgetRef.current && !scriptLoadedRef.current) {
        try {
          window.SIR("addWidget", ".sr-widget-lmt", "match.lmtPlus", {
            layout: "topdown", 
            scoreboardLargeJerseys: true,
            matchId: sportradarMatchId
          });
          scriptLoadedRef.current = true;
        } catch (error) {
          console.error('Error initializing Sportradar widget:', error);
        }
      }
    };

    loadSportradarWidget();

    return () => {
      // Cleanup if needed
      scriptLoadedRef.current = false;
    };
  }, [isLive, sportradarMatchId]);

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
        </div>

        {/* Enhanced Match Tracker with Football Pitch */}
        <div className="relative bg-gradient-to-b from-green-400 to-green-600 p-4" style={{ minHeight: '300px' }}>
          {/* Football Pitch Background */}
          <div className="absolute inset-0 bg-green-500 opacity-90">
            {/* Pitch markings */}
            <svg className="w-full h-full" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              {/* Outer boundary */}
              <rect x="20" y="20" width="360" height="260" fill="none" stroke="white" strokeWidth="2"/>
              
              {/* Center line */}
              <line x1="200" y1="20" x2="200" y2="280" stroke="white" strokeWidth="2"/>
              
              {/* Center circle */}
              <circle cx="200" cy="150" r="30" fill="none" stroke="white" strokeWidth="2"/>
              <circle cx="200" cy="150" r="2" fill="white"/>
              
              {/* Left penalty area */}
              <rect x="20" y="80" width="60" height="140" fill="none" stroke="white" strokeWidth="2"/>
              <rect x="20" y="110" width="20" height="80" fill="none" stroke="white" strokeWidth="2"/>
              
              {/* Right penalty area */}
              <rect x="320" y="80" width="60" height="140" fill="none" stroke="white" strokeWidth="2"/>
              <rect x="360" y="110" width="20" height="80" fill="none" stroke="white" strokeWidth="2"/>
              
              {/* Left goal */}
              <rect x="15" y="130" width="10" height="40" fill="none" stroke="white" strokeWidth="2"/>
              
              {/* Right goal */}
              <rect x="375" y="130" width="10" height="40" fill="none" stroke="white" strokeWidth="2"/>
            </svg>
          </div>

          {/* Team Information Overlay */}
          <div className="relative z-10 flex justify-between items-center h-full">
            {/* Home Team */}
            <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  {homeTeamData?.name?.charAt(0) || 'H'}
                </div>
                <p className="text-sm font-semibold truncate max-w-20">
                  {homeTeamData?.name || 'Home'}
                </p>
              </div>
            </div>

            {/* Match Status */}
            <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">
                {status === '1H' && '1ST HALF'}
                {status === '2H' && '2ND HALF'}
                {status === 'HT' && 'HALF TIME'}
                {status === 'FT' && 'FULL TIME'}
                {!['1H', '2H', 'HT', 'FT'].includes(status || '') && 'LIVE'}
              </div>
              <div className="text-xs opacity-80 mt-1">
                Match Tracker Active
              </div>
            </div>

            {/* Away Team */}
            <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  {awayTeamData?.name?.charAt(0) || 'A'}
                </div>
                <p className="text-sm font-semibold truncate max-w-20">
                  {awayTeamData?.name || 'Away'}
                </p>
              </div>
            </div>
          </div>

          {/* Sportradar Widget Integration */}
          <div 
            ref={widgetRef}
            className="sr-widget sr-widget-lmt absolute inset-0 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300"
          >
            {/* Widget will overlay when loaded */}
          </div>

          {/* Loading State */}
          {!scriptLoadedRef.current && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-3"></div>
                <p className="text-sm">Loading Live Match Tracker...</p>
                <p className="text-xs mt-1 opacity-80">
                  {homeTeamData?.name} vs {awayTeamData?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          <div className="flex justify-center gap-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
              Match Stats
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
              Live Events
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
              Team Lineups
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced CSS for 365scores-like styling */}
      <style jsx>{`
        .sr-bb {
          font-family: "Roboto", "Noto", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
          text-align: left;
          background: transparent;
        }

        .sr-bb .srt-primary-1 {
          background-color: rgba(255, 0, 0, 0.9);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.16);
        }

        .sr-bb .srt-base-1 {
          background-color: rgba(0, 0, 0, 0.7);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .sr-bb .srt-home-1 {
          background-color: rgba(0, 0, 60, 0.9);
          color: #ffffff;
          border-color: #00003c;
        }

        .sr-bb .srt-away-1 {
          background-color: rgba(255, 0, 0, 0.9);
          color: #ffffff;
          border-color: #ff0000;
        }

        /* Football pitch animation */
        @keyframes grass-wave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .football-pitch {
          background: linear-gradient(45deg, #22c55e, #16a34a, #15803d);
          background-size: 200% 200%;
          animation: grass-wave 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MyLMT;