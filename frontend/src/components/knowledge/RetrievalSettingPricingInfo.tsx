import React from 'react';

import { useTranslation } from 'react-i18next';

import { InformationCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';

import Card from '../shared/Card';

import { useSettings } from '../../contexts/SettingsProvider';
import { RetrievalType } from '../../types/knowledge';

interface RetrievalSettingPricingInfoProps {
  retrievalType: RetrievalType;
  rerankerEnabled: boolean;
  embeddingProviderType?: 'watercrawl' | 'external';
  rerankerProviderType?: 'watercrawl' | 'external';
  className?: string;
}

export const RetrievalSettingPricingInfo: React.FC<RetrievalSettingPricingInfoProps> = ({
  retrievalType,
  rerankerEnabled,
  embeddingProviderType = 'watercrawl',
  rerankerProviderType = 'watercrawl',
  className = '',
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Calculate costs based on configuration
  const usesVectorOrHybrid =
    retrievalType === RetrievalType.VectorSearch || retrievalType === RetrievalType.HybridSearch;
  
  const vectorCost = usesVectorOrHybrid && embeddingProviderType === 'watercrawl' ? 1 : 0;
  const rerankerCost = rerankerEnabled && rerankerProviderType === 'watercrawl' ? 1 : 0;
  const totalCostPerRetrieval = vectorCost + rerankerCost;

  const hasWaterCrawlCharges = totalCostPerRetrieval > 0;

  if (!settings || !settings.is_enterprise_mode_active) return null;

  return (
    <Card className={`border-primary bg-primary-soft ${className}`}>
      <Card.Title
        className="text-primary-strong"
        icon={<InformationCircleIcon className="h-5 w-5 text-primary" />}
      >
        {t('settings.knowledgeBase.retrievalSettings.pricing.title')}
      </Card.Title>

      <Card.Body>
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-x-2">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">
                {t('settings.knowledgeBase.retrievalSettings.pricing.costPerRetrieval')}
              </h4>
            </div>

            {hasWaterCrawlCharges ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('settings.knowledgeBase.retrievalSettings.pricing.yourConfiguration')}:
                  </span>
                  <span className="text-lg font-semibold text-primary">
                    {totalCostPerRetrieval}{' '}
                    {totalCostPerRetrieval === 1
                      ? t('settings.knowledgeBase.retrievalSettings.pricing.credit')
                      : t('settings.knowledgeBase.retrievalSettings.pricing.credits')}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {vectorCost > 0 && (
                    <div className="flex justify-between">
                      <span>• {t('settings.knowledgeBase.retrievalSettings.pricing.vectorSearchWC')}:</span>
                      <span>1 {t('settings.knowledgeBase.retrievalSettings.pricing.credit')}</span>
                    </div>
                  )}
                  {rerankerCost > 0 && (
                    <div className="flex justify-between">
                      <span>• {t('settings.knowledgeBase.retrievalSettings.pricing.rerankerWC')}:</span>
                      <span>1 {t('settings.knowledgeBase.retrievalSettings.pricing.credit')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t('settings.knowledgeBase.retrievalSettings.pricing.yourConfiguration')}:
                  </span>
                  <span className="text-lg font-semibold text-success">
                    {t('settings.knowledgeBase.retrievalSettings.pricing.free')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('settings.knowledgeBase.retrievalSettings.pricing.noCharges')}
                </p>
              </div>
            )}
          </div>

          {/* Note about retrievals being free */}
          <div className="rounded bg-success-soft p-3 text-xs text-success-strong">
            <strong>🎉 {t('settings.knowledgeBase.retrievalSettings.pricing.limitedTime')}:</strong>{' '}
            {t('settings.knowledgeBase.retrievalSettings.pricing.retrievalsFree')}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RetrievalSettingPricingInfo;
