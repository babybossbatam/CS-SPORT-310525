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

        {/* Sportradar Widget Container */}
        <div className="relative min-h-96">
          <div 
            ref={widgetRef}
            className="sr-widget sr-widget-lmt w-full"
            style={{ minHeight: '400px' }}
          >
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-3"></div>
                <p>Loading Live Match Tracker...</p>
                <p className="text-xs mt-1 opacity-60">
                  {homeTeamData?.name} vs {awayTeamData?.name}
                </p>
              </div>
            </div>
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