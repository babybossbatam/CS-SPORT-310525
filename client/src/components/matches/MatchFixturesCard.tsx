import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");

  // Group fixtures by league
  const fixturesByLeague = fixtures.reduce((acc: any, fixture: any) => {
    const leagueId = fixture.league.id;

    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        fixtures: []
      };
    }

    acc[leagueId].fixtures.push(fixture);
    return acc;
  }, {});

  return (
    
</div>
  );
};

export default MatchFixturesCard;