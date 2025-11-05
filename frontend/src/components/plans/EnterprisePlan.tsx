import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CheckIcon } from '@heroicons/react/24/outline';

export const EnterprisePlan: React.FC = () => {
  const { t } = useTranslation();

  const ENTERPRISE_FEATURES = [
    t('plans.enterprise.unlimitedTeamMembers'),
    t('plans.enterprise.unlimitedPagesCredit'),
    t('plans.enterprise.customCrawlingRules'),
    t('plans.enterprise.prioritySupport'),
    t('plans.enterprise.customIntegrations'),
    t('plans.enterprise.dedicatedAccountManager'),
  ] as const;
  return (
    <div className="mx-auto mt-12 max-w-5xl rounded-2xl ring-1 ring-border lg:mx-0 lg:flex lg:max-w-none">
      <div className="p-6 sm:p-8 lg:flex-auto">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          {t('plans.enterprise.title')}
        </h3>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {t('plans.enterprise.description')}
        </p>
        <div className="mt-6 flex items-center gap-x-4">
          <h4 className="flex-none text-sm font-semibold leading-6 text-primary">
            {t('plans.enterprise.whatsIncluded')}
          </h4>
          <div className="h-px flex-auto bg-muted" />
        </div>
        <ul
          role="list"
          className="mt-4 grid grid-cols-1 gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2"
        >
          {ENTERPRISE_FEATURES.map(feature => (
            <li key={feature} className="flex items-center gap-x-2">
              <CheckIcon className="h-5 w-4 flex-none text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-2 lg:mt-0 lg:flex lg:w-full lg:max-w-md lg:flex-shrink-0 lg:items-center">
        <div className="h-full w-full rounded-xl bg-muted py-8 text-center ring-1 ring-inset ring-border/10 lg:flex lg:flex-col lg:justify-center lg:py-12">
          <div className="mx-auto max-w-xs px-8">
            <p className="text-base font-semibold text-muted-foreground">
              {t('plans.enterprise.customPricing')}
            </p>
            <p className="mt-4 flex items-baseline justify-center gap-x-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {t('plans.enterprise.contactUs')}
              </span>
            </p>
            <Link
              to="mailto:enterprise@watercrawl.dev"
              className="mt-8 block w-full rounded-md bg-primary-hover px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('plans.enterprise.getInTouch')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
