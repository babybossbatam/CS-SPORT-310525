import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";

interface ScoreDetailsCardProps {
  currentFixture: any;
}

const ScoreDetailsCard: React.FC<ScoreDetailsCardProps> = ({ currentFixture }) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <MyMatchdetailsScoreboard match={currentFixture} />
      </CardContent>
    </Card>
  );
};

export default ScoreDetailsCard;