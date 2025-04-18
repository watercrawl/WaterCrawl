import React, { useEffect, useState } from 'react';

interface AnimatedProcessingProps {
  className?: string;
}

export const AnimatedProcessing: React.FC<AnimatedProcessingProps> = ({ className = '' }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "🕷️ Crawling the web",
    "❄️ Converting data",
    "🔍 Analyzing content",
    "🎯 Almost there"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`text-md text-gray-500 dark:text-gray-400 ${className} self-center`}>
      <div className="flex items-center gap-2">
        <span className="animate-charcter inline-block">{messages[messageIndex]}</span>
      </div>
    </div>
  );
};
