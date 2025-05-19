import { useLocation } from 'wouter';
import ScoreboardV2 from './365ScoreboardV2';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  
  return (
    <ScoreboardV2 />
  );
};

export default FeaturedMatch;
