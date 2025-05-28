import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Calendar } from '../ui/calendar';
import TodayPopularFootballLeagues from './TodayPopularFootballLeagues';
import TodayPopularFootballLeaguesNew from './TodayPopularFootballLeaguesNew';
import TodaysMatchesByCountry from './TodaysMatchesByCountry';
import LiveMatchForAllCountry from './LiveMatchForAllCountry';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { formatYYYYMMDD, getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';
import { useQuery } from '@tanstack/react-query';
import NewMatchCardFilter from './NewMatchCardFilter';

interface TodayMatchPageCardProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const TodayMatchPageCard = ({ fixtures, onMatchClick }: TodayMatchPageCardProps) => {
  return (
    <NewMatchCardFilter 
      fixtures={fixtures}
      onMatchClick={onMatchClick}
    />
  );
};

export default TodayMatchPageCard;