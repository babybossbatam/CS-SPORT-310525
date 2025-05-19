import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScoreboardCardProps {
  children: ReactNode;
  title?: string;
  minHeight?: string;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  controls?: ReactNode;
}

/**
 * A reusable card component specifically designed for scoreboards
 * This makes it easier to maintain consistent styling across different scoreboard types
 */
const ScoreboardCard = ({
  children,
  title = 'Featured Match',
  minHeight = '340px',
  showBadge = true,
  badgeText = 'Featured Match',
  className = '',
  controls
}: ScoreboardCardProps) => {
  return (
    <Card 
      className={`bg-white rounded-lg shadow-md mb-6 overflow-hidden relative ${className}`} 
      style={{ minHeight }}
    >
      {showBadge && (
        <Badge 
          variant="secondary" 
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          {badgeText}
        </Badge>
      )}
      
      {/* Navigation controls (prev/next buttons) if provided */}
      {controls}

      <CardContent className="px-8 pt-2 pb-2">
        {children}
      </CardContent>
    </Card>
  );
};

export default ScoreboardCard;