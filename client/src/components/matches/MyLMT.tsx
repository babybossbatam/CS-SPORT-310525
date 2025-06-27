
import React, { useEffect, useRef, useState } from 'react';

interface MyLMTProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
  sportradarMatchId?: number;
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

  // Determine if match is currently live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

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
        // Use the provided sportradarMatchId or fallback to demo
        const useMatchId = sportradarMatchId || matchId || 61239863;
        
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

        {/* Sportradar Widget Container */}
        <div className="relative min-h-96">
          <div 
            ref={widgetRef}
            className="sr-widget sr-widget-lmt w-full"
            style={{ minHeight: '400px' }}
          >
            {!widgetInitialized && !error && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500 mx-auto mb-3"></div>
                  <p>Loading Live Match Tracker...</p>
                  <p className="text-xs mt-1 opacity-60">
                    {homeTeamData?.name} vs {awayTeamData?.name}
                  </p>
                  <p className="text-xs mt-1 opacity-40">
                    Match ID: {sportradarMatchId || matchId || 61239863}
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm mb-1">Widget unavailable</p>
                  <p className="text-xs opacity-60">
                    {homeTeamData?.name} vs {awayTeamData?.name}
                  </p>
                  <p className="text-xs mt-2 opacity-40">
                    This match may not be covered by Sportradar
                  </p>
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
