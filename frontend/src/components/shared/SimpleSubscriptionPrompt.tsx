import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ArrowRight } from '../../components/shared/DirectionalIcon';

export const SimpleSubscriptionPrompt: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-lg bg-card shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-soft to-primary-soft opacity-50" />

      <div className="relative p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h3 className="text-xl font-bold text-foreground">{t('subscription.prompt.title')}</h3>

          <p className="text-muted-foreground">{t('subscription.prompt.description')}</p>

          <Link
            to="/dashboard/plans"
            className="group inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary px-6 py-3 text-base font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-primary-hover hover:to-primary-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('subscription.prompt.viewPlans')}
            <ArrowRight className="-me-1 ms-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
