
import React, { useState, useEffect } from 'react';

interface RequestThrottlerProps {
  children: React.ReactNode;
  delay?: number;
}

export const RequestThrottler: React.FC<RequestThrottlerProps> = ({ 
  children, 
  delay = 2000 
}) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Stagger component loading to prevent overwhelming Replit Assistant
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return <>{children}</>;
};
