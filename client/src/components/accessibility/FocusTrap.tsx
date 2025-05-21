import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
}

/**
 * Component to trap focus within a specific area for accessibility
 * Especially useful for modals, dialogs, and dropdown menus
 */
const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  isActive, 
  onEscape 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  
  // Save the previously focused element and focus the first focusable element in the trap
  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement;
      
      // Focus the first focusable element in the container
      focusFirstElement();
      
      // Prevent scrolling of background content
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when not active
      document.body.style.overflow = '';
      
      // Restore focus to the previous element
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);
  
  // Handle tab key navigation
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      if (!containerRef.current) return;
      
      // Get all focusable elements
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Handle tab navigation to keep focus within the trap
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
  
  // Get all focusable elements within the container
  const getFocusableElements = () => {
    if (!containerRef.current) return [];
    
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    return Array.from(containerRef.current.querySelectorAll(selector))
      .filter(el => el instanceof HTMLElement && el.tabIndex !== -1) as HTMLElement[];
  };
  
  // Focus the first focusable element
  const focusFirstElement = () => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      // If no focusable elements, focus the container itself
      containerRef.current.focus();
    }
  };
  
  if (!isActive) return <>{children}</>;
  
  return (
    <div 
      ref={containerRef} 
      className="focus-trap"
      tabIndex={-1}
      aria-modal={true}
      role="dialog"
    >
      {/* Visually hidden element to catch focus at the start */}
      <div tabIndex={0} aria-hidden="true" className="sr-only focus-trap-start" />
        
      {children}
      
      {/* Visually hidden element to catch focus at the end */}
      <div tabIndex={0} aria-hidden="true" className="sr-only focus-trap-end" />
    </div>
  );
};

export default FocusTrap;