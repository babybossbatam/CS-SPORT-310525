
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const TranslationGuard: React.FC<TranslationGuardProps> = ({ 
  children, 
  fallback = <div className="opacity-0">Loading...</div> 
}) => {
  const { isRoutingComplete } = useLanguage();
  
  if (!isRoutingComplete) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
