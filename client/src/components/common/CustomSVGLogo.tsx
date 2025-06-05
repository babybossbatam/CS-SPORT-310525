
import React from 'react';
import CustomCountryFlag from './CustomCountryFlags';
import { hasCustomFlag } from './CustomCountryFlags';

interface CustomSVGLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  country?: string; // New prop to specify which country flag to show
  type?: 'default' | 'country'; // Type of logo to display
}

const CustomSVGLogo: React.FC<CustomSVGLogoProps> = ({ 
  size = 64, 
  className = '',
  onClick,
  country,
  type = 'default'
}) => {
  // If country is specified and we have a custom flag, use that
  if (type === 'country' && country && hasCustomFlag(country)) {
    return (
      <CustomCountryFlag
        country={country}
        size={size}
        className={className}
        onClick={onClick}
      />
    );
  }

  // If country is specified but no custom flag exists, generate one
  if (type === 'country' && country) {
    return (
      <CustomCountryFlag
        country={country}
        size={size}
        className={className}
        onClick={onClick}
      />
    );
  }

  // Default logo (your original design)
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64"
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <defs>
        <clipPath id="circleView">
          <circle cx="32" cy="32" r="32"/>
        </clipPath>
      </defs>
      <g clipPath="url(#circleView)">
        <rect width="64" height="64" fill="#3EAE46"/>
        <polygon points="32,8 60,32 32,56 4,32" fill="#FFCC29"/>
        <ellipse cx="32" cy="32" rx="16" ry="16" fill="#3E4095"/>
      </g>
      {/* Glossy effect */}
      <ellipse cx="32" cy="20" rx="22" ry="10" fill="white" opacity="0.2"/>
    </svg>
  );
};

export default CustomSVGLogo;
