import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { isToday, isYesterday, isTomorrow } from '@/lib/dateUtils';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

// Before calling substring, check if the value exists
function safeSubstring(value: any, start: number, end?: number): string {
  // Return empty string if value is null or undefined
  if (value == null) {
    return '';
  }

  // Convert to string if it's not already (handles numbers, etc.)
  const str = String(value);

  // If end is provided, use it, otherwise just use start parameter
  return end !== undefined ? str.substring(start, end) : str.substring(start);
}

interface MatchesByCountryProps {
  selectedDate?: string;
}

const MatchesByCountry: React.FC<MatchesByCountryProps> = ({ selectedDate }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">All Matches by Country</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Component under development</p>
      </CardContent>
    </Card>
  );
};

export default MatchesByCountry;