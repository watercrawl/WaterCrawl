import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '../../components/shared/Button';
import Loading from '../../components/shared/Loading';

const StripeCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [callbackState, setCallbackState] = useState<string | null>(null);

  useEffect(() => {
    const state = searchParams.get('state');
    setCallbackState(state);
    setIsLoading(false);

    // Optionally, you can add specific logic for each state
    switch (state) {
      case 'payment-success':
        toast.success('New subscription activated successfully!');
        break;
      case 'payment-cancel':
        toast.error('Subscription process cancelled.');
        break;
      case 'subscription-cancel':
        toast.success('Subscription will continue as planned.', {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mx-auto" />
        });
        break;
      case 'subscription-cancel-success':
        toast.success('Subscription will be deactivated at the end of the current period.');
        break;
      case 'payment-method-update-cancel':
        toast.error('Payment method update cancelled.');
        break;
      case 'payment-method-update-success':
        toast.success('Payment method updated successfully!');
        break;
      default:
        toast.error('Unknown callback state');
    }
  }, [searchParams, navigate]);

  const getStateDetails = () => {
    switch (callbackState) {
      case 'payment-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: 'Subscription Activated',
          description: 'Your new subscription is now active. Enjoy your enhanced features!',
          buttonText: 'Go to Dashboard',
          onClick: () => navigate('/dashboard')
        };
      case 'payment-cancel':
        return {
          icon: <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />,
          title: 'Subscription Process Cancelled',
          description: 'You have cancelled the subscription process. Feel free to explore other plans.',
          buttonText: 'View Plans',
          onClick: () => navigate('/dashboard/plans')
        };
      case 'subscription-cancel':
        return {
          icon: <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto" />,
          title: 'Subscription Continues',
          description: 'Your current subscription will remain active. No changes have been made.',
          buttonText: 'Back to Dashboard',
          onClick: () => navigate('/dashboard/')
        };
      case 'subscription-cancel-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: 'Subscription Cancellation Confirmed',
          description: 'Your subscription will be deactivated at the end of the current billing period.',
          buttonText: 'Back to Settings',
          onClick: () => navigate('/dashboard/settings#billing')
        };
      case 'payment-method-update-cancel':
        return {
          icon: <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />,
          title: 'Payment Method Update Cancelled',
          description: 'Your current payment method remains unchanged.',
          buttonText: 'Back to Settings',
          onClick: () => navigate('/dashboard/settings#billing')
        };
      case 'payment-method-update-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: 'Payment Method Updated',
          description: 'Your payment method has been successfully updated.',
          buttonText: 'Back to Settings',
          onClick: () => navigate('/dashboard/settings#billing')
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto" />,
          title: 'Unknown State',
          description: 'An unexpected error occurred. Please contact support.',
          buttonText: 'Back to Dashboard',
          onClick: () => navigate('/dashboard')
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  const { icon, title, description, buttonText, onClick } = getStateDetails();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {icon}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {description}
        </p>
        <Button 
          variant="primary" 
          onClick={onClick}
          className="w-full"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default StripeCallbackPage;
