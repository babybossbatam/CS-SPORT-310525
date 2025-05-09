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
  
  // Return null instead of rendering the header element
  return null;
};

export default TournamentHeader;
