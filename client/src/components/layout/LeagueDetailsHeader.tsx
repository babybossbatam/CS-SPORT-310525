
import { useParams, Link } from 'wouter';
import { Calendar, Trophy, Newspaper, PlayCircle, BarChart2, Eye, History, ArrowLeftCircle } from 'lucide-react';

export const LeagueDetailsHeader = () => {
  const { id } = useParams();
  
  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center py-2 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            <ArrowLeftCircle className="h-4 w-4 inline mr-1" />
            Football
          </Link>
          <span className="mx-2">/</span>
          <span>Premier League</span>
          <span className="mx-2">/</span>
          <span className="text-gray-500">Matches</span>
        </div>
        
        {/* League Title */}
        <div className="flex items-center gap-3 py-4">
          <img 
            src={`https://media.api-sports.io/football/leagues/${id}.png`}
            alt="League"
            className="h-12 w-12"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=League';
            }}
          />
          <h1 className="text-2xl font-bold">PREMIER LEAGUE 2024/2025: MATCHES</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-6 border-b border-neutral-200">
          <Link href={`/league/${id}/details`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Details</Link>
          <Link href={`/league/${id}/matches`} className="px-3 py-4 border-b-2 border-blue-600 text-blue-600">Matches</Link>
          <Link href={`/league/${id}/standings`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Standings</Link>
          <Link href={`/league/${id}/news`} className="px-3 py-4 text-gray-600 hover:text-gray-900">News</Link>
          <Link href={`/league/${id}/highlights`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Highlights</Link>
          <Link href={`/league/${id}/stats`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Stats</Link>
          <Link href={`/league/${id}/insights`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Insights</Link>
          <Link href={`/league/${id}/transfers`} className="px-3 py-4 text-gray-600 hover:text-gray-900">Transfers</Link>
          <Link href={`/league/${id}/history`} className="px-3 py-4 text-gray-600 hover:text-gray-900">History</Link>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetailsHeader;
