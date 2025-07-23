import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import TodayMatchPageCard from "@/components/matches/TodayMatchPageCard";
import MyRightContent, { MyRightDetails } from "@/components/layout/MyRightContent";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";

interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
  dateRange?: 'single' | 'extended'; // New prop to control date range
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  fixtures,
  loading = false,
  children,
  dateRange = 'single',
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  // Apply filtering with ±2 days range and original timezone preservation
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🔍 [MyMainLayout] Processing ${fixtures.length} fixtures for date range around: ${selectedDate} (mode: ${dateRange})`,
    );

    if (dateRange === 'single') {
      // Original single-date filtering
      const filtered = fixtures.filter((fixture) => {
        if (fixture.fixture.date && fixture.fixture.status?.short) {
          const fixtureUTCDate = fixture.fixture.date.substring(0, 10);
          return fixtureUTCDate === selectedDate;
        }
        return false;
      });
      
      console.log(`✅ [MyMainLayout] Single date: ${filtered.length} matches for ${selectedDate}`);
      return filtered;
    }

    // Extended date range: ±2 days with original timezone
    const selectedDateObj = new Date(selectedDate + 'T00:00:00Z');
    const twoDaysBefore = new Date(selectedDateObj);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    const twoDaysAfter = new Date(selectedDateObj);
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);

    const startDateString = format(twoDaysBefore, "yyyy-MM-dd");
    const endDateString = format(twoDaysAfter, "yyyy-MM-dd");

    console.log(
      `📅 [MyMainLayout] Extended range: ${startDateString} to ${endDateString} (center: ${selectedDate})`,
    );

    const filtered = fixtures.filter((fixture) => {
      if (!fixture.fixture.date || !fixture.fixture.status?.short) return false;

      // Extract UTC date part only (YYYY-MM-DD) - no timezone conversion
      const fixtureUTCDate = fixture.fixture.date.substring(0, 10);
      
      // Check if fixture falls within the ±2 days range
      const isInRange = fixtureUTCDate >= startDateString && fixtureUTCDate <= endDateString;

      if (isInRange) {
        // Calculate days difference from selected date
        const fixtureDate = new Date(fixtureUTCDate + 'T00:00:00Z');
        const daysDiff = Math.round((fixtureDate.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        let dayLabel = '';
        if (daysDiff === -2) dayLabel = '2 days ago';
        else if (daysDiff === -1) dayLabel = 'Yesterday';
        else if (daysDiff === 0) dayLabel = 'Today';
        else if (daysDiff === 1) dayLabel = 'Tomorrow';
        else if (daysDiff === 2) dayLabel = 'In 2 days';

        console.log(
          `✅ [MyMainLayout EXTENDED] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          {
            originalDateTime: fixture.fixture.date,
            utcDate: fixtureUTCDate,
            selectedDate,
            daysDiff,
            dayLabel,
            status: fixture.fixture.status.short,
            timezone: 'UTC (original from API)'
          },
        );
      } else {
        console.log(
          `❌ [MyMainLayout EXTENDED] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          {
            utcDate: fixtureUTCDate,
            selectedDate,
            rangeStart: startDateString,
            rangeEnd: endDateString,
            reason: "Outside ±2 days range"
          },
        );
      }

      return isInRange;
    });

    console.log(
      `✅ [MyMainLayout] Extended filtering: ${filtered.length} matches in range ${startDateString} to ${endDateString}`,
    );
    
    // Sort by original UTC date/time for better organization
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.fixture.date);
      const dateB = new Date(b.fixture.date);
      return dateA.getTime() - dateB.getTime();
    });

    return sorted;
  }, [fixtures, selectedDate, dateRange]);

  const handleMatchClick = (matchId: number) => {
    navigate(`/match/${matchId}`);
  };

  const handleMatchCardClick = (fixture: any) => {
    setSelectedFixture(fixture);
  };

  const handleBackToMain = () => {
    setSelectedFixture(null);
  };

  return (
    <div
      className="bg-[#FDFBF7] rounded-lg py-4"
      style={{ marginLeft: "150px", marginRight: "150px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Debug info for extended date range */}
          {dateRange === 'extended' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Extended Date Range Debug (±2 days from {selectedDate})
              </h3>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• Total fixtures processed: {fixtures?.length || 0}</p>
                <p>• Fixtures in range: {filteredFixtures.length}</p>
                <p>• Original timezone: UTC (as received from API)</p>
                <p>• Range: {selectedDate && (() => {
                  const selectedDateObj = new Date(selectedDate + 'T00:00:00Z');
                  const twoDaysBefore = new Date(selectedDateObj);
                  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
                  const twoDaysAfter = new Date(selectedDateObj);
                  twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
                  return `${format(twoDaysBefore, "yyyy-MM-dd")} to ${format(twoDaysAfter, "yyyy-MM-dd")}`;
                })()}</p>
              </div>
            </div>
          )}

          {/* Render children if provided, otherwise show TodayMatchPageCard */}
          {children ? (
            <div>
              {children}
            </div>
          ) : (
            <div>
              <TodayMatchPageCard
                fixtures={filteredFixtures}
                onMatchClick={handleMatchClick}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          )}
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedFixture ? (
            <MyRightDetails 
              selectedFixture={selectedFixture}
              onClose={handleBackToMain}
            />
          ) : (
            <MyRightContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMainLayout;