
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import TodaysMatchesByCountryNew from './TodaysMatchesByCountryNew';

const MyAllLeague: React.FC = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="p-4 border-b border-stone-200">
        <h3
          className="font-medium text-gray-900"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "13.3px",
          }}
        >
          All Leagues A-Z
        </h3>
        <p
          className="text-gray-600 text-xs"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          Football
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <TodaysMatchesByCountryNew 
          selectedDate={selectedDate}
          onMatchCardClick={(fixture) => {
            console.log('Match clicked:', fixture);
            // Handle match click if needed
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MyAllLeague;
