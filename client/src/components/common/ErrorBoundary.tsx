import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback';
import { useQueryClient } from '@tanstack/react-query';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorMessage?: string;
  queryKeys?: string[];
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback, 
  errorMessage,
  queryKeys = []
}) => {
  const queryClient = useQueryClient();
  
  // Function to handle error reset with query invalidation
  const handleError = (error: Error) => {
    console.error('Error caught by error boundary:', error);
  };
  
  // Function to handle error reset with query invalidation
  const handleReset = () => {
    // Invalidate specific query keys if provided
    if (queryKeys.length > 0) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        fallback ? 
          <>{fallback}</> : 
          <ErrorFallback 
            error={error} 
            resetErrorBoundary={resetErrorBoundary} 
            errorMessage={errorMessage} 
          />
      )}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;