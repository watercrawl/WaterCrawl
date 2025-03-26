import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { authApi } from '../services/api/auth';
import { Button } from '../components/shared/Button';
import toast from 'react-hot-toast';

interface EmailVerificationPopupProps {
    email: string;
    onClose: () => void;
}

export const EmailVerificationPopup: React.FC<EmailVerificationPopupProps> = ({ email, onClose }) => {
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    const handleResendVerification = async () => {
        try {
            setIsResending(true);
            setResendMessage(null);
            await authApi.resendVerificationEmail(email);
            // setResendMessage('Verification email has been resent. Please check your inbox.');
            toast.success('Verification email has been resent. Please check your inbox.');
            onClose();
        } catch (_error) {
            setResendMessage('Failed to resend verification email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Email Verification Required</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Your email is not activated. Please check your inbox and verify your email address.
                    </p>

                    <Button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        loading={isResending}
                        fullWidth
                        className="mb-4"
                    >
                        Resend Verification Email
                    </Button>

                    {resendMessage && (
                        <p className={`text-sm ${resendMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                            {resendMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
