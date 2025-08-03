import React from "react";
import Header from "@/components/layout/Header";
import SportsCategoryTabs from "@/components/layout/SportsCategoryTabs";
import TournamentHeader from "@/components/layout/TournamentHeader";
import MyMainLayout from "@/components/layout/MyMainLayout";
import Footer from "@/components/layout/Footer";
import RegionModal from "@/components/modals/RegionModal";
import { Trophy } from "lucide-react";
import TodayPopularFootballLeaguesNew from "@/components/matches/TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";

const Home = () => {
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [timeFilterActive, setTimeFilterActive] = React.useState(false);
  const [showTop20, setShowTop20] = React.useState(false);
  const [liveFilterActive, setLiveFilterActive] = React.useState(false);

  const handleMatchCardClick = (match: any) => {
    console.log("Match card clicked:", match);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader
        title="UEFA Champions League - Semi Finals"
        icon={<Trophy className="h-4 w-4 text-neutral-600" />}
      />

      <div className="flex-1 h-full" style={{ marginTop: "52px", marginBottom: "64px" }}>
        <MyMainLayout fixtures={[]} />
      </div>

      <div className="mt-8">
        <Footer />
      </div>
      <RegionModal />
    </div>
  );
};

export default Home;
