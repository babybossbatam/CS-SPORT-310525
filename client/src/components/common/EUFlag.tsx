
import React from 'react';

interface EUFlagProps {
  className?: string;
  size?: number;
}

const EUFlag: React.FC<EUFlagProps> = ({ className = "", size = 32 }) => {
  return (
    <div 
      className={`eu-flag-container ${className}`}
      style={{ 
        width: size, 
        height: size,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="eu-flag-svg"
      >
        {/* Blue background circle */}
        <circle
          cx="16"
          cy="16"
          r="16"
          fill="#003399"
        />
        
        {/* 12 yellow stars in a circle */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) - 90; // Start from top, 30 degrees apart
          const radian = (angle * Math.PI) / 180;
          const starRadius = 10; // Distance from center
          const x = 16 + starRadius * Math.cos(radian);
          const y = 16 + starRadius * Math.sin(radian);
          
          return (
            <g key={i}>
              <polygon
                points={`${x},${y-1.5} ${x+0.5},${y-0.5} ${x+1.5},${y-0.5} ${x+0.7},${y+0.2} ${x+1},${y+1.2} ${x},${y+0.7} ${x-1},${y+1.2} ${x-0.7},${y+0.2} ${x-1.5},${y-0.5} ${x-0.5},${y-0.5}`}
                fill="#FFCC00"
                transform={`rotate(${angle + 90} ${x} ${y})`}
              />
            </g>
          );
        })}
        
        {/* Glossy overlay effect */}
        <defs>
          <radialGradient id="euGloss" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="16"
          fill="url(#euGloss)"
        />
      </svg>
    </div>
  );
};

export default EUFlag;
