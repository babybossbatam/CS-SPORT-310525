
import React, { useState } from 'react';
import { format } from 'date-fns';
import PaginatedFixturesList from './PaginatedFixturesList';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, RotateCcw } from 'lucide-react';

const PaginatedFixturesExample: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAll, setShowAll] = useState(false);
  const [pageSize, setPageSize] = useState(50);

  const handleDateChange = (days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Paginated Fixtures Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleDateChange(-1)}
                variant="outline"
                size="sm"
              >
                Yesterday
              </Button>
              <Button
                onClick={() => handleDateChange(0)}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Today
              </Button>
              <Button
                onClick={() => handleDateChange(1)}
                variant="outline"
                size="sm"
              >
                Tomorrow
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="mr-1"
                />
                Show all leagues
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Selected date: {selectedDate}
          </div>
        </CardContent>
      </Card>

      <PaginatedFixturesList
        date={selectedDate}
        all={showAll}
        limit={pageSize}
        className="bg-white rounded-lg shadow-sm"
      />
    </div>
  );
};

export default PaginatedFixturesExample;
