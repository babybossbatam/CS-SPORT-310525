
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import MyMainLayout from "@/components/layout/MyMainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ExtendedDateRangeDemo: React.FC = () => {
  const [dateRangeMode, setDateRangeMode] = useState<'single' | 'extended'>('single');
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  
  // For demo purposes, we'll use empty fixtures array
  // In real implementation, you'd fetch from multiple dates
  const demoFixtures: any[] = [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Extended Date Range Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={dateRangeMode === 'single' ? 'default' : 'outline'}
              onClick={() => setDateRangeMode('single')}
            >
              Single Date
            </Button>
            <Button
              variant={dateRangeMode === 'extended' ? 'default' : 'outline'}
              onClick={() => setDateRangeMode('extended')}
            >
              ±2 Days Range
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Selected Date:</strong> {selectedDate}</p>
            <p><strong>Mode:</strong> {dateRangeMode === 'single' ? 'Single date filtering' : 'Extended range (±2 days)'}</p>
            <p><strong>Timezone:</strong> UTC (original from API, no conversion)</p>
          </div>
          
          {dateRangeMode === 'extended' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Extended Mode Active:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Shows matches from {selectedDate && (() => {
                  const date = new Date(selectedDate + 'T00:00:00Z');
                  const before = new Date(date);
                  before.setDate(before.getDate() - 2);
                  return before.toISOString().substring(0, 10);
                })()} to {selectedDate && (() => {
                  const date = new Date(selectedDate + 'T00:00:00Z');
                  const after = new Date(date);
                  after.setDate(after.getDate() + 2);
                  return after.toISOString().substring(0, 10);
                })()}</li>
                <li>• Preserves original UTC timezone from API</li>
                <li>• No local timezone conversion applied</li>
                <li>• Sorted by original date/time</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <MyMainLayout
        fixtures={demoFixtures}
        dateRange={dateRangeMode}
        loading={false}
      />
    </div>
  );
};

export default ExtendedDateRangeDemo;
