import { useLocation } from 'wouter';
import FixedScoreboard from './FixedScoreboard';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  
  return (
    <FixedScoreboard />
  );
};

export default FeaturedMatch;
