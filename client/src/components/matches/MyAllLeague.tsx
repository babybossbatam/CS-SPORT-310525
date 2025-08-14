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