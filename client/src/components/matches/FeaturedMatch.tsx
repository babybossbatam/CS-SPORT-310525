import { useLocation } from 'wouter';
import FeatureMatchCard from './FeatureMatchCard';

// Clean version with no data fetching
const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  
  return (
    <FeatureMatchCard />
  );
};

export default FeaturedMatch;
