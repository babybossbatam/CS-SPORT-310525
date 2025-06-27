
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
  const [sportradarMatchId, setSportradarMatchId] = useState<number>(61239863); // Default fallback

  // Determine if match is currently live
  const isLive = status && ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(status);

  // Fetch Sportradar match ID when component mounts
  useEffect(() => {
    const fetchSportradarMatchId = async () => {
      if (matchId && isLive) {
        try {
          console.log('🔍 [MyNewLMT] Mapping RapidAPI match ID to Sportradar:', matchId);
          
          // Use the new mapping endpoint
          const response = await fetch(`/api/sportsradar/match-id/${matchId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.sportradarMatchId) {
              console.log('✅ [MyNewLMT] Mapped to Sportradar match ID:', data.sportradarMatchId);
              if (data.fallback) {
                console.log('⚠️ [MyNewLMT] Using fallback match ID');
              } else {
                console.log('🎯 [MyNewLMT] Found exact match:', data.matchedTeams);
              }
              setSportradarMatchId(data.sportradarMatchId);
              return;
            }
          }
        } catch (error) {
          console.warn('⚠️ [MyNewLMT] Failed to map Sportradar match ID:', error);
        }
      }
      
      // Fallback to working match ID
      console.log('🔄 [MyNewLMT] Using default fallback Sportradar match ID');
      setSportradarMatchId(61239863);
    };

    fetchSportradarMatchId();
  }, [matchId, isLive]);

  useEffect(() => {
    const loadSportradarWidget = () => {
      try {
        // Check if script already exists
        if (document.querySelector('script[src*="widgets.sir.sportradar.com"]')) {
          scriptLoadedRef.current = true;
          initializeWidget();
          return;
        }

        // Create and load the Sportradar script properly
        const script = document.createElement('script');
        script.async = true;
        script.onload = () => {
          console.log('🎯 [MyNewLMT] Sportradar script loaded successfully');
          scriptLoadedRef.current = true;
          // Wait for SIR to be available
          setTimeout(() => {
            initializeWidget();
          }, 2000);
        };
        script.onerror = () => {
          console.error('🚫 [MyNewLMT] Failed to load Sportradar script');
          setError('Failed to load Sportradar script');
          setIsLoading(false);
        };
        script.src = "https://widgets.sir.sportradar.com/684f7b877efd1cd0e619d23b/widgetloader";
        
        document.head.appendChild(script);

      } catch (error) {
        console.error('🚫 [MyNewLMT] Error loading Sportradar script:', error);
        setError('Failed to load Sportradar widget');
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      console.log('🔄 [MyNewLMT] Attempting widget initialization...', {
        hasSIR: !!window.SIR,
        hasWidgetRef: !!widgetRef.current,
        isInitialized: widgetInitializedRef.current,
        matchId: sportradarMatchId
      });

      if (window.SIR && widgetRef.current && !widgetInitializedRef.current) {
        try {
          console.log('🎯 [MyNewLMT] Initializing Sportradar widget with matchId:', sportradarMatchId);
          
          // Clear any existing content
          widgetRef.current.innerHTML = '';
          
          window.SIR("addWidget", ".sr-widget-new-lmt", "match.lmtPlus", {
            layout: "topdown",
            scoreboardLargeJerseys: true,
            matchId: sportradarMatchId,
            theme: false,
            language: "en"
          });
          
          widgetInitializedRef.current = true;
          setIsLoading(false);
          setError(null);
          console.log('✅ [MyNewLMT] Sportradar widget initialized successfully');
          
          // Check if widget content appears after a delay
          setTimeout(() => {
            if (widgetRef.current && widgetRef.current.children.length === 0) {
              console.warn('⚠️ [MyNewLMT] Widget container is empty after initialization');
              // Try a different match ID if the current one fails
              if (sportradarMatchId === matchId) {
                console.log('🔄 [MyNewLMT] Trying fallback match ID...');
                widgetInitializedRef.current = false;
                // Use the working match ID from MyLMT
                const fallbackMatchId = 61239863;
                window.SIR("addWidget", ".sr-widget-new-lmt", "match.lmtPlus", {
                  layout: "topdown",
                  scoreboardLargeJerseys: true,
                  matchId: fallbackMatchId,
                  theme: false,
                  language: "en"
                });
                widgetInitializedRef.current = true;
              } else {
                setError('No live match data available');
              }
            }
          }, 5000);
          
        } catch (error) {
          console.error('🚫 [MyNewLMT] Error initializing Sportradar widget:', error);
          setError('Failed to initialize widget: ' + (error as Error).message);
          setIsLoading(false);
        }
      } else if (!window.SIR && scriptLoadedRef.current) {
        console.error('🚫 [MyNewLMT] SIR not available after script loaded');
        setError('Sportradar widget not available');
        setIsLoading(false);
      } else if (!widgetInitializedRef.current) {
        console.log('🔄 [MyNewLMT] Waiting for conditions...');
        // Retry initialization after a short delay
        setTimeout(() => {
          if (!widgetInitializedRef.current) {
            initializeWidget();
          }
        }, 1000);
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
                <div className="text-xs mt-2 space-y-1">
                  <p className="text-blue-500">
                    {scriptLoadedRef.current ? '✓ Script Loaded' : '⟳ Loading Script...'}
                  </p>
                  <p className="text-orange-500">
                    Match ID: {sportradarMatchId}
                  </p>
                  <p className="text-green-500">
                    {widgetInitializedRef.current ? '✓ Widget Ready' : '⟳ Initializing Widget...'}
                  </p>
                </div>
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
