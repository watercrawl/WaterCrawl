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
  primary: 'bg-primary-hover text-white shadow-sm hover:bg-primary focus-visible:outline-primary',
  secondary: 'bg-card text-white shadow-sm hover:bg-muted focus-visible:outline-ring',
  outline: 'bg-transparent border border-input-border text-foreground hover:bg-muted',
  danger: 'bg-error text-white shadow-sm hover:bg-error focus-visible:outline-error',
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
        <Link to={href} className={baseClassName}>
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
