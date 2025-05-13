import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
  errorMessage?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary,
  errorMessage = "Something went wrong"
}) => {
  // Generate a user-friendly error message based on the type of error
  let displayMessage = errorMessage;
  
  if (error) {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      displayMessage = "Network error: Failed to connect to the server. Please check your internet connection and try again.";
    } else if (error.message.includes('timeout')) {
      displayMessage = "The request took too long to complete. Please try again.";
    }
  }
  
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Error</AlertTitle>
      <AlertDescription className="text-sm mb-4">
        {displayMessage}
      </AlertDescription>
      <Button 
        variant="outline" 
        onClick={resetErrorBoundary}
        className="mt-2"
        size="sm"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
      </Button>
    </Alert>
  );
};

export default ErrorFallback;