import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const EuropaLeagueSchedule = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Match schedule temporarily unavailable</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EuropaLeagueSchedule;