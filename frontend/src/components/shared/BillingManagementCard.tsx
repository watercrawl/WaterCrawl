import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCardIcon,
  XMarkIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import { useTeam } from '../../contexts/TeamContext';
import { subscriptionApi } from '../../services/api/subscription';
import toast from 'react-hot-toast';

export const BillingManagementCard: React.FC = () => {
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
      year: 'numeric'
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
      toast.error('Failed to cancel subscription');
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (confirmationText.trim() !== currentTeam?.name) {
      toast.error('Team name does not match');
      return;
    }

    try {
      setIsLoading(true);
      const data = await subscriptionApi.cancelSubscription(true);
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.success('Subscription deleted successfully');
        refreshCurrentSubscription();
      }
    } catch (error) {
      toast.error('Failed to delete subscription');
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
      toast.success('Subscription renewed successfully');
      refreshCurrentSubscription();
      setIsRenewModalOpen(false);
    } catch (error) {
      toast.error('Failed to renew subscription');
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
      toast.error('Failed to manage subscription');
      console.error(error);
    }
  };


  if (!currentSubscription) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              No Active Subscription
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Explore our plans to get started
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/plans')}
        >
          Choose a Plan
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CreditCardIcon className="h-8 w-8 text-primary-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentSubscription.plan_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentSubscription.is_default ? 'Free Plan' : 'Paid Plan'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-col">
              {currentSubscription.is_default ? (
                <button
                  onClick={() => navigate('/dashboard/plans')}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center border border-primary-600 dark:border-primary-400 px-2 py-1 rounded-md"
                >
                  Upgrade Plan
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    {currentSubscription.cancel_at ? ( 
                      <>
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Cancels on {formatDate(currentSubscription.cancel_at)}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Active
                        </span>
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
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Billing Details
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next billing: {currentSubscription.cancel_at ? 'Canceled' : formatDate(currentSubscription.current_period_end_at)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleManageSubscription}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-md"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Manage Subscription
                </button>
                {!currentSubscription.cancel_at ?(
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center border border-red-300 dark:border-red-600 px-2 py-1 rounded-md disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel Next Billing
                  </button>
                ): (
                  <button
                    onClick={() => setIsRenewModalOpen(true)}
                    className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center border border-green-300 dark:border-green-600 px-2 py-1 rounded-md"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Renew
                  </button>
                )}

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center border border-red-300 dark:border-red-600 px-2 py-1 rounded-md"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Cancel Subscription
              </h2>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to cancel your subscription?
              Your current plan will remain active until {formatDate(currentSubscription.current_period_end_at)}.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Subscription Confirmation Modal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Renew Subscription
              </h2>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to renew your subscription?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRenewSubscription}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Renewing...' : 'Renew Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subscription Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Delete Subscription
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will immediately cancel and delete your subscription.
              <br />
              You will lose your current plan credits and page credits. This action is not undoable.
              <br />
              <br />
              To confirm, type the team name <strong>{currentTeam?.name}</strong> below:
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${currentTeam?.name}" to confirm`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubscription}
                disabled={confirmationText.trim() !== currentTeam?.name || isLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
