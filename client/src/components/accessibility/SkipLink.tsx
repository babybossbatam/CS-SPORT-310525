import React from 'react';

interface SkipLinkProps {
  targetId: string;
  text?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({ 
  targetId, 
  text = "Skip to main content" 
}) => {
  return (
    <a 
      href={`#${targetId}`} 
      className="skip-link"
      data-testid="skip-link"
    >
      {text}
    </a>
  );
};

export default SkipLink;