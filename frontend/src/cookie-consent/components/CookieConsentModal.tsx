'use client';

import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import { Cookie, X, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Switch from './Switch';

interface CookieConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps & { gtag?: string }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isConsentGiven, updateConsent, privacyUrl, categories } = useCookieConsent();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Pre-select non-essential categories that are not essential
    const defaultSelectedCategories = categories.filter(cat => !cat.essential).map(cat => cat.id);

    setSelectedCategories(defaultSelectedCategories);
  }, [categories]);

  if (!isClient || isConsentGiven || !isOpen) return null;

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(cat => cat !== categoryId) : [...prev, categoryId]
    );
  };

  const handleAcceptAll = () => {
    const allNonEssentialCategories = categories.filter(cat => !cat.essential).map(cat => cat.id);
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6 text-foreground shadow-xl">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 text-muted-foreground transition-colors hover:text-black"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-4 flex items-center text-2xl font-bold text-foreground">
          <Cookie className="me-3 h-8 w-8 text-primary" />
          {t('cookieConsent.modal.title')}
        </h2>

        <p className="mb-4 text-muted-foreground">{t('cookieConsent.modal.description')}</p>

        {categories.map(category => (
          <div
            key={category.id}
            className={`relative mb-4 rounded-lg border border-border bg-muted p-3 hover:bg-muted ${category.essential ? 'opacity-60' : ''} transition-colors`}
          >
            {!category.essential && (
              <div className="absolute end-3 top-4">
                <Switch
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <h3 className="me-2 font-semibold text-foreground">{category.name}</h3>
                  {category.essential && (
                    <span className="text-xs font-semibold text-success">
                      {t('cookieConsent.modal.alwaysActive')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handlePrivacyPolicyNavigation}
              className="w-full text-center text-sm text-primary hover:text-primary-dark hover:underline"
            >
              {t('cookieConsent.modal.privacyPolicyLink')}
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="order-last sm:order-first">
              <button
                onClick={handleSavePreferences}
                className="flex w-full items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
              >
                <Settings className="me-2 h-4 w-4" />
                {t('cookieConsent.modal.savePreferences')}
              </button>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={handleReject}
                className="flex w-full items-center justify-center whitespace-nowrap rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
              >
                <XCircle className="me-2 h-4 w-4" />
                {t('cookieConsent.modal.reject')}
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex w-full items-center justify-center whitespace-nowrap rounded-md bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success sm:w-auto"
              >
                <CheckCircle className="me-2 h-4 w-4" />
                {t('cookieConsent.modal.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;
