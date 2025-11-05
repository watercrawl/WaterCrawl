import React, { useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  CreditCardIcon,
  XMarkIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { ChevronRight } from '../../components/shared/DirectionalIcon';
import { useTeam } from '../../contexts/TeamContext';
import { subscriptionApi } from '../../services/api/subscription';

import { Button } from './Button';

export const BillingManagementCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentSubscription, refreshCurrentSubscription, currentTeam } = useTeam();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Helper function for formatting dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const data = await subscriptionApi.cancelSubscription();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
      refreshCurrentSubscription();
    } catch (error) {
      toast.error(t('billing.errors.cancelFailed'));
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (confirmationText.trim() !== currentTeam?.name) {
      toast.error(t('billing.errors.teamNameMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      const data = await subscriptionApi.cancelSubscription(true);
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.success(t('billing.success.deleted'));
        refreshCurrentSubscription();
      }
    } catch (error) {
      toast.error(t('billing.errors.deleteFailed'));
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setConfirmationText('');
    }
  };

  const handleRenewSubscription = async () => {
    try {
      setIsLoading(true);
      await subscriptionApi.renewSubscription();
      toast.success(t('billing.success.renewed'));
      refreshCurrentSubscription();
      setIsRenewModalOpen(false);
    } catch (error) {
      toast.error(t('billing.errors.renewFailed'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const data = await subscriptionApi.manageSubscription();
      window.location.href = data.redirect_url;
    } catch (error) {
      toast.error(t('billing.errors.manageFailed'));
      console.error(error);
    }
  };

  if (!currentSubscription) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-card p-6 shadow-md">
        <div className="flex items-center gap-x-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-warning" />
          <div>
            <p className="text-lg font-semibold text-foreground">
              {t('billing.noSubscription.title')}
            </p>
            <p className="text-sm text-muted-foreground">{t('billing.noSubscription.message')}</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate('/dashboard/plans')}>
          {t('billing.choosePlan')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-card shadow-md">
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-4">
              <CreditCardIcon className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {currentSubscription.plan_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.is_default ? t('billing.freePlan') : t('billing.paidPlan')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-x-2">
              {currentSubscription.is_default ? (
                <button
                  onClick={() => navigate('/dashboard/plans')}
                  className="flex items-center rounded-md border border-primary-strong px-2 py-1 text-sm text-primary hover:text-primary-strong"
                >
                  {t('billing.upgradePlan')}
                  <ChevronRight className="ms-1 h-4 w-4" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-x-2">
                    {currentSubscription.cancel_at ? (
                      <>
                        <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
                        <span className="text-sm text-muted-foreground">
                          {t('billing.cancelsOn', {
                            date: formatDate(currentSubscription.cancel_at),
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-success" />
                        <span className="text-sm text-muted-foreground">{t('billing.active')}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!currentSubscription.is_default && (
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('billing.details.title')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('billing.details.nextBilling')}:{' '}
                  {currentSubscription.cancel_at
                    ? t('billing.canceled')
                    : formatDate(currentSubscription.current_period_end_at)}
                </p>
              </div>
              <div className="flex gap-x-2">
                <button
                  onClick={handleManageSubscription}
                  className="flex items-center rounded-md border border-input-border px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <PencilIcon className="me-1 h-4 w-4" />
                  {t('billing.manage')}
                </button>
                {!currentSubscription.cancel_at ? (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="flex items-center rounded-md border border-error px-2 py-1 text-sm text-error hover:text-error disabled:opacity-50"
                  >
                    <XMarkIcon className="me-1 h-4 w-4" />
                    {t('billing.cancelNextBilling')}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRenewModalOpen(true)}
                    className="flex items-center rounded-md border border-success px-2 py-1 text-sm text-success hover:text-success-strong"
                  >
                    <ArrowPathIcon className="me-1 h-4 w-4" />
                    {t('billing.renew')}
                  </button>
                )}

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center rounded-md border border-error px-2 py-1 text-sm text-error hover:text-error"
                >
                  <TrashIcon className="me-1 h-4 w-4" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-error">
                {t('billing.modal.cancel.title')}
              </h2>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('billing.modal.cancel.message', {
                date: formatDate(currentSubscription.current_period_end_at),
              })}
            </p>
            <div className="flex justify-end gap-x-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                {t('billing.modal.cancel.keep')}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="rounded-md bg-error px-4 py-2 text-sm text-white hover:bg-error-strong disabled:opacity-50"
              >
                {isLoading
                  ? t('billing.modal.cancel.canceling')
                  : t('billing.modal.cancel.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Subscription Confirmation Modal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-success">
                {t('billing.modal.renew.title')}
              </h2>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t('billing.modal.renew.message')}</p>
            <div className="flex justify-end gap-x-2">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRenewSubscription}
                disabled={isLoading}
                className="rounded-md bg-success px-4 py-2 text-sm text-white hover:bg-success-strong disabled:opacity-50"
              >
                {isLoading ? t('billing.modal.renew.renewing') : t('billing.modal.renew.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subscription Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-error">
                {t('billing.modal.delete.title')}
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('billing.modal.delete.message')}
              <br />
              {t('billing.modal.delete.warning')}
              <br />
              <br />
              {t('billing.modal.delete.confirmPrompt', { teamName: currentTeam?.name })}
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value)}
              placeholder={t('billing.modal.delete.placeholder', { teamName: currentTeam?.name })}
              className="mb-4 w-full rounded-md border border-input-border px-3 py-2"
            />
            <div className="flex justify-end gap-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteSubscription}
                disabled={confirmationText.trim() !== currentTeam?.name || isLoading}
                className="rounded-md bg-error px-4 py-2 text-sm text-white hover:bg-error-strong disabled:opacity-50"
              >
                {isLoading ? t('billing.modal.delete.deleting') : t('billing.modal.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
