import React from 'react';

interface TvIconProps {
  className?: string;
}

const TvIcon: React.FC<TvIconProps> = ({ className = "h-4 w-4" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      style={{ fill: "currentColor" }}
    >
      <path d="M20 5.76506H14.414L16.707 3.43615L15.293 2L12 5.34458L8.707 2L7.293 3.43615L9.586 5.76506H4C2.897 5.76506 2 6.67611 2 7.79639V18.9687C2 20.089 2.897 21 4 21H20C21.103 21 22 20.089 22 18.9687V7.79639C22 6.67611 21.103 5.76506 20 5.76506ZM20 19H4V8H20V19Z" />
    </svg>
  );
};

export default TvIcon;