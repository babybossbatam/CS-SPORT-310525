
import React from 'react';
import { SphericalUSAFlag } from './SphericalUSAFlag';

interface SmartFlagProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const SmartFlag: React.FC<SmartFlagProps> = ({ 
  src, 
  alt, 
  size = 24, 
  className = "",
  onError 
}) => {
  // Handle custom flag types
  if (src.startsWith('custom:')) {
    const flagType = src.replace('custom:', '');
    
    switch (flagType) {
      case 'usa-spherical':
        return (
          <SphericalUSAFlag 
            size={size} 
            className={className} 
          />
        );
      default:
        // Fallback to regular image
        break;
    }
  }

  // Regular flag image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ width: size, height: size * 0.67 }} // Standard flag ratio
      onError={onError}
    />
  );
};

export default SmartFlag;
