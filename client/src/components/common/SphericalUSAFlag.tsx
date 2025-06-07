
import React from 'react';

interface SphericalUSAFlagProps {
  size?: number;
  className?: string;
}

export const SphericalUSAFlag: React.FC<SphericalUSAFlagProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <div 
      className={`relative rounded-full overflow-hidden shadow-lg ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: '#B22234',
        boxShadow: `
          inset -${size * 0.1}px -${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.3),
          inset ${size * 0.05}px ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.2),
          0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.2)
        `
      }}
    >
      {/* Curved stripes effect */}
      <svg 
        width={size} 
        height={size} 
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <clipPath id={`circle-${size}`}>
            <circle cx={size/2} cy={size/2} r={size/2} />
          </clipPath>
          
          {/* Gradient for 3D effect */}
          <radialGradient id={`sphere-gradient-${size}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </radialGradient>
        </defs>
        
        {/* Red and white stripes */}
        <g clipPath={`url(#circle-${size})`}>
          {[...Array(13)].map((_, i) => (
            <rect
              key={i}
              x="0"
              y={i * size / 13}
              width={size}
              height={size / 13}
              fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
            />
          ))}
          
          {/* Blue canton */}
          <rect
            x="0"
            y="0"
            width={size * 0.4}
            height={size * 7 / 13}
            fill="#002868"
          />
          
          {/* Stars - simplified pattern */}
          {[...Array(25)].map((_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = (col + 0.5) * (size * 0.4 / 5);
            const y = (row + 0.5) * (size * 7 / 13 / 5);
            
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={size * 0.03}
              >
                ★
              </text>
            );
          })}
          
          {/* Spherical highlight overlay */}
          <circle
            cx={size/2}
            cy={size/2}
            r={size/2}
            fill={`url(#sphere-gradient-${size})`}
          />
        </g>
      </svg>
    </div>
  );
};

export default SphericalUSAFlag;
