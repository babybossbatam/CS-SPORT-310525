import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface NewsItem {
  id: string;
  title: string;
  imageUrl: string;
  source: string;
  timeAgo: string;
  url: string;
}

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  
  const handleClick = () => {
    // Open in a new tab if it's an external link
    window.open(news.url, '_blank');
  };
  
  return (
    <Card 
      className="w-full overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md"
      onClick={handleClick}
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img 
          src={news.imageUrl} 
          alt={news.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardContent className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 mb-2 h-10">{news.title}</h3>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{news.source}</span>
          <span>{news.timeAgo} Ago</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;