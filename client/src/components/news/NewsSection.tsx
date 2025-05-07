import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRelativeTime } from '@/lib/utils';
import { NewsItem } from '../../../server/types';

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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Live Football News</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-40" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          // News items
          newsItems.map((newsItem) => (
            <Card 
              key={newsItem.id} 
              className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => navigate(newsItem.url)}
            >
              <img 
                src={`${newsItem.imageUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80`}
                alt={newsItem.title} 
                className="w-full h-40 object-cover"
              />
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-1">{newsItem.title}</h4>
                <p className="text-xs text-neutral-500">{getRelativeTime(newsItem.publishedAt)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsSection;
