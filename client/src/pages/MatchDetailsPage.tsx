import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import MatchBottomNavBar from '@/components/match/MatchBottomNavBar';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';

type TabType = 'match' | 'lineups' | 'stats' | 'standings';

const MatchDetailsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('match');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <SportsCategoryTabs />
      
      <main className="flex-1 pb-20">
        <div className="bg-white px-4 py-6 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col items-center w-2/5">
              <div className="w-16 h-16 bg-gray-100 rounded-full mb-2 flex items-center justify-center">
                <span className="font-bold text-gray-400">Team A</span>
              </div>
              <p className="text-sm font-medium">Manchester United</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">2 - 1</div>
              <div className="text-xs text-gray-500">Full Time</div>
            </div>
            
            <div className="flex flex-col items-center w-2/5">
              <div className="w-16 h-16 bg-gray-100 rounded-full mb-2 flex items-center justify-center">
                <span className="font-bold text-gray-400">Team B</span>
              </div>
              <p className="text-sm font-medium">Liverpool</p>
            </div>
          </div>
          
          <div className="flex justify-center text-xs text-gray-500">
            <span>Premier League • 2025/05/14</span>
          </div>
        </div>
        
        {activeTab === 'match' && (
          <div className="p-4 bg-white rounded-md mx-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Match Summary</h2>
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold mb-2">Goals</h3>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 text-xs text-gray-500">23'</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Bruno Fernandes</p>
                    <p className="text-xs text-gray-500">Assist: Marcus Rashford</p>
                  </div>
                  <div className="w-4 text-xs font-bold">1-0</div>
                </div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 text-xs text-gray-500">45+2'</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Mohamed Salah</p>
                    <p className="text-xs text-gray-500">Assist: Trent Alexander-Arnold</p>
                  </div>
                  <div className="w-4 text-xs font-bold">1-1</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 text-xs text-gray-500">82'</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Marcus Rashford</p>
                    <p className="text-xs text-gray-500">Assist: Luke Shaw</p>
                  </div>
                  <div className="w-4 text-xs font-bold">2-1</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Key Stats</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-500">Possession</div>
                    <div className="text-sm font-bold">58% - 42%</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-500">Shots</div>
                    <div className="text-sm font-bold">12 - 8</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-500">Corners</div>
                    <div className="text-sm font-bold">7 - 4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'lineups' && (
          <div className="p-4 bg-white rounded-md mx-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Team Lineups</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Manchester United (4-3-3)</h3>
                <div className="space-y-1">
                  {['De Gea', 'Wan-Bissaka', 'Varane', 'Martinez', 'Shaw', 'Casemiro', 'Eriksen', 'Fernandes', 'Sancho', 'Rashford', 'Martial'].map((player, index) => (
                    <div key={index} className="flex items-center py-1 border-b border-gray-50">
                      <span className="w-6 text-xs text-gray-500">{index + 1}</span>
                      <span className="text-sm">{player}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Liverpool (4-3-3)</h3>
                <div className="space-y-1">
                  {['Alisson', 'Alexander-Arnold', 'Van Dijk', 'Konaté', 'Robertson', 'Fabinho', 'Henderson', 'Thiago', 'Salah', 'Nunez', 'Diaz'].map((player, index) => (
                    <div key={index} className="flex items-center py-1 border-b border-gray-50">
                      <span className="w-6 text-xs text-gray-500">{index + 1}</span>
                      <span className="text-sm">{player}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="p-4 bg-white rounded-md mx-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Match Statistics</h2>
            <div className="space-y-3">
              {[
                { name: 'Possession', home: 58, away: 42 },
                { name: 'Shots', home: 12, away: 8 },
                { name: 'Shots on Target', home: 5, away: 3 },
                { name: 'Corners', home: 7, away: 4 },
                { name: 'Fouls', home: 10, away: 12 },
                { name: 'Yellow Cards', home: 2, away: 3 },
                { name: 'Passes', home: 532, away: 387 },
                { name: 'Pass Accuracy', home: 87, away: 83 }
              ].map((stat, index) => (
                <div key={index} className="pb-2 border-b border-gray-50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">{stat.home}</span>
                    <span className="text-gray-600">{stat.name}</span>
                    <span className="font-bold">{stat.away}</span>
                  </div>
                  <div className="flex h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${stat.home / (stat.home + stat.away) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${stat.away / (stat.home + stat.away) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'standings' && (
          <div className="p-4 bg-white rounded-md mx-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Premier League Standings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-2 w-8">#</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-center py-2 px-2">P</th>
                    <th className="text-center py-2 px-2">W</th>
                    <th className="text-center py-2 px-2">D</th>
                    <th className="text-center py-2 px-2">L</th>
                    <th className="text-center py-2 px-2">GD</th>
                    <th className="text-center py-2 pl-2">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 1, team: 'Arsenal', p: 26, w: 19, d: 4, l: 3, gd: 36, pts: 61 },
                    { pos: 2, team: 'Man City', p: 25, w: 18, d: 4, l: 3, gd: 38, pts: 58 },
                    { pos: 3, team: 'Liverpool', p: 26, w: 16, d: 6, l: 4, gd: 32, pts: 54, highlight: true },
                    { pos: 4, team: 'Aston Villa', p: 26, w: 15, d: 4, l: 7, gd: 13, pts: 49 },
                    { pos: 5, team: 'Tottenham', p: 25, w: 14, d: 4, l: 7, gd: 11, pts: 46 },
                    { pos: 6, team: 'Man United', p: 25, w: 13, d: 2, l: 10, gd: 0, pts: 41, highlight: true },
                    { pos: 7, team: 'Newcastle', p: 26, w: 12, d: 3, l: 11, gd: 10, pts: 39 },
                    { pos: 8, team: 'Brighton', p: 26, w: 9, d: 9, l: 8, gd: 0, pts: 36 }
                  ].map(team => (
                    <tr key={team.pos} className={`border-b border-gray-50 ${team.highlight ? 'bg-blue-50' : ''}`}>
                      <td className="py-2 pr-2">{team.pos}</td>
                      <td className="py-2 font-medium">{team.team}</td>
                      <td className="text-center py-2 px-2">{team.p}</td>
                      <td className="text-center py-2 px-2">{team.w}</td>
                      <td className="text-center py-2 px-2">{team.d}</td>
                      <td className="text-center py-2 px-2">{team.l}</td>
                      <td className="text-center py-2 px-2">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                      <td className="text-center py-2 pl-2 font-bold">{team.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      <MatchBottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default MatchDetailsPage;