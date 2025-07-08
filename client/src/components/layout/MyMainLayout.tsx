import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";
import MyMatchTabCard from "@/components/matches/MyMatchTabCard";
import MyLineUpTabCard from "@/components/matches/MyLineupsTabsCard";
import MyMatchStatsTabCard from "@/components/matches/MyStatsTabCard";
import MyTrendsTabCard from "@/components/matches/MyTrendsTabsCard";
import MyHeadtoHeadTabCard from "@/components/matches/MyHeadtoheadTabsCard";
import MyRightContent from "@/components/layout/MyRightContent";

interface MyMainLayoutProps {
  fixtures?: any[];
  loading?: boolean;
  children?: React.ReactNode;
  selectedMatchId?: number;
  selectedMatch?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  fixtures = [],
  loading = false,
  children,
  selectedMatchId,
  selectedMatch,
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
    <div
      className="bg-[#FDFBF7] rounded-lg py-4"
      style={{ marginLeft: "150px", marginRight: "150px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          {children}
        </div>

        {/* Right column (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedMatch ? (
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
          ) : (
            <MyRightContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMainLayout;