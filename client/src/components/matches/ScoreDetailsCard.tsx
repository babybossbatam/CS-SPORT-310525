import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";

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
        <MyMatchdetailsScoreboard 
          match={currentFixture} 
          onClose={onClose}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </CardContent>
    </Card>
  );
};

export default ScoreDetailsCard;