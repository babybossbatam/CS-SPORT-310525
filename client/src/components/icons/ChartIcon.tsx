
import React from 'react';

interface ChartIconProps {
  className?: string;
}

const ChartIcon: React.FC<ChartIconProps> = ({ className = "h-4 w-4" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fill: "currentColor" }}
    >
      <path d="M0 20h24v4H0v-4zm2-8h4v6H2v-6zm6 0h4v6H8v-6zm6 0h4v6h-4v-6z" />
    </svg>
  );
};

export default ChartIcon;
