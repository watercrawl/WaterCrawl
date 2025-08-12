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
  iconBgColor = 'bg-primary-100 dark:bg-primary-900',
  iconTextColor = 'text-primary-600 dark:text-primary-400',
  buttonColor = 'bg-primary-600',
  buttonHoverColor = 'hover:bg-primary-700',
  buttonFocusColor = 'focus:ring-primary-500',
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <Icon className={`h-6 w-6 ${iconTextColor}`} />
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
            <div className="mt-4">
              <Link
                to={linkTo}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${buttonColor} ${buttonHoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonFocusColor}`}
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
