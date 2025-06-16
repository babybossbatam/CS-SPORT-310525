
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import TodayMatchpage from "@/components/matches/TodayMatchPageCard";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5/12 width) */}
          <div className="lg:col-span-5">
            <TodayMatchpage />
          </div>

          {/* Right Column (7/12 width) */}
          <div className="lg:col-span-7">
            {/* Additional content can go here */}
            <MyMatchdetailsScoreboard match={currentFixture} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyDetailsLayout;
