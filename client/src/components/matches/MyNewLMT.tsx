
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/sportradar-theme.css';

interface MyNewLMTProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

// Extend window object for Sportradar
declare global {
  interface Window {
    SIR: any;
  }
}

const MyNewLMT: React.FC<MyNewLMTProps> = ({ 
  matchId, 
  homeTeam,
  awayTeam,
  status,
  className = ""
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const widgetInitializedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a real match ID from your live fixtures or fallback to demo
  const sportradarMatchId = matchId || 1330692; // Using one of your live match IDs

  // Determine if match is currently live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  useEffect(() => {
    const loadSportradarWidget = () => {
      try {
        // Check if script already exists
        if (document.querySelector('script[src*="widgets.sir.sportradar.com"]')) {
          scriptLoadedRef.current = true;
          initializeWidget();
          return;
        }

        // Create and load the Sportradar script
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
        scriptLoadedRef.current = true;

        // Wait a bit for the script to load and then initialize
        setTimeout(() => {
          initializeWidget();
        }, 1000);

      } catch (error) {
        console.error('🚫 [MyNewLMT] Error loading Sportradar script:', error);
        setError('Failed to load Sportradar widget');
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      if (window.SIR && widgetRef.current && !widgetInitializedRef.current) {
        try {
          console.log('🎯 [MyNewLMT] Initializing Sportradar widget with matchId:', sportradarMatchId);
          
          window.SIR("addWidget", ".sr-widget-new-lmt", "match.lmtPlus", {
            streamToggle: "streamSwitchTabs",
            activeStreamToggle: "stream",
            showOdds: true,
            layout: "topdown",
            detailedScoreboard: "disable",
            tabsPosition: "disable",
            logoLink: "www.cssport.vip",
            matchId: sportradarMatchId
          });
          
          widgetInitializedRef.current = true;
          setIsLoading(false);
          setError(null);
          console.log('✅ [MyNewLMT] Sportradar widget initialized successfully');
        } catch (error) {
          console.error('🚫 [MyNewLMT] Error initializing Sportradar widget:', error);
          setError('Failed to initialize widget');
          setIsLoading(false);
        }
      } else {
        // Retry initialization after a short delay
        setTimeout(() => {
          if (window.SIR && !widgetInitializedRef.current) {
            initializeWidget();
          }
        }, 500);
      }
    };

    loadSportradarWidget();

    return () => {
      // Cleanup - reset initialization flag
      widgetInitializedRef.current = false;
    };
  }, [sportradarMatchId]);

  const homeTeamData = homeTeam;
  const awayTeamData = awayTeam;

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">Live Match Tracker</span>
          </div>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-1">Widget Error</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} sportradar-new-lmt-widget`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLive && (
                <div className="relative">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
                </div>
              )}
              <span className="text-gray-800 text-sm font-semibold">
                Live Match Tracker
              </span>
              {isLive && (
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  LIVE
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Powered by Sportradar
            </div>
          </div>
        </div>

        {/* Widget Container */}
        <div className="relative min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading Live Match Tracker...</p>
                {homeTeamData && awayTeamData && (
                  <p className="text-xs mt-1 opacity-80">
                    {homeTeamData?.name || homeTeamData} vs {awayTeamData?.name || awayTeamData}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sportradar Widget */}
          <div 
            ref={widgetRef}
            className="sr-widget sr-widget-new-lmt w-full"
            style={{ minHeight: '500px' }}
          >
            {/* Widget will be injected here by Sportradar */}
          </div>

          {/* Success indicator when widget is loaded */}
          {widgetInitializedRef.current && !isLoading && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs z-20">
              ✓ Live Data
            </div>
          )}
        </div>

        {/* Match Info Footer */}
        {(homeTeamData || awayTeamData) && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div>
                {homeTeamData?.name || homeTeamData} vs {awayTeamData?.name || awayTeamData}
              </div>
              <div>
                Match ID: {sportradarMatchId}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNewLMT;
