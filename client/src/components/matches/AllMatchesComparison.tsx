import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import LazyImage from '../common/LazyImage';
import { isNationalTeam } from '@/lib/teamLogoSources';

// Your specific league IDs from the attached file
const YOUR_LEAGUE_IDS = [
  3021, // AFC Challenge Cup (ID: 3021)
  3, // AFC Challenge League (ID: 3)
  1132, // AFC Champions League (ID: 1132)
  2, // AFC Champions League (ID: 2)
  39, // Premier League (ID: 39)
  140, // La Liga (ID: 140)
  135, // Serie A (ID: 135)
  78, // Bundesliga (ID: 78)
  61, // Ligue 1 (ID: 61)
  45, // FA Cup (ID: 45)
  48, // EFL Cup (ID: 48)
  143, // Copa del Rey (ID: 143)
  137, // Coppa Italia (ID: 137)
  81, // DFB Pokal (ID: 81)
  66, // Coupe de France (ID: 66)
  848, // UEFA Conference League (ID: 848)
  4, // Euro Championship (ID: 4)
  1135, // AFC Champions League (ID: 1135)
  301, // UAE Pro League (ID: 301)
  266, // Qatar Stars League (ID: 266)
  233, // Egyptian Premier League (ID: 233)
  15, // FIFA Club World Cup (ID: 15)
  1186, // FIFA Club World Cup - Play-In (ID: 1186)
  1168, // FIFA Intercontinental Cup (ID: 1168)
  32, // World Cup - Qualification Europe (ID: 32)
  33, // World Cup - Qualification Oceania (ID: 33)
  34, // World Cup - Qualification South America (ID: 34)
  35, // Asian Cup - Qualification (ID: 35)
  36, // Africa Cup of Nations - Qualification (ID: 36)
  37, // World Cup - Qualification Intercontinental Play-offs (ID: 37)
  38, // UEFA U21 Championship (ID: 38)
  914, // Tournoi Maurice Revello (ID: 914)
  5, // UEFA Nations League (ID: 5)
  6, // Africa Cup of Nations (ID: 6)
  7, // Asian Cup (ID: 7)
  8, // [League ID 8]
  9, // Copa America (ID: 9)
  10, // Friendlies (ID: 10)
  11, // CONMEBOL Sudamericana (ID: 11)
  12, // CAF Champions League (ID: 12)
  13, // CONMEBOL Libertadores (ID: 13)
  14, // UEFA Youth League (ID: 14)
  16, // CONCACAF Champions League (ID: 16)
  17, // AFC Champions League (ID: 17)
  18, // AFC Cup (ID: 18)
  19, // African Nations Championship (ID: 19)
  20, // CAF Confederation Cup (ID: 20)
  21, // Confederations Cup (ID: 21)
  22, // CONCACAF Gold Cup (ID: 22)
  23, // EAFF E-1 Football Championship (ID: 23)
  24, // AFF Championship (ID: 24)
  25, // Gulf Cup of Nations (ID: 25)
  26, // International Champions Cup (ID: 26)
  27, // OFC Champions League (ID: 27)
  28, // SAFF Championship (ID: 28)
  1, // World Cup (ID: 1)
];

interface AllMatchesComparisonProps {
  selectedDate: string;
}

// This component has been removed - it was previously used for comparison but is no longer needed
export default function AllMatchesComparison() {
  return null;
}

const POPULAR_LEAGUES = [
  39, 45, 48, // England: Premier League, FA Cup, EFL Cup
  140, 143, // Spain: La Liga, Copa del Rey
  135, 137, // Italy: Serie A, Coppa Italia
  78, 81, // Germany: Bundesliga, DFB Pokal
  61, 66, // France: Ligue 1, Coupe de France
  301, // UAE Pro League
  233, // Egyptian Premier League
  15, // FIFA Club World Cup
  38, // UEFA U21 Championship (Euro U21)
  914, 848, // COSAFA Cup, UEFA Conference League
  2, 3, // Champions League, Europa League
];

export const isInternationalCompetition = (leagueName: string, country: string) => {
  // Check if it's an international competition
  const isInternationalCompetition =
    leagueName.includes("champions league") ||
    leagueName.includes("europa league") ||
    leagueName.includes("conference league") ||
    leagueName.includes("uefa") ||
    leagueName.includes("world cup") ||
    leagueName.includes("fifa club world cup") ||
    leagueName.includes("fifa") ||
    leagueName.includes("u21") ||
    leagueName.includes("euro u21") ||
    leagueName.includes("uefa u21") ||
    leagueName.includes("conmebol") ||
    leagueName.includes("copa america") ||
    leagueName.includes("copa libertadores") ||
    leagueName.includes("copa sudamericana") ||
    leagueName.includes("libertadores") ||
    leagueName.includes("sudamericana") ||
    (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
    (leagueName.includes("international") && !leagueName.includes("women")) ||
    country.includes("world") ||
    country.includes("europe") ||
    country.includes("international");

  return isInternationalCompetition;
};