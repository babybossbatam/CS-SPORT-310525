import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Component to embed the AiScore UEFA Europa League schedule widget
 */
export const EuropaLeagueSchedule: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Create the iframe element
        const iframe = document.createElement('iframe');
        if (iframe) {
          iframe.src = 'https://www.aiscore.com/tournament-uefa-europa-league/2jr7owi6es1q0em/schedule?isplugin=true';
          iframe.height = '226';
          iframe.width = '100%';
          iframe.scrolling = 'auto';
          
          // Use optional chaining to safely set frameBorder
          if (iframe.frameBorder !== undefined) {
            iframe.frameBorder = '0';
          }
          
          if (iframe.style) {
            iframe.style.border = '0';
          }
          
          // Clear previous content and append the iframe
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(iframe);
          }
        }
      } catch (error) {
        console.error("Error creating iframe:", error);
      }
    }
  }, []);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <h3 className="font-bold text-lg">UEFA Europa League Schedule</h3>
          <p className="text-xs text-blue-100">Powered by AiScore</p>
        </div>
        <div ref={containerRef} className="europa-league-schedule" style={{ margin: 0, padding: 0 }}></div>
      </CardContent>
    </Card>
  );
};

export default EuropaLeagueSchedule;