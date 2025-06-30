
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';

interface MyMatchEventNewProps {
  fixtureId: string | number;
  apiKey?: string;
  theme?: 'light' | 'dark' | '';
  refreshInterval?: number;
  showErrors?: boolean;
  showLogos?: boolean;
  className?: string;
  homeTeam?: string;
  awayTeam?: string;
}

const MyMatchEventNew: React.FC<MyMatchEventNewProps> = ({
  fixtureId,
  apiKey,
  theme = "",
  refreshInterval = 15,
  showErrors = false,
  showLogos = true,
  className = "",
  homeTeam,
  awayTeam
}) => {
  // Use provided apiKey or fetch from environment
  const effectiveApiKey = apiKey || import.meta.env.VITE_RAPID_API_KEY || "";
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up any existing script and widget
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Only load widget if we have a fixture ID and API key
    if (!fixtureId || !widgetContainerRef.current) {
      setError('No fixture ID provided');
      setIsLoading(false);
      return;
    }

    if (!effectiveApiKey) {
      setError('No API key available. Please configure VITE_RAPID_API_KEY environment variable.');
      setIsLoading(false);
      return;
    }

    const loadWidget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const container = widgetContainerRef.current;
        if (!container) return;

        // Clear the container
        container.innerHTML = '';

        // Create the widget div with all required attributes
        const widgetDiv = document.createElement('div');
        widgetDiv.id = `wg-api-football-game-${fixtureId}`;
        widgetDiv.setAttribute('data-host', 'v3.football.api-sports.io');
        widgetDiv.setAttribute('data-key', effectiveApiKey);
        widgetDiv.setAttribute('data-id', fixtureId.toString());
        widgetDiv.setAttribute('data-theme', theme);
        widgetDiv.setAttribute('data-refresh', Math.max(refreshInterval, 15).toString());
        widgetDiv.setAttribute('data-show-errors', showErrors.toString());
        widgetDiv.setAttribute('data-show-logos', showLogos.toString());

        container.appendChild(widgetDiv);

        // Load the API-Football widget script
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.api-sports.io/2.0.3/widgets.js';
        script.async = true;
        
        script.onload = () => {
          console.log(`✅ API-Football widget loaded successfully for fixture ${fixtureId}`);
          setIsLoading(false);
        };
        
        script.onerror = () => {
          console.error(`❌ Failed to load API-Football widget for fixture ${fixtureId}`);
          setError('Failed to load match events widget');
          setIsLoading(false);
        };

        document.head.appendChild(script);
        scriptRef.current = script;

      } catch (err) {
        console.error('Error loading API-Football widget:', err);
        setError('Error initializing widget');
        setIsLoading(false);
      }
    };

    // Load widget after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(loadWidget, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [fixtureId, effectiveApiKey, theme, refreshInterval, showErrors, showLogos]);

  if (!fixtureId) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            No fixture ID provided for match events
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Match Events & Statistics
          </h3>
          {(homeTeam && awayTeam) && (
            <div className="text-sm text-gray-600">
              {homeTeam} vs {awayTeam}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Live updates every {refreshInterval} seconds • Fixture ID: {fixtureId}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {error ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-1">Widget Error</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium mb-1">Loading Match Events</p>
            <p className="text-gray-500 text-sm">Initializing API-Football widget...</p>
          </div>
        ) : null}
        
        {/* Widget container */}
        <div 
          ref={widgetContainerRef} 
          className="api-football-match-events w-full min-h-[400px]"
          style={{ 
            display: isLoading || error ? 'none' : 'block' 
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MyMatchEventNew;
