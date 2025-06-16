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
    <Card className="w-full">
      {onClose && (
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Match Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
      <CardContent className="p-6">
        <MyMatchdetailsScoreboard match={currentFixture} />
      </CardContent>
    </Card>
  );
};

export default ScoreDetailsCard;