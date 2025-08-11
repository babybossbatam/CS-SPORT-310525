
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/contexts/LanguageContext"

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

// Automated round status mapping system
interface RoundMappingRule {
  pattern: RegExp
  translationKey: string
  format?: (match: RegExpMatchArray) => string
}

// Smart round mapping rules that can handle various formats
const ROUND_MAPPING_RULES: RoundMappingRule[] = [
  // Numbered rounds (1st Round, 2nd Round, etc.)
  {
    pattern: /(\d+)(st|nd|rd|th)\s+round/i,
    translationKey: 'numbered_round',
    format: (match) => `${match[1]}${match[2]}`
  },
  
  // Qualifying rounds
  {
    pattern: /(\d+)(st|nd|rd|th)\s+qualifying/i,
    translationKey: 'qualifying_round',
    format: (match) => `${match[1]}${match[2]}`
  },
  
  // Preliminary stages
  {
    pattern: /preliminary\s+round/i,
    translationKey: 'preliminary_round'
  },
  
  // Play-off rounds
  {
    pattern: /play[\-\s]?off/i,
    translationKey: 'playoff_round'
  },
  
  // Final stages
  {
    pattern: /^final$/i,
    translationKey: 'final'
  },
  {
    pattern: /semi[\-\s]?final/i,
    translationKey: 'semi_final'
  },
  {
    pattern: /quarter[\-\s]?final/i,
    translationKey: 'quarter_final'
  },
  
  // Round of X
  {
    pattern: /round\s+of\s+(\d+)/i,
    translationKey: 'round_of_x',
    format: (match) => match[1]
  },
  
  // Group stages
  {
    pattern: /group\s+stage/i,
    translationKey: 'group_stage'
  },
  {
    pattern: /group\s+([a-z])/i,
    translationKey: 'group_x',
    format: (match) => match[1].toUpperCase()
  },
  
  // League phases
  {
    pattern: /league\s+phase/i,
    translationKey: 'league_phase'
  },
  
  // Knockout phases
  {
    pattern: /knockout\s+phase/i,
    translationKey: 'knockout_phase'
  },
  
  // Regular rounds
  {
    pattern: /round\s+(\d+)/i,
    translationKey: 'round_number',
    format: (match) => match[1]
  },
  
  // Matchdays
  {
    pattern: /matchday\s+(\d+)/i,
    translationKey: 'matchday',
    format: (match) => match[1]
  },
  
  // Friendlies
  {
    pattern: /club\s+friendlies/i,
    translationKey: 'club_friendlies'
  },
  {
    pattern: /summer\s+friendlies/i,
    translationKey: 'summer_friendlies'
  },
  {
    pattern: /winter\s+friendlies/i,
    translationKey: 'winter_friendlies'
  },
  {
    pattern: /pre[\-\s]?season/i,
    translationKey: 'pre_season'
  },
  
  // Third place
  {
    pattern: /third\s+place/i,
    translationKey: 'third_place'
  },
  
  // Bronze final
  {
    pattern: /bronze\s+final/i,
    translationKey: 'bronze_final'
  },
  
  // Small final
  {
    pattern: /small\s+final/i,
    translationKey: 'small_final'
  }
];

// Cache for learned round mappings
const LEARNED_ROUNDS_CACHE = new Map<string, string>();

export function RoundBadge({ 
  leagueId, 
  season = 2025, 
  className,
  currentRound,
  matchStatus 
}: RoundBadgeProps) {
  const { t } = useTranslation();
  
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

  // Smart round text formatting with automatic learning
  const formatRoundText = React.useCallback((round: string, leagueName?: string): string | null => {
    if (!round || round === "TBD" || round === "N/A") return null;

    const lowerRound = round.toLowerCase().trim();
    const cacheKey = `${lowerRound}_${leagueName?.toLowerCase() || ''}`;
    
    // Check if we've already learned this round
    if (LEARNED_ROUNDS_CACHE.has(cacheKey)) {
      const cachedTranslation = LEARNED_ROUNDS_CACHE.get(cacheKey);
      return cachedTranslation || round;
    }

    // Try to match against our mapping rules
    for (const rule of ROUND_MAPPING_RULES) {
      const match = lowerRound.match(rule.pattern);
      if (match) {
        let translatedText: string;
        
        if (rule.format && match) {
          const formatValue = rule.format(match);
          translatedText = t(rule.translationKey, `{{value}}`, { value: formatValue });
        } else {
          translatedText = t(rule.translationKey, round);
        }
        
        // Cache the learned translation
        LEARNED_ROUNDS_CACHE.set(cacheKey, translatedText);
        
        console.log(`🎯 [RoundBadge] Learned new round mapping: "${round}" → "${translatedText}" (key: ${rule.translationKey})`);
        
        return translatedText;
      }
    }

    // Handle special league-specific logic
    const lowerLeague = leagueName?.toLowerCase() || "";
    
    // For actual friendly leagues, handle numbered friendlies differently
    if (lowerLeague.includes("friendlies") || lowerLeague.includes("friendly")) {
      const friendlyMatch = lowerRound.match(/(\d+)/);
      if (friendlyMatch) {
        const roundNum = friendlyMatch[1];
        const translatedText = t('friendly_round_number', `Friendly ${roundNum}`, { number: roundNum });
        LEARNED_ROUNDS_CACHE.set(cacheKey, translatedText);
        return translatedText;
      }
    }

    // Fallback for unknown rounds - try to make them more readable
    const fallbackText = round.length > 20 ? round.substring(0, 17) + "..." : round;
    
    // Cache even the fallback to avoid repeated processing
    LEARNED_ROUNDS_CACHE.set(cacheKey, fallbackText);
    
    console.log(`ℹ️ [RoundBadge] Using fallback for unknown round: "${round}" → "${fallbackText}"`);
    
    return fallbackText;
  }, [t]);

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
