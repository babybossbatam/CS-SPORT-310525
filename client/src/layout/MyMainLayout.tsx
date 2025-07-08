import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";
import MyMatchTabCard from "@/components/matches/MyMatchTabCard";
import MyLineupsTabsCard from "@/components/matches/MyLineupsTabsCard";
import MyStatsTabCard from "@/components/matches/MyStatsTabCard";
import MyTrendsTabsCard from "@/components/matches/MyTrendsTabsCard";
import MyHeadtoheadTabsCard from "@/components/matches/MyHeadtoheadTabsCard";

interface MyMainLayoutProps {
  selectedMatchId?: number;
  selectedMatch?: any;
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
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
        return <MyLineupsTabsCard match={selectedMatch} />;
      case "stats":
        return <MyStatsTabCard match={selectedMatch} />;
      case "trends":
        return <MyTrendsTabsCard match={selectedMatch} />;
      case "h2h":
        return <MyHeadtoheadTabsCard match={selectedMatch} />;
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

export default MyMainLayout;