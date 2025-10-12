import React from 'react';

export interface OptionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  badge?: {
    text: string;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  };
  iconBgColor: string;
  iconDarkBgColor: string;
}

const OptionCard: React.FC<OptionCardProps> = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
  badge,
  iconBgColor,
  iconDarkBgColor,
}) => {
  const getBadgeColors = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-800/30 dark:text-primary-300';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300';
      case 'danger':
        return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300';
      default:
        return 'bg-primary-100 text-primary-800 dark:bg-primary-800/30 dark:text-primary-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex flex-col p-2 border ${
        isSelected 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : 'border-gray-200 dark:border-gray-700'
      } rounded-lg cursor-pointer transition-all hover:border-primary-300 dark:hover:border-primary-700`}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-5 w-5 ${iconBgColor} ${iconDarkBgColor} rounded-full flex items-center justify-center me-1.5`}>
          {icon}
        </div>
        <h3 className="text-xs font-medium text-gray-900 dark:text-white me-1.5">{title}</h3>
        {badge && (
          <span className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-xs font-medium ${getBadgeColors(badge.color)}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );
};

export default OptionCard;
