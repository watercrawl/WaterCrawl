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
        return 'bg-primary-100 text-primary-800';
      case 'success':
        return 'bg-success-light text-success-dark';
      case 'warning':
        return 'bg-warning-light text-warning-dark';
      case 'danger':
        return 'bg-error-light text-error';
      case 'info':
        return 'bg-alert-info-bg text-alert-info-text border-alert-info-border';
      default:
        return 'bg-primary-100 text-primary-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex flex-col border p-2 ${
        isSelected ? 'border-primary-500 bg-primary-50' : 'border-border'
      } cursor-pointer rounded-lg transition-all hover:border-primary`}
    >
      <div className="flex items-center">
        <div
          className={`h-5 w-5 flex-shrink-0 ${iconBgColor} ${iconDarkBgColor} me-1.5 flex items-center justify-center rounded-full`}
        >
          {icon}
        </div>
        <h3 className="me-1.5 text-xs font-medium text-foreground">{title}</h3>
        {badge && (
          <span
            className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-xs font-medium ${getBadgeColors(badge.color)}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

export default OptionCard;
