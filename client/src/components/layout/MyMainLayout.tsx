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
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  fixtures,
  loading = false,
  children,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const { currentFixture } = useSelector((state: RootState) => state.fixtures);
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  // Use fixtures directly since server already filters by date and timezone
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(
      `✅ [MyMainLayout] Using ${fixtures.length} fixtures (server pre-filtered by date and timezone)`,
    );

    // Server endpoint /api/fixtures/date/${selectedDate}?timezone=${userTimezone} 
    // already returns the correct fixtures for the selected date in user's timezone
    return fixtures;
  }, [fixtures]);

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