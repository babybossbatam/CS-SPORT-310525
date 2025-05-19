import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimpleScoreboardCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

// A simple card component specifically for scoreboards
const SimpleScoreboardCard = ({
  children,
  title = 'Featured Match',
  className = '',
}: SimpleScoreboardCardProps) => {
  return (
    <Card className={`bg-white rounded-lg shadow-md mb-6 overflow-hidden relative ${className}`} style={{ minHeight: '340px' }}>
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        {title}
      </Badge>
      
      <CardContent className="px-8 pt-2 pb-2">
        {children}
      </CardContent>
    </Card>
  );
};

export default SimpleScoreboardCard;