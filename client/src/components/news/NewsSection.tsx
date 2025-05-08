import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRelativeTime } from '@/lib/utils';
import { Newspaper } from 'lucide-react';

// Define the NewsItem type locally since we'll be using mock data for now
interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  url: string;
}

// Mock news data - in a real app, this would be fetched from an API
const mockNewsItems: NewsItem[] = [
  {
    id: 1,
    title: 'UEFA announces new Champions League format for next season',
    content: 'UEFA has unveiled a new Champions League format that will come into effect next season...',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: 'UEFA',
    url: '/news/1'
  },
  {
    id: 2,
    title: 'Star striker completes record transfer to Premier League',
    content: 'A major transfer has been completed with the star striker moving to the Premier League...',
    imageUrl: 'https://images.unsplash.com/photo-1570498839593-e565b39455fc',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    source: 'Sky Sports',
    url: '/news/2'
  },
  {
    id: 3,
    title: 'Stadium renovation project approved for iconic football venue',
    content: 'The renovation project for one of football\'s most iconic stadiums has been approved...',
    imageUrl: 'https://images.unsplash.com/photo-1540339832862-474599807836',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    source: 'BBC Sport',
    url: '/news/3'
  }
];

const NewsSection = () => {
  const [, navigate] = useLocation();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API fetch with a delay
    const timer = setTimeout(() => {
      setNewsItems(mockNewsItems);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="mb-6 mt-10">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-600" />
          Football Latest News
        </h2>
        <button className="text-sm text-blue-600 hover:underline">View All News</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border border-gray-200 shadow-sm">
              <Skeleton className="w-full h-40" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          // News items
          newsItems.map((newsItem) => (
            <Card 
              key={newsItem.id} 
              className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-gray-200"
              onClick={() => navigate(newsItem.url)}
            >
              <div className="relative">
                <img 
                  src={`${newsItem.imageUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80`}
                  alt={newsItem.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  {newsItem.source}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-2">{newsItem.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{newsItem.content}</p>
                <p className="text-xs text-neutral-500 flex items-center">
                  <span className="bg-gray-200 rounded-full h-1 w-1 mr-2"></span>
                  {getRelativeTime(newsItem.publishedAt)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsSection;
