
import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  React.useEffect(() => {
    // Check if user is authenticated
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const userData = localStorage.getItem('user');
    
    if (!isAuthenticated && !storedAuth && !userData) {
      // Redirect to login if not authenticated
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const currentLang = pathParts[0] || 'en';
      
      navigate(`/${currentLang}/login`);
      return;
    }
  }, [isAuthenticated, navigate]);

  // Check both Redux state and localStorage for authentication
  const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
  const userData = localStorage.getItem('user');
  
  if (!isAuthenticated && !storedAuth && !userData) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
