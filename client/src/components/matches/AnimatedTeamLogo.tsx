import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTeamLogoProps {
  logoUrl: string;
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  isHome?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  winner?: boolean;
}

const AnimatedTeamLogo: React.FC<AnimatedTeamLogoProps> = ({ 
  logoUrl, 
  teamName, 
  size = 'md',
  isHome = true,
  onClick,
  winner = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Safety measure - enable animations only after component has mounted
  // and disable them if errors occur
  useEffect(() => {
    try {
      setIsMounted(true);
      
      // Error handler to disable animations
      const handleError = () => {
        console.log("Disabling animations in AnimatedTeamLogo due to error");
        setAnimationsEnabled(false);
      };
      
      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        setIsMounted(false);
      };
    } catch (error) {
      console.error("Error in AnimatedTeamLogo setup:", error);
      setAnimationsEnabled(false);
    }
  }, []);

  // Determine logo size based on the size prop
  const logoSize = {
    sm: "h-[40px]",
    md: "h-[69px]",
    lg: "h-[90px]"
  }[size];

  // Removed animation variants to fix transformation errors
  const logoVariants = {
    initial: { 
      scale: 1
    },
    hover: { 
      scale: 1
    },
    tap: { 
      scale: 1
    },
    winner: {
      scale: 1
    }
  };
  
  // Simplified trophy animation
  const trophyVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1
    }
  };

  // Simplified glow effect animation without complex transitions
  const glowVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 0.6,
      transition: {
        duration: 0.3
      }
    }
  };

  // Fallback non-animated version
  if (!animationsEnabled) {
    return (
      <div className="relative">
        <img 
          src={logoUrl} 
          alt={teamName}
          className={`${logoSize} w-auto object-contain ${winner ? 'drop-shadow-lg' : ''}`}
          onError={(e) => {
            if (!imageFailed) {
              setImageFailed(true);
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
            }
          }}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
        />
        
        {/* Simple trophy icon for winners */}
        {winner && (
          <div className="absolute -top-4 -right-4 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743-.143A1.494 1.494 0 0 1 12 11.286V20.25a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-3.857a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 0 .75-.75V2.625a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0-.75.75v1.125c0 .621-.504 1.125-1.125 1.125H13.5a6.75 6.75 0 0 0-8.334-2.979Z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Animated version
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background glow effect */}
      {isMounted && (
        <AnimatePresence>
          {(isHovered || winner) && (
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-400/40 z-10"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={glowVariants}
            />
          )}
        </AnimatePresence>
      )}
      
      {/* Team logo with animations */}
      <motion.div
        className="relative z-20"
        initial="initial"
        animate={winner ? "winner" : (isHovered ? "hover" : "initial")}
        whileTap="tap"
        variants={logoVariants}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <img 
          src={logoUrl} 
          alt={teamName}
          className={`${logoSize} w-auto object-contain`}
          onError={(e) => {
            if (!imageFailed) {
              setImageFailed(true);
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
            }
          }}
        />
        
        {/* Trophy/star icon for winners */}
        {winner && isMounted && (
          <motion.div 
            className="absolute -top-4 -right-4 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            initial="hidden"
            animate="visible"
            variants={trophyVariants}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743-.143A1.494 1.494 0 0 1 12 11.286V20.25a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-3.857a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 0 .75-.75V2.625a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0-.75.75v1.125c0 .621-.504 1.125-1.125 1.125H13.5a6.75 6.75 0 0 0-8.334-2.979Z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </motion.div>
      
      {/* Team name tooltip - removed animation effects */}
      {isMounted && isHovered && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 -bottom-8 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30"
        >
          {teamName}
        </div>
      )}
    </div>
  );
};

export default AnimatedTeamLogo;