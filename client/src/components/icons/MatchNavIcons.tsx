import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const MatchPageIcon: React.FC<IconProps> = ({ 
  size = 24,
  color = "#6B7173",
  className = ""
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M5 5.5H19C19.2761 5.5 19.5 5.72386 19.5 6V18C19.5 18.2761 19.2761 18.5 19 18.5H5C4.72386 18.5 4.5 18.2761 4.5 18V6C4.5 5.72386 4.72386 5.5 5 5.5Z" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14.5 9H16.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14.5 12H16.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14.5 15H16.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7.5 9H10.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7.5 12H10.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7.5 15H10.5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LineupsIcon: React.FC<IconProps> = ({ 
  size = 24,
  color = "#6B7173",
  className = ""
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect 
        x="4.5" 
        y="3.5" 
        width="15" 
        height="17" 
        rx="0.5" 
        stroke={color} 
      />
      <path 
        d="M8 8H16" 
        stroke={color} 
        strokeLinecap="round" 
      />
      <path 
        d="M8 12H16" 
        stroke={color} 
        strokeLinecap="round" 
      />
      <path 
        d="M8 16H16" 
        stroke={color} 
        strokeLinecap="round" 
      />
    </svg>
  );
};

export const StatsIcon: React.FC<IconProps> = ({ 
  size = 24,
  color = "#6B7173",
  className = ""
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M5 17L5 12" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M9 17L9 7" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M13 17L13 10" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M17 17L17 5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 19H20"
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const StandingsIcon: React.FC<IconProps> = ({ 
  size = 24,
  color = "#6B7173",
  className = ""
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M4 5L20 5" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 9L20 9" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 13L20 13" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M4 17L20 17" 
        stroke={color} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle 
        cx="7" 
        cy="5" 
        r="1" 
        fill={color} 
      />
      <circle 
        cx="10" 
        cy="9" 
        r="1" 
        fill={color} 
      />
      <circle 
        cx="8" 
        cy="13" 
        r="1" 
        fill={color} 
      />
      <circle 
        cx="11" 
        cy="17" 
        r="1" 
        fill={color} 
      />
    </svg>
  );
};