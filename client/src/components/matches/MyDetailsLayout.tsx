import React from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  return <ScoreDetailsCard currentFixture={currentFixture} />;
};

export default MyDetailsLayout;