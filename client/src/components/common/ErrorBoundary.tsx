import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  errorMessage = "Something went wrong while loading this content",
  queryKeys = []
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Listen for unhandled errors in the application
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setError(event.error || new Error("Unknown error occurred"));
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Retry handler that invalidates query cache and resets error state
  const handleRetry = () => {
    // Invalidate all the specified query keys to trigger a refetch
    if (queryKeys.length > 0) {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
    
    // Clear the error state
    setHasError(false);
    setError(null);
  };
  
  // If everything is fine, render children normally
  if (!hasError) {
    return <>{children}</>;
  }
  
  // If a custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Generate an error message based on the error type
  let displayMessage = errorMessage;
  
  if (error) {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      displayMessage = "Failed to connect to the server. Please check your internet connection and try again.";
    } else if (error.message.includes('timeout')) {
      displayMessage = "The request took too long to complete. Please try again.";
    } else if (error.message.includes('fetch')) {
      displayMessage = "There was a problem connecting to the server. Please try again later.";
    }
  }
  
  // Default error UI
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mb-4">{displayMessage}</AlertDescription>
      <Button 
        variant="outline" 
        onClick={handleRetry}
        className="mt-2"
        size="sm"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
      </Button>
    </Alert>
  );
};

export default ErrorBoundary;