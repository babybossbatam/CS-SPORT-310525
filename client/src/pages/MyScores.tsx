
import React from 'react';
import Header from '@/components/layout/Header';
import MyScoresMain from '@/components/layout/MyScoresMain';

const MyScores: React.FC = () => {
  return (
    <>
      <Header />
      <MyScoresMain />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">My Scores</h1>
          <p className="text-gray-600">This page is under development.</p>
        </div>
      </div>
    </>
  );
};

export default MyScores;
