
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useLocation } from 'wouter';
import BrandedLoading from './BrandedLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
  const [, navigate] = useLocation();

  React.useEffect(() => {
    // Check if user is authenticated
    if (!isLoading && !isAuthenticated) {
      // Extract current language from URL or default to 'en'
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const currentLang = pathParts[0] || 'en';
      
      // Redirect to login page
      navigate(`/${currentLang}/login`);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return <BrandedLoading />;
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return <BrandedLoading />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
