import React, { HTMLAttributes, useRef, KeyboardEvent } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface AccessibleWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  ariaDescription?: string;
  onKeyboardActivate?: () => void;
  focusable?: boolean;
}

/**
 * A wrapper component that enhances any UI element with accessibility features
 * Adapts based on the current accessibility settings
 */
const AccessibleWrapper: React.FC<AccessibleWrapperProps> = ({
  children,
  ariaLabel,
  ariaLive,
  ariaDescription,
  role,
  className = '',
  onClick,
  onKeyboardActivate,
  focusable = true,
  tabIndex = 0,
  ...rest
}) => {
  const { highContrast, largeText, screenReaderMode } = useAccessibility();
  const divRef = useRef<HTMLDivElement>(null);
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && (onKeyboardActivate || onClick)) {
      e.preventDefault();
      if (onKeyboardActivate) {
        onKeyboardActivate();
      } else if (onClick) {
        onClick();
      }
    }
  };

  // Combine accessibility classes
  const accessibilityClasses = [
    className,
    highContrast ? 'high-contrast' : '',
    largeText ? 'large-text' : '',
    screenReaderMode ? 'screen-reader-optimized' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={divRef}
      className={accessibilityClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={focusable ? tabIndex : -1}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      role={role}
      {...rest}
    >
      {children}
      
      {/* Add extra screen reader context if needed */}
      {screenReaderMode && ariaDescription && (
        <span className="sr-only">{ariaDescription}</span>
      )}
    </div>
  );
};

export default AccessibleWrapper;