
import React from 'react';

interface CircularUSAFlagProps {
  size?: number;
  className?: string;
}

export const CircularUSAFlag: React.FC<CircularUSAFlagProps> = ({ 
  size = 24, 
  className = "" 
}) => {
  return (
    <div 
      className={`relative rounded-full overflow-hidden shadow-sm ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: 'linear-gradient(45deg, #B22234 0%, #B22234 100%)'
      }}
    >
      {/* Red and white stripes */}
      <div className="absolute inset-0">
        {[...Array(13)].map((_, i) => (
          <div
            key={i}
            className={`w-full ${i % 2 === 0 ? 'bg-red-600' : 'bg-white'}`}
            style={{
              height: `${100 / 13}%`,
              top: `${(i * 100) / 13}%`,
              position: 'absolute'
            }}
          />
        ))}
      </div>

      {/* Blue canton with stars */}
      <div 
        className="absolute top-0 left-0 bg-blue-800 flex items-center justify-center"
        style={{
          width: '40%',
          height: `${(7 * 100) / 13}%`, // 7 stripes height
          background: '#002868'
        }}
      >
        {/* Stars pattern - simplified for small size */}
        <div className="grid grid-cols-3 gap-px">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="text-white text-center flex items-center justify-center"
              style={{ fontSize: size * 0.08 }}
            >
              ★
            </div>
          ))}
        </div>
      </div>

      {/* 3D effect overlay */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.1) 100%)`,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default CircularUSAFlag;
