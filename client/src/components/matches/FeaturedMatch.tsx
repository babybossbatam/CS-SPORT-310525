import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeatureMatchCard from './FeatureMatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, isLiveMatch } from '@/lib/utils';
import { getTeamColor, getOpposingTeamColor } from '@/lib/colorUtils';
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '../../../../server/types';
import MatchScoreboard from '@/components/matches/MatchScoreboard';

// Exact same IDs as UpcomingMatchesScoreboard
const FEATURED_LEAGUE_IDS = [
  135, // Serie A (Italy)
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
  140, // La Liga (Spain)
  78,  // Bundesliga (Germany)
  61,  // Ligue 1 (France)
];

const FeaturedMatch = () => {
  return null;
};

export default FeaturedMatch;