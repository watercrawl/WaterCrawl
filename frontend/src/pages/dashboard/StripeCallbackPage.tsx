import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '../../components/shared/Button';
import Loading from '../../components/shared/Loading';

const StripeCallbackPage: React.FC = () => {
  const { t } = useTranslation();
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
        toast.success(t('stripe.callback.paymentSuccess'));
        break;
      case 'payment-cancel':
        toast.error(t('stripe.callback.paymentCancel'));
        break;
      case 'subscription-cancel':
        toast.success(t('stripe.callback.subscriptionContinues'), {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mx-auto" />
        });
        break;
      case 'subscription-cancel-success':
        toast.success(t('stripe.callback.subscriptionCancelSuccess'));
        break;
      case 'payment-method-update-cancel':
        toast.error(t('stripe.callback.paymentMethodCancel'));
        break;
      case 'payment-method-update-success':
        toast.success(t('stripe.callback.paymentMethodSuccess'));
        break;
      default:
        toast.error(t('errors.unknownState'));
    }
  }, [searchParams, navigate, t]);

  const getStateDetails = () => {
    switch (callbackState) {
      case 'payment-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: t('stripe.status.subscriptionActivated'),
          description: t('stripe.status.subscriptionActivatedDesc'),
          buttonText: t('dashboard.navigation.dashboard'),
          onClick: () => navigate('/dashboard')
        };
      case 'payment-cancel':
        return {
          icon: <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />,
          title: t('stripe.status.processCanceled'),
          description: t('stripe.status.processCanceledDesc'),
          buttonText: t('plans.viewPlans'),
          onClick: () => navigate('/dashboard/plans')
        };
      case 'subscription-cancel':
        return {
          icon: <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto" />,
          title: t('stripe.status.subscriptionContinues'),
          description: t('stripe.status.subscriptionContinuesDesc'),
          buttonText: t('dashboard.navigation.backToDashboard'),
          onClick: () => navigate('/dashboard/')
        };
      case 'subscription-cancel-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: t('stripe.status.cancellationConfirmed'),
          description: t('stripe.status.cancellationConfirmedDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing')
        };
      case 'payment-method-update-cancel':
        return {
          icon: <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />,
          title: t('stripe.status.paymentUpdateCanceled'),
          description: t('stripe.status.paymentUpdateCanceledDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing')
        };
      case 'payment-method-update-success':
        return {
          icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />,
          title: t('stripe.status.paymentUpdated'),
          description: t('stripe.status.paymentUpdatedDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing')
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto" />,
          title: t('errors.unknownState'),
          description: t('errors.contactSupport'),
          buttonText: t('dashboard.navigation.backToDashboard'),
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
