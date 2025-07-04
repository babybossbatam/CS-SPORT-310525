import React from 'react';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import MyMainLayout from '@/components/layout/MyMainLayout';
import Footer from '@/components/layout/Footer';
import RegionModal from '@/components/modals/RegionModal';
import { Trophy } from 'lucide-react';
import TodayPopularFootballLeaguesNew from "@/components/matches/TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";

const Home = () => {
  // Test with minimal implementation first
  try {
    return (
      <div className="min-h-screen bg-white p-4">
        <h1 className="text-2xl font-bold mb-4">Football App</h1>
        <div className="bg-blue-100 p-4 rounded">
          <p>Application is loading...</p>
          <p>Backend is working correctly</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Home component error:', error);
    return <div>Home Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};

export default Home;