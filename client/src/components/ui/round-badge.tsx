import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface RoundBadgeProps {
  leagueId: number
  season?: number
  className?: string
  currentRound?: string
  matchStatus?: string
}

interface RoundData {
  current?: string
  total?: number
  name?: string
}

export function RoundBadge({ 
  leagueId, 
  season = 2025, 
  className,
  currentRound,
  matchStatus 
}: RoundBadgeProps) {
  const { data: roundData, isLoading } = useQuery({
    queryKey: ["league-rounds", leagueId, season],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/fixtures/rounds?league=${leagueId}&season=${season}`);
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Error fetching round data:", error);
        return [];
      }
    },
    enabled: !!leagueId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

  const formatRoundText = (round: string, leagueName?: string) => {
    if (!round || round === "TBD" || round === "N/A") return null;

    const lowerRound = round.toLowerCase();
    const lowerLeague = leagueName?.toLowerCase() || "";

    // Handle numbered tournament rounds (1st Round, 2nd Round, etc.)
    if (lowerRound.match(/(\d+)(st|nd|rd|th)\s+round/)) {
      const match = lowerRound.match(/(\d+)(st|nd|rd|th)\s+round/);
      if (match) {
        const roundNumber = match[1];
        return `${roundNumber}${match[2]} Round`;
      }
    }

    // Handle "Club Friendlies X" format for tournament bracket rounds
    if (lowerRound.match(/club friendlies \d+/) && !lowerLeague.includes("friendlies")) {
      const match = lowerRound.match(/club friendlies (\d+)/);
      if (match) {
        const roundNumber = parseInt(match[1]);
        const suffix = roundNumber === 1 ? 'st' : 
                      roundNumber === 2 ? 'nd' : 
                      roundNumber === 3 ? 'rd' : 'th';
        return `${roundNumber}${suffix} Round`;
      }
    }

    // Handle specific round formats
    if (lowerRound.includes("final") && !lowerRound.includes("semi") && !lowerRound.includes("quarter")) {
      return "Final";
    }
    if (lowerRound.includes("semi")) {
      return "Semi-Final";
    }
    if (lowerRound.includes("quarter")) {
      return "Quarter-Final";
    }
    if (lowerRound.includes("round of 16") || lowerRound.includes("r16")) {
      return "Round of 16";
    }
    if (lowerRound.includes("round of 32") || lowerRound.includes("r32")) {
      return "Round of 32";
    }
    if (lowerRound.includes("group")) {
      return "Group Stage";
    }
    if (lowerRound.includes("league phase")) {
      return "League Phase";
    }
    if (lowerRound.includes("knockout")) {
      return "Knockout Phase";
    }

    // Handle friendlies (only for actual friendly leagues)
    if (lowerLeague.includes("friendlies") || lowerLeague.includes("friendly")) {
      if (lowerRound.includes("summer") || lowerRound.includes("4")) {
        return "Summer Friendlies";
      }
      if (lowerRound.includes("winter") || lowerRound.includes("3")) {
        return "Winter Friendlies";
      }
      if (lowerRound.includes("pre") || lowerRound.includes("1")) {
        return "Pre-Season";
      }
      return "Club Friendlies";
    }

    // Handle regular rounds
    if (lowerRound.match(/round \d+/)) {
      return round.replace(/round (\d+)/i, "R$1");
    }
    if (lowerRound.match(/matchday \d+/)) {
      return round.replace(/matchday (\d+)/i, "MD$1");
    }

    return round.length > 20 ? round.substring(0, 17) + "..." : round;
  };

  // Don't show loading skeleton, just return null if loading
  if (isLoading) {
    return null;
  }

  // Only use actual API round data - no fallbacks to currentRound prop or hardcoded values
  let displayRound = null;

  if (roundData && roundData.length > 0) {
    // Get the most recent round from API data
    displayRound = roundData[roundData.length - 1];
  }

  // If no round data from API, don't show the badge at all
  if (!displayRound) {
    return null;
  }

  const roundText = formatRoundText(displayRound);

  // If formatting returns null, don't show the badge
  if (!roundText) {
    return null;
  }

  // Determine badge styling based on match status with dark mode support
  const isLive = matchStatus && ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(matchStatus);
  const isFinished = matchStatus && ["FT", "AET", "PEN"].includes(matchStatus);

  let badgeClass = "text-xs px-2 py-1 font-medium border";

  if (isLive) {
    badgeClass += " border-gray-500 text-gray-600 bg-gray-50 dark:!border-white dark:text-white dark:bg-gray-800";
  } else if (isFinished) {
    badgeClass += " border-gray-500 text-gray-600 bg-gray-50 dark:!border-white dark:text-white dark:bg-gray-800";
  } else {
    badgeClass += " border-green-500 text-green-600 dark:!border-white dark:text-white dark:bg-green-900/20";
  }

  return (
    <Badge 
      variant="outline" 
      className={`${badgeClass} ${className}`}
      title={`Round: ${displayRound}`}
    >
      {roundText}
    </Badge>
  );
}