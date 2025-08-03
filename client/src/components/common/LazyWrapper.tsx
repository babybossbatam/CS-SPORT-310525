
import React, { Suspense, lazy } from 'react';
import BrandedLoading from './BrandedLoading';

interface LazyWrapperProps {
  importFunc: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  importFunc, 
  fallback = <BrandedLoading />,
  ...props 
}) => {
  const LazyComponent = lazy(importFunc);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyWrapper;
