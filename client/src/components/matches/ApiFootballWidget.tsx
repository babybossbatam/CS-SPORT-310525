
import React, { useEffect, useRef } from 'react';

interface ApiFootballWidgetProps {
  fixtureId: string;
  apiKey?: string;
  theme?: 'light' | 'dark';
  refresh?: number;
  showErrors?: boolean;
  showLogos?: boolean;
}

const ApiFootballWidget: React.FC<ApiFootballWidgetProps> = ({
  fixtureId,
  apiKey = "",
  theme = "light",
  refresh = 15,
  showErrors = false,
  showLogos = true
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Clean up any existing script
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Only load widget if we have a fixture ID
    if (!fixtureId || !widgetRef.current) return;

    // Clear the container
    const container = widgetRef.current;
    container.innerHTML = '';

    // Create widget div
    const widgetDiv = document.createElement('div');
    widgetDiv.id = `wg-api-football-game-${fixtureId}`;
    widgetDiv.setAttribute('data-host', 'v3.football.api-sports.io');
    widgetDiv.setAttribute('data-key', apiKey);
    widgetDiv.setAttribute('data-id', fixtureId);
    widgetDiv.setAttribute('data-theme', theme);
    widgetDiv.setAttribute('data-refresh', refresh.toString());
    widgetDiv.setAttribute('data-show-errors', showErrors.toString());
    widgetDiv.setAttribute('data-show-logos', showLogos.toString());

    container.appendChild(widgetDiv);

    // Load script after a short delay to ensure DOM is ready
    const loadScript = () => {
      if (scriptRef.current) return; // Prevent duplicate scripts
      
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://widgets.api-sports.io/2.0.3/widgets.js';
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ API-Football widget loaded for fixture ${fixtureId}`);
      };
      
      script.onerror = () => {
        console.error(`❌ Failed to load API-Football widget for fixture ${fixtureId}`);
        if (container) {
          container.innerHTML = '<div class="p-4 text-center text-gray-500">Failed to load match widget</div>';
        }
      };

      document.head.appendChild(script);
      scriptRef.current = script;
    };

    // Delay script loading to avoid DOM conflicts
    const timeoutId = setTimeout(loadScript, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [fixtureId, apiKey, theme, refresh, showErrors, showLogos]);

  if (!fixtureId) {
    return (
      <div className="p-4 text-center text-gray-500">
        No fixture ID provided for widget
      </div>
    );
  }

  return (
    <div className="api-football-widget-container">
      <div ref={widgetRef} className="min-h-[200px] w-full">
        <div className="flex items-center justify-center p-8 text-gray-500">
          Loading match widget...
        </div>
      </div>
    </div>
  );
};

export default ApiFootballWidget;
