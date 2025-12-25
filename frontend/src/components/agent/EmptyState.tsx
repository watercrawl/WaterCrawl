import React from 'react';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return <p className="text-xs text-muted-foreground italic">{message}</p>;
};

export default EmptyState;
