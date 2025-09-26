
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { RootState } from '@/lib/store';

export const useAuthGuard = (redirectTo?: string) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.user);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Extract current language from URL
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const currentLang = pathParts[0] || 'en';
      
      const targetPath = redirectTo || `/${currentLang}/login`;
      navigate(targetPath);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};
