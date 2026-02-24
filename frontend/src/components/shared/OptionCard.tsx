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
  disabled?: boolean;
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
  disabled = false,
}) => {
  const getBadgeColors = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-soft text-primary-strong';
      case 'success':
        return 'bg-success-soft text-success-strong';
      case 'warning':
        return 'bg-warning-soft text-warning-strong';
      case 'danger':
        return 'bg-error-soft text-error-strong';
      case 'info':
        return 'bg-info-soft text-info-strong border-info-strong';
      default:
        return 'bg-primary-soft text-primary-strong';
    }
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`flex flex-col border p-2 ${
        isSelected ? 'border-primary bg-primary-soft' : 'border-border'
      } ${
        disabled 
          ? 'cursor-not-allowed opacity-60' 
          : 'cursor-pointer hover:border-primary'
      } rounded-lg transition-all`}
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
