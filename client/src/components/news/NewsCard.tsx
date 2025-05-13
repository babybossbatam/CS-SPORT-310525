import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  source: string;
  url: string | null;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback image if the provided image URL fails
  const fallbackImage = 'https://images.pexels.com/photos/47343/the-ball-stadion-football-the-pitch-47343.jpeg';
  
  const handleClick = () => {
    // Open in a new tab if it's an external link with a valid URL
    if (news.url && typeof news.url === 'string') {
      let safeUrl = news.url;
      // Make sure URL starts with http or https
      if (!safeUrl.startsWith('http')) {
        safeUrl = `https://${safeUrl}`;
      }
      
      // If it's a relative URL from our domain, convert to absolute
      if (safeUrl.startsWith('/')) {
        safeUrl = `${window.location.origin}${safeUrl}`;
      }
      
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Calculate time ago text from publishedAt
  const getTimeAgo = () => {
    try {
      const publishedDate = new Date(news.publishedAt);
      const now = new Date();
      return formatDistance(publishedDate, now, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };
  
  return (
    <Card 
      className="w-full overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] border-0 shadow-none"
      onClick={handleClick}
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img 
          src={imageError ? fallbackImage : (news.imageUrl || fallbackImage)} 
          alt={news.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
        />
      </div>
      <CardContent className="p-3 px-0">
        <h3 className="text-sm font-medium line-clamp-2 mb-2 h-10">{news.title}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{news.source}</span>
          <span>{getTimeAgo()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;