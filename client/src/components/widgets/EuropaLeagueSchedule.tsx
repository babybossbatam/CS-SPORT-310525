import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Component to embed the AiScore UEFA Europa League schedule widget
 */
export const EuropaLeagueSchedule: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const createIframe = () => {
      if (!containerRef.current) return;
      
      try {
        // Create the iframe element using a safer approach
        const iframe = document.createElement('iframe');
        
        // Set properties with proper type checking
        iframe.src = 'https://www.aiscore.com/tournament-uefa-europa-league/2jr7owi6es1q0em/schedule?isplugin=true';
        iframe.height = '226';
        iframe.width = '100%';
        
        // Set scrolling and border properties safely
        if ('scrolling' in iframe) {
          iframe.scrolling = 'auto';
        }
        
        // Use setAttribute for frameBorder to avoid type issues
        iframe.setAttribute('frameBorder', '0');
        
        // Set style properties safely
        if (iframe.style) {
          iframe.style.border = '0';
        }
        
        // Remove all event handlers from the iframe
        iframe.onload = null;
        iframe.onerror = null;
        
        // Clear existing content safely
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(iframe);
        }
      } catch (error) {
        console.error("Error creating iframe:", error);
        setError(true);
      }
    };
    
    // Delay iframe creation to avoid potential timing issues
    const timer = setTimeout(createIframe, 100);
    
    return () => {
      clearTimeout(timer);
      // Clean up - remove iframe if component unmounts
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <h3 className="font-bold text-lg">UEFA Europa League Schedule</h3>
          <p className="text-xs text-blue-100">Powered by AiScore</p>
        </div>
        
        {error ? (
          <div className="p-4 text-center text-gray-500">
            <p>Unable to load Europa League schedule.</p>
          </div>
        ) : (
          <div ref={containerRef} className="europa-league-schedule" style={{ margin: 0, padding: 0 }}></div>
        )}
      </CardContent>
    </Card>
  );
};

export default EuropaLeagueSchedule;