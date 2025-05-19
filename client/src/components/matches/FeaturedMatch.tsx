import { useLocation } from 'wouter';
import EnhancedFeatureMatchCard from './EnhancedFeatureMatchCard';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  
  return (
    <EnhancedFeatureMatchCard />
  );
};

export default FeaturedMatch;
