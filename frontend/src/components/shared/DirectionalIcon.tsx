import React from 'react';
import { useDirection } from '../../contexts/DirectionContext';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowLongRightIcon,
  ArrowLongLeftIcon,
} from '@heroicons/react/24/outline';

interface DirectionalIconProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  flip?: boolean;
  [key: string]: any;
}

/**
 * DirectionalIcon Component
 *
 * Automatically flips icons in RTL mode when needed.
 *
 * Usage:
 * ```tsx
 * import { ChevronRightIcon } from '@heroicons/react/24/outline';
 * import { DirectionalIcon } from './components/shared/DirectionalIcon';
 *
 * // Icon will flip in RTL
 * <DirectionalIcon icon={ChevronRightIcon} flip={true} className="h-5 w-5" />
 *
 * // Icon will NOT flip in RTL
 * <DirectionalIcon icon={SearchIcon} flip={false} className="h-5 w-5" />
 * ```
 */
export const DirectionalIcon: React.FC<DirectionalIconProps> = ({
  icon: Icon,
  className = '',
  flip = false,
  ...props
}) => {
  const { direction } = useDirection();

  const shouldFlip = flip && direction === 'rtl';
  const combinedClassName = `${className} ${shouldFlip ? 'rotate-180' : ''}`.trim();

  return <Icon className={combinedClassName} {...props} />;
};

/**
 * Chevron Right - Automatically flips in RTL
 */
export const ChevronRight: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ChevronRightIcon} flip={true} {...props} />;
};

/**
 * Chevron Left - Automatically flips in RTL
 */
export const ChevronLeft: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ChevronLeftIcon} flip={true} {...props} />;
};

/**
 * Arrow Right - Automatically flips in RTL
 */
export const ArrowRight: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ArrowRightIcon} flip={true} {...props} />;
};

/**
 * Arrow Left - Automatically flips in RTL
 */
export const ArrowLeft: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ArrowLeftIcon} flip={true} {...props} />;
};

/**
 * Arrow Long Right - Automatically flips in RTL
 */
export const ArrowLongRight: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ArrowLongRightIcon} flip={true} {...props} />;
};

/**
 * Arrow Long Left - Automatically flips in RTL
 */
export const ArrowLongLeft: React.FC<Omit<DirectionalIconProps, 'icon' | 'flip'>> = props => {
  return <DirectionalIcon icon={ArrowLongLeftIcon} flip={true} {...props} />;
};

/**
 * Hook to get the appropriate "forward" icon based on direction
 */
export const useForwardIcon = () => {
  const { direction } = useDirection();
  return direction === 'rtl' ? ChevronLeftIcon : ChevronRightIcon;
};

/**
 * Hook to get the appropriate "back" icon based on direction
 */
export const useBackIcon = () => {
  const { direction } = useDirection();
  return direction === 'rtl' ? ChevronRightIcon : ChevronLeftIcon;
};

export default DirectionalIcon;
