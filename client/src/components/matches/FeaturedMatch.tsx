import { useLocation } from 'wouter';
import SimpleScoreboard from './SimpleScoreboard';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  
  return (
    <SimpleScoreboard />
  );
};

export default FeaturedMatch;
