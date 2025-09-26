import React from 'react';
import Header from '@/components/layout/Header';
import MyScoresMain from '@/components/layout/MyScoresMain';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const MyScores = () => {
  const { currentLanguage } = useLanguage();
  const { isAuthenticated, isLoading } = useAuthGuard();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <MyScoresMain />
    </>
  );
};

export default MyScores;