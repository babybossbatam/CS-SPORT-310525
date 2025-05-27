import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours, isToday, isYesterday, isTomorrow } from 'date-fns';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { safeSubstring } from '@/lib/dateUtilsUpdated';

interface MatchesByCountryProps {
  selectedDate?: string;
}

const MatchesByCountry: React.FC<MatchesByCountryProps> = ({ selectedDate }) => {
  // Hide component during development
  return null;
};

export default MatchesByCountry;