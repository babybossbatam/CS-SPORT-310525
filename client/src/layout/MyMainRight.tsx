
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";
import MyMatchTabCard from "@/components/matches/MyMatchTabCard";
import MyLineUpTabCard from "@/components/matches/MyLineupsTabsCard";
import MyMatchStatsTabCard from "@/components/matches/MyStatsTabCard";
import MyTrendsTabCard from "@/components/matches/MyTrendsTabsCard";
import MyHeadtoHeadTabCard from "@/components/matches/MyHeadtoheadTabsCard";

interface MyMainRightProps {
  selectedMatchId?: number;
  selectedMatch?: any;
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MyMainRight: React.FC<MyMainRightProps> = ({
  selectedMatchId,
  selectedMatch,
  children,
  activeTab = "match",
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string>("match");
  const currentActiveTab = activeTab || internalActiveTab;

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const renderTabContent = () => {
    if (!selectedMatch) return null;

    switch (currentActiveTab) {
      case "match":
        return <MyMatchTabCard match={selectedMatch} />;
      case "lineups":
        return <MyLineUpTabCard match={selectedMatch} />;
      case "stats":
        return <MyMatchStatsTabCard match={selectedMatch} />;
      case "trends":
        return <MyTrendsTabCard match={selectedMatch} />;
      case "h2h":
        return <MyHeadtoHeadTabCard match={selectedMatch} />;
      default:
        return <MyMatchTabCard match={selectedMatch} />;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {selectedMatch && (
        <>
          <Card className="w-full">
            <CardContent className="p-0">
              <MyMatchdetailsScoreboard
                match={selectedMatch}
                activeTab={currentActiveTab}
                onTabChange={handleTabChange}
              />
            </CardContent>
          </Card>

          {/* Tab Content */}
          {renderTabContent()}
        </>
      )}

      {children}
    </div>
  );
};

export default MyMainRight;
