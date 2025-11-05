import React from 'react';

import { Link } from 'react-router-dom';

interface AdminCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  linkTo: string;
  linkText?: string;
  iconBgColor?: string;
  iconTextColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonFocusColor?: string;
}

const AdminCard: React.FC<AdminCardProps> = ({
  icon: Icon,
  title,
  description,
  linkTo,
  linkText = 'Manage',
  iconBgColor = 'bg-primary-soft',
  iconTextColor = 'text-primary',
  buttonColor = 'bg-primary',
  buttonHoverColor = 'hover:bg-primary-hover',
  buttonFocusColor = 'focus:ring-primary',
}) => {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-md">
      <div className="p-6">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <Icon className={`h-6 w-6 ${iconTextColor}`} />
          </div>
          <div className="ms-5">
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4">
              <Link
                to={linkTo}
                className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${buttonColor} ${buttonHoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonFocusColor}`}
              >
                {linkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCard;
