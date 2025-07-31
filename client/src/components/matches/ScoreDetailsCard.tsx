import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyDetailsRightScoreboard from "@/components/matches/MyDetailsRightScoreboard";

interface ScoreDetailsCardProps {
  currentFixture: any;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ScoreDetailsCard: React.FC<ScoreDetailsCardProps> = ({
  currentFixture,
  onClose,
  activeTab,
  onTabChange,
}) => {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <MyDetailsRightScoreboard 
          match={currentFixture}
          defaultMatch={currentFixture}
          onMatchCardClick={onClose}
        />
      </CardContent>
    </Card>
  );
};

export default ScoreDetailsCard;