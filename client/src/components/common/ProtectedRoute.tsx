import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, userActions } from '@/lib/store';
import BrandedLoading from './BrandedLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [location] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isLoading = useSelector((state: RootState) => state.user.isLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check localStorage for persisted auth state
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');

        if (storedAuth === 'true' && storedUser) {
          const userData = JSON.parse(storedUser);
          dispatch(userActions.setUser(userData));
          dispatch(userActions.setAuthenticated(true));
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, [dispatch]);

  // Extract language from URL
  const extractLanguageFromUrl = (): string => {
    const supportedLanguages = ['en', 'en-us', 'es', 'es-mx', 'zh-hk', 'zh', 'zh-tw', 'de', 'de-at', 'it', 'pt', 'pt-br', 'fr'];
    const pathParts = location.split('/').filter(part => part);

    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      return pathParts[0];
    }
    return 'en';
  };

  const currentLang = extractLanguageFromUrl();

  if (isCheckingAuth || isLoading) {
    return <BrandedLoading />;
  }

  if (!isAuthenticated) {
    // Use programmatic navigation instead of window.location
    setTimeout(() => {
      window.location.href = `/${currentLang}/login`;
    }, 100);
    return <BrandedLoading />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;