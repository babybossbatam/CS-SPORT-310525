import React from "react";
import MyAllLeagueList from "./MyAllLeagueList";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface MyAllLeagueProps {
  selectedDate?: string;
  fixtures?: any[];
}

const MyAllLeague: React.FC<MyAllLeagueProps> = ({ 
  selectedDate: propSelectedDate, 
  fixtures = [] 
}) => {
  const reduxSelectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const selectedDate = propSelectedDate || reduxSelectedDate;

  // Debug logging
  console.log(`🔍 [MyAllLeague] Rendering with:`, {
    selectedDate,
    fixturesCount: fixtures.length,
    propSelectedDate,
    reduxSelectedDate
  });

  // Add fallback if no selected date
  if (!selectedDate) {
    console.warn(`⚠️ [MyAllLeague] No selected date available`);
    return (
      <div className="w-full p-4 text-center text-gray-500">
        <p>Please select a date to view leagues</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <MyAllLeagueList 
        selectedDate={selectedDate} 
        fixtures={fixtures}
      />
    </div>
  );
};

export default MyAllLeague;