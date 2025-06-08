import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Star } from "lucide-react";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
}) => {
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Empty data - no fetching or caching
  const sortedMatches: any[] = [];

  const toggleStarMatch = (matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  };

  // Always show empty state since we removed all data sources
  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Empty state card */}
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this time view</p>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;