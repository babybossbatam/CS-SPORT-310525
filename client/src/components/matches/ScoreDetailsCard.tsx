import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";

interface ScoreDetailsCardProps {
  currentFixture: any;
  onClose?: () => void;
}

const ScoreDetailsCard: React.FC<ScoreDetailsCardProps> = ({
  currentFixture,
  onClose,
}) => {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <MyMatchdetailsScoreboard match={currentFixture} onClose={onClose} />
      </CardContent>
    </Card>
  );
};

export default ScoreDetailsCard;