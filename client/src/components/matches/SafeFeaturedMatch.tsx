import React from 'react';
import FeaturedMatch from './FeaturedMatch';
import ClassErrorBoundary from '../common/ClassErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';

const SafeFeaturedMatch: React.FC = () => {
  const queryClient = useQueryClient();
  
  const handleReset = () => {
    // Invalidate all the relevant query keys to force a fresh fetch
    queryClient.invalidateQueries({ queryKey: ['/api/champions-league/fixtures'] });
    queryClient.invalidateQueries({ queryKey: ['/api/europa-league/fixtures'] });
    queryClient.invalidateQueries({ queryKey: ['/api/leagues/135/fixtures'] });
    queryClient.invalidateQueries({ queryKey: ['/api/leagues/39/fixtures'] });
  };
  
  return (
    <ClassErrorBoundary 
      onReset={handleReset}
      errorMessage="An error occurred while loading match data. This could be due to a connection issue."
    >
      <FeaturedMatch />
    </ClassErrorBoundary>
  );
};

export default SafeFeaturedMatch;