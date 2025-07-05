
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/MyLiveTrackerNew.css';

declare global {
  interface Window {
    SIR: any;
  }
}

interface MyLiveTrackerNewProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  isLive?: boolean;
  className?: string;
}

const MyLiveTrackerNew: React.FC<MyLiveTrackerNewProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  isLive = false,
  className = ""
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetInitializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportradarMatchId, setSportradarMatchId] = useState<number>(61239863); // Default fallback

  // Fetch Sportradar match ID when component mounts
  useEffect(() => {
    const fetchSportradarMatchId = async () => {
      if (matchId && isLive) {
        try {
          console.log('🔍 [MyLiveTrackerNew] Mapping RapidAPI match ID to Sportradar:', matchId);
          
          const response = await fetch(`/api/sportsradar/match-id/${matchId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.sportradarMatchId) {
              console.log('✅ [MyLiveTrackerNew] Mapped to Sportradar match ID:', data.sportradarMatchId);
              setSportradarMatchId(data.sportradarMatchId);
              return;
            }
          }
        } catch (error) {
          console.warn('⚠️ [MyLiveTrackerNew] Failed to map Sportradar match ID:', error);
        }
      }
      
      // Keep default fallback ID
      console.log('🔄 [MyLiveTrackerNew] Using default Sportradar match ID:', sportradarMatchId);
    };

    fetchSportradarMatchId();
  }, [matchId, isLive]);

  // Load and initialize Sportradar widget
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
        script.async = true;
        script.onload = () => {
          console.log('🎯 [MyLiveTrackerNew] Sportradar script loaded successfully');
          scriptLoadedRef.current = true;
          setTimeout(() => {
            initializeWidget();
          }, 1000);
        };
        script.onerror = () => {
          console.error('🚫 [MyLiveTrackerNew] Failed to load Sportradar script');
          setError('Failed to load Sportradar script');
          setIsLoading(false);
        };
        script.src = "https://widgets.sir.sportradar.com/GyxLqseloLhoo4ietUKotcYT89QjqHuYS6xDNAyY/widgetloader";
        
        document.head.appendChild(script);

      } catch (error) {
        console.error('🚫 [MyLiveTrackerNew] Error loading Sportradar script:', error);
        setError('Failed to load Sportradar widget');
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      console.log('🔄 [MyLiveTrackerNew] Attempting widget initialization...', {
        hasSIR: !!window.SIR,
        hasWidgetRef: !!widgetRef.current,
        isInitialized: widgetInitializedRef.current,
        sportradarMatchId
      });

      if (window.SIR && widgetRef.current && !widgetInitializedRef.current) {
        try {
          console.log('🎯 [MyLiveTrackerNew] Initializing Sportradar widget with matchId:', sportradarMatchId);
          
          // Clear any existing content
          widgetRef.current.innerHTML = '';
          
          // Initialize widget with enhanced configuration
          window.SIR("addWidget", ".sr-widget-live-tracker-new", "match.lmtPlus", {
            streamToggle: "streamSwitchTabs",
            activeStreamToggle: "stream",
            showOdds: true,
            layout: "topdown",
            detailedScoreboard: "disable",
            tabsPosition: "disable",
            logoLink: "www.cssport.vip",
            matchId: sportradarMatchId,
            theme: false,
            language: "en"
          });
          
          widgetInitializedRef.current = true;
          setIsLoading(false);
          setError(null);
          console.log('✅ [MyLiveTrackerNew] Sportradar widget initialized successfully');
          
        } catch (error) {
          console.error('🚫 [MyLiveTrackerNew] Error initializing Sportradar widget:', error);
          setError('Failed to initialize widget: ' + (error as Error).message);
          setIsLoading(false);
        }
      } else if (!window.SIR && scriptLoadedRef.current) {
        console.error('🚫 [MyLiveTrackerNew] SIR not available after script loaded');
        setError('Sportradar widget not available');
        setIsLoading(false);
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

  return (
    <div className={`my-live-tracker-new-container ${className}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLive && (
                <div className="relative">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-20"></div>
                </div>
              )}
              <span className="text-white text-sm font-semibold">
                Live Match Tracker Plus
              </span>
              {isLive && (
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  LIVE
                </span>
              )}
            </div>
            <div className="text-xs text-blue-100">
              Powered by Sportradar
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="my-live-tracker-new-loading p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading live match tracker...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Sportradar Widget Container */}
        <div className="relative">
          <div 
            ref={widgetRef}
            className="sr-widget sr-widget-live-tracker-new w-full"
            style={{ minHeight: '450px' }}
          >
            {/* Widget will be injected here by Sportradar */}
          </div>

          {/* Cover overlay for loading */}
          {isLoading && (
            <div className="my-live-tracker-new-cover absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-gray-600 text-xs">Initializing tracker...</p>
              </div>
            </div>
          )}

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

export default MyLiveTrackerNew;
