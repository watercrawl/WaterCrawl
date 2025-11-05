import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';


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
          icon: <ExclamationTriangleIcon className="mx-auto h-6 w-6 text-warning" />,
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
          icon: <CheckCircleIcon className="mx-auto h-16 w-16 text-success" />,
          title: t('stripe.status.subscriptionActivated'),
          description: t('stripe.status.subscriptionActivatedDesc'),
          buttonText: t('dashboard.navigation.dashboard'),
          onClick: () => navigate('/dashboard'),
        };
      case 'payment-cancel':
        return {
          icon: <XCircleIcon className="mx-auto h-16 w-16 text-error" />,
          title: t('stripe.status.processCanceled'),
          description: t('stripe.status.processCanceledDesc'),
          buttonText: t('plans.viewPlans'),
          onClick: () => navigate('/dashboard/plans'),
        };
      case 'subscription-cancel':
        return {
          icon: <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-warning" />,
          title: t('stripe.status.subscriptionContinues'),
          description: t('stripe.status.subscriptionContinuesDesc'),
          buttonText: t('dashboard.navigation.backToDashboard'),
          onClick: () => navigate('/dashboard/'),
        };
      case 'subscription-cancel-success':
        return {
          icon: <CheckCircleIcon className="mx-auto h-16 w-16 text-success" />,
          title: t('stripe.status.cancellationConfirmed'),
          description: t('stripe.status.cancellationConfirmedDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing'),
        };
      case 'payment-method-update-cancel':
        return {
          icon: <XCircleIcon className="mx-auto h-16 w-16 text-error" />,
          title: t('stripe.status.paymentUpdateCanceled'),
          description: t('stripe.status.paymentUpdateCanceledDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing'),
        };
      case 'payment-method-update-success':
        return {
          icon: <CheckCircleIcon className="mx-auto h-16 w-16 text-success" />,
          title: t('stripe.status.paymentUpdated'),
          description: t('stripe.status.paymentUpdatedDesc'),
          buttonText: t('dashboard.navigation.backToSettings'),
          onClick: () => navigate('/dashboard/settings#billing'),
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-warning" />,
          title: t('errors.unknownState'),
          description: t('errors.contactSupport'),
          buttonText: t('dashboard.navigation.backToDashboard'),
          onClick: () => navigate('/dashboard'),
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  const { icon, title, description, buttonText, onClick } = getStateDetails();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-xl">
        {icon}
        <h2 className="mb-4 mt-6 text-2xl font-bold text-foreground">{title}</h2>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <Button variant="primary" onClick={onClick} className="w-full">
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default StripeCallbackPage;
