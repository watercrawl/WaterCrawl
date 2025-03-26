'use client';

import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import { Cookie, X, CheckCircle, XCircle, Settings } from 'lucide-react';

import Switch from './Switch';

interface CookieConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps & { gtag?: string }> = ({
  isOpen,
  onClose
}) => {
  const { isConsentGiven, updateConsent, privacyUrl, categories } = useCookieConsent();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Pre-select non-essential categories that are not essential
    const defaultSelectedCategories = categories
      .filter(cat => !cat.essential)
      .map(cat => cat.id);

    setSelectedCategories(defaultSelectedCategories);
  }, [categories]);

  if (!isClient || isConsentGiven || !isOpen) return null;

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(cat => cat !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAcceptAll = () => {
    const allNonEssentialCategories = categories
      .filter(cat => !cat.essential)
      .map(cat => cat.id);
    updateConsent(allNonEssentialCategories);

    // No need to separately initialize Google Analytics here
    // The context will handle initialization based on selected categories
    onClose();
  };

  const handleSavePreferences = () => {
    updateConsent(selectedCategories);

    // No need to separately initialize Google Analytics here
    // The context will handle initialization based on selected categories
    onClose();
  };

  const handleReject = () => {
    updateConsent([]);
    onClose();
  };

  const handlePrivacyPolicyNavigation = () => {
    window.open(privacyUrl, '_blank');
  };

  return (
    <div
      className='fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-50 p-4'
    >
      <div
        className="w-full max-w-lg rounded-lg shadow-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="
          text-2xl font-bold mb-4 flex items-center
          text-gray-900 dark:text-white
        ">
          <Cookie className="mr-3 w-8 h-8 text-blue-500" />
          Cookie Preferences
        </h2>

        <p className="
          mb-4 
          text-gray-600 dark:text-gray-300
        ">
          We use cookies to enhance your browsing experience, analyze site traffic,
          and personalize content. You can manage your preferences below.
        </p>

        {categories.map((category) => (
          <div
            key={category.id}
            className={`
              mb-4 p-3 rounded-lg relative
              bg-gray-100 hover:bg-gray-200 
              dark:bg-gray-800 dark:hover:bg-gray-700 
              border border-gray-200 dark:border-gray-700
              ${category.essential ? 'opacity-60' : ''}
              transition-colors
            `}
          >
            {!category.essential && (
              <div className="absolute top-4 right-3">
                <Switch
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="
                    font-semibold mr-2
                    text-gray-900 dark:text-white
                  ">
                    {category.name}
                  </h3>
                  {category.essential && (
                    <span className="text-green-600 font-semibold text-xs">
                      Always Active
                    </span>
                  )}
                </div>
                <p className="
                  text-sm 
                  text-gray-600 dark:text-gray-400
                ">
                  {category.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handlePrivacyPolicyNavigation}
              className="
                hover:underline text-center w-full
                text-blue-600 hover:text-blue-700
                dark:text-blue-400 dark:hover:text-blue-300
                text-sm
              "
            >
              Read Our Full Privacy Policy
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="order-last sm:order-first">
              <button
                onClick={handleSavePreferences}
                className="
                  w-full sm:w-auto px-4 py-2 rounded-md flex items-center justify-center
                  bg-blue-500 hover:bg-blue-600 text-white
                  dark:bg-blue-700 dark:hover:bg-blue-600
                  text-sm font-medium transition-colors whitespace-nowrap
                "
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Preferences
              </button>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                onClick={handleReject}
                className="
                  w-full sm:w-auto px-4 py-2 rounded-md flex items-center justify-center
                  bg-gray-200 hover:bg-gray-300 text-gray-700
                  dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
                  text-sm font-medium transition-colors whitespace-nowrap
                "
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </button>
              <button
                onClick={handleAcceptAll}
                className="
                  w-full sm:w-auto px-4 py-2 rounded-md flex items-center justify-center
                  bg-green-500 hover:bg-green-600 text-white
                  dark:bg-green-700 dark:hover:bg-green-600
                  text-sm font-medium transition-colors whitespace-nowrap
                "
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;