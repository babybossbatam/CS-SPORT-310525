import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyImage from "../common/LazyImage";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import { getCountryFlagWithFallbackSync } from "@/lib/flagUtils";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  // If still too long (more than 12 characters), intelligently shorten multi-word names
  if (shortened.length > 12) {
    const words = shortened.split(" ");

    if (words.length > 1) {
      // For multi-word names, shorten the last word progressively
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      if (lastWord.length > 4) {
        // First try 3 characters
        words[lastWordIndex] = lastWord.substring(0, 3);
        shortened = words.join(" ");

        // If still too long, try 2 characters for the last word
        if (shortened.length > 12) {
          words[lastWordIndex] = lastWord.substring(0, 2);
          shortened = words.join(" ");
        }
      }
    } else {
      // For single long words, truncate to 10 characters
      shortened = shortened.substring(0, 10);
    }
  }

  return shortened.trim();
};

interface MyUpdatedMatchbyCountryProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const MyUpdatedMatchbyCountry: React.FC<MyUpdatedMatchbyCountryProps> = ({
  selectedDate,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  return (
    <div className="country-matches-container todays-matches-by-country-container">
      <div className="p-4 text-center text-gray-500">
        Data flow removed - component simplified
      </div>
    </div>
  );
};

export default MyUpdatedMatchbyCountry;