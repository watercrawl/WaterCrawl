import React from 'react';
import Loading from './Loading';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  href?: string;
  as?: 'button' | 'link';
}

const variantStyles = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600',
  secondary: 'bg-gray-600 text-white shadow-sm hover:bg-gray-500 focus-visible:outline-gray-600',
  outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:outline-red-600',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      href,
      as = 'button',
      ...props
    },
    ref
  ) => {
    const baseClassName = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-md
      transition-colors duration-200
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    if (as === 'link' && href) {
      return (
        <Link
          to={href}
          className={baseClassName}
        >
          {loading && <Loading size="sm" className="text-current" />}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={baseClassName}
        {...props}
      >
        {loading && <Loading size="sm" className="text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
