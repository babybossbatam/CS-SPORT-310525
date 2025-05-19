import { useLocation } from 'wouter';
import FixedScoreboard from './FixedScoreboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Create a simpler card component specifically for featured matches
const FeaturedMatch = () => {
  return (
    <FixedScoreboard />
  );
};

export default FeaturedMatch;
