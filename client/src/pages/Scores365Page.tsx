
import React from 'react';
import Header from "@/components/layout/Header";
import SportsCategoryTabs from "@/components/layout/SportsCategoryTabs";
import Scores365Replica from "@/components/matches/Scores365Replica";

const Scores365Page: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SportsCategoryTabs />
      <Scores365Replica />
    </div>
  );
};

export default Scores365Page;
