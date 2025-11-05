import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

interface AnimatedProcessingProps {
  className?: string;
}

export const AnimatedProcessing: React.FC<AnimatedProcessingProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    t('processing.crawling'),
    t('processing.converting'),
    t('processing.analyzing'),
    t('processing.almostThere'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`text-md text-muted-foreground ${className} self-center`}>
      <div className="flex items-center gap-2">
        <span className="animate-charcter inline-block">{messages[messageIndex]}</span>
      </div>
    </div>
  );
};
