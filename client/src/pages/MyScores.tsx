
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import MyScoresTab from '@/components/matches/MyScoresTab';

const MyScores: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('my-scores');

  return (
    <>
      <Header />
      <MyScoresTab selectedTab={selectedTab} onTabChange={setSelectedTab} />
    </>
  );
};

export default MyScores;
