import React, { useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { Button } from '../components/shared/Button';
import { authApi } from '../services/api/auth';

interface EmailVerificationPopupProps {
  email: string;
  onClose: () => void;
}

export const EmailVerificationPopup: React.FC<EmailVerificationPopupProps> = ({
  email,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendMessage(null);
      await authApi.resendVerificationEmail(email);
      // setResendMessage('Verification email has been resent. Please check your inbox.');
      toast.success(t('auth.verification.resendSuccess'));
      onClose();
    } catch (_error) {
      setResendMessage(t('auth.verification.resendError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('auth.verification.required')}
          </h2>
          <p className="mb-6 text-muted-foreground">{t('auth.verification.message')}</p>

          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            loading={isResending}
            fullWidth
            className="mb-4"
          >
            {t('auth.verification.resendButton')}
          </Button>

          {resendMessage && (
            <p
              className={`text-sm ${resendMessage.includes('Failed') ? 'text-error' : 'text-success'}`}
            >
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
