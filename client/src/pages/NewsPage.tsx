import React from 'react';
import NewsSection from '@/components/news/NewsSection';

const NewsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Football News</h1>
            <p className="text-gray-600">Stay updated with the latest football news and updates</p>
          </div>

          <NewsSection 
            title="Latest Football News"
            maxItems={50}
            showImages={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};

export default NewsPage;