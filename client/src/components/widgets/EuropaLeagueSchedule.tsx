import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const EuropaLeagueSchedule = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Schedule widget removed to prevent iframe errors
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div class="text-center py-4">
          <p class="text-sm text-gray-500">Match schedule temporarily unavailable</p>
        </div>
      `;
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <div ref={containerRef} className="min-h-[226px] flex items-center justify-center">
          {error && (
            <p className="text-sm text-gray-500">Unable to load schedule</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EuropaLeagueSchedule;