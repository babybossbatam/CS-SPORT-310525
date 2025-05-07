import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Trophy } from 'lucide-react';

interface TournamentHeaderProps {
  title?: string;
  icon?: React.ReactNode;
}

const TournamentHeader = ({ 
  title, 
  icon 
}: TournamentHeaderProps) => {
  const currentLeague = useSelector((state: RootState) => state.leagues.current);
  
  // Use provided title or fallback to current league name
  const displayTitle = title || (currentLeague ? currentLeague.league.name : 'Football Matches');
  
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          {icon || <Trophy className="h-4 w-4 text-neutral-600" />}
          <span className="text-sm text-neutral-600">{displayTitle}</span>
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader;
