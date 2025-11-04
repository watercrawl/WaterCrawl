import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  rightContent?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  className = '',
  rightContent,
}) => {
  return (
    <div className={`rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        {rightContent || <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
};
