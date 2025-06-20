import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Calendar, MapPin, User, Trophy, Bug } from "lucide-react";
import { UnifiedDebugPanel } from "@/components/debug/UnifiedDebugPanel";
import MyLiveAction from '@/components/matches/MyLiveAction';
import MySmartTimeFilter from '@/lib/MySmartTimeFilter';
import { Card, CardContent } from '@/components/ui/card';

interface MyMainLayoutProps {
  children: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({ children }) => {
  const [location, navigate] = useLocation();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime] = useState(Date.now());
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Apply smart time filtering to fixtures
  const filteredFixtures = useMemo(() => {
    // Your existing filtering logic here
    return [];
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {children}
          </div>
          <div className="lg:col-span-4">
            <MyRightContent />
          </div>
        </div>

        {/* Debug Panel Toggle Button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          >
            <Bug className="h-4 w-4" />
            Debug Panel
          </button>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDebugPanel(false)}>
            <div className="fixed right-0 top-0 h-full w-1/2 bg-white shadow-xl z-50" onClick={e => e.stopPropagation()}>
              <UnifiedDebugPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Placeholder component for MyRightContent
const MyRightContent: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Right Content</h3>
          <p className="text-sm text-gray-600">Additional content goes here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyMainLayout;