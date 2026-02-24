import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  InformationCircleIcon,
  CreditCardIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import Card from '../shared/Card';

import { useSettings } from '../../contexts/SettingsProvider';
import { RetrievalType } from '../../types/knowledge';

interface KnowledgeBasePricingInfoProps {
  isEmbeddingEnabled: boolean;
  isEnhancementEnabled: boolean;
  embeddingProviderType?: 'watercrawl' | 'external';
  summarizationProviderType?: 'watercrawl' | 'external';
  rateLimit?: string;
  numberOfDocumentsLimit?: number;
  className?: string;
  // Retrieval setting pricing
  retrievalType?: RetrievalType;
  rerankerEnabled?: boolean;
  rerankerProviderType?: 'watercrawl' | 'external';
}

export const KnowledgeBasePricingInfo: React.FC<KnowledgeBasePricingInfoProps> = ({
  isEmbeddingEnabled,
  isEnhancementEnabled,
  embeddingProviderType = 'watercrawl',
  summarizationProviderType = 'watercrawl',
  rateLimit,
  numberOfDocumentsLimit,
  className = '',
  retrievalType,
  rerankerEnabled = false,
  rerankerProviderType = 'external',
}) => {
  const { t } = useTranslation();
  
  // Document costs
  const hasWaterCrawlCharges =
    (isEmbeddingEnabled && embeddingProviderType === 'watercrawl') ||
    (isEnhancementEnabled && summarizationProviderType === 'watercrawl');

  const embeddingCost = isEmbeddingEnabled && embeddingProviderType === 'watercrawl' ? 1 : 0;
  const summarizationCost =
    isEnhancementEnabled && summarizationProviderType === 'watercrawl' ? 1 : 0;
  const totalCostPerDocument = embeddingCost + summarizationCost;
  
  // Retrieval costs
  const usesVectorOrHybrid =
    retrievalType === RetrievalType.VectorSearch || retrievalType === RetrievalType.HybridSearch;
  const vectorCost = usesVectorOrHybrid && embeddingProviderType === 'watercrawl' ? 1 : 0;
  const rerankerCost = rerankerEnabled && rerankerProviderType === 'watercrawl' ? 1 : 0;
  const totalCostPerRetrieval = vectorCost + rerankerCost;
  const hasRetrievalCharges = totalCostPerRetrieval > 0;
  
  const { settings } = useSettings();

  if (!settings || !settings.is_enterprise_mode_active) return null;

  return (
    <Card className={`border-primary bg-primary-soft ${className}`}>
      <Card.Title
        className="text-primary-strong"
        icon={<InformationCircleIcon className="h-5 w-5 text-primary" />}
      >
        {t('knowledgeBase.pricing.title')}
      </Card.Title>

      <Card.Body>
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-x-2">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">
                {t('knowledgeBase.pricing.costPerDocument')}
              </h4>
            </div>

            {hasWaterCrawlCharges ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('knowledgeBase.pricing.yourConfiguration')}:
                  </span>
                  <span className="text-lg font-semibold text-primary">
                    {totalCostPerDocument}{' '}
                    {totalCostPerDocument === 1
                      ? t('knowledgeBase.pricing.credit')
                      : t('knowledgeBase.pricing.credits')}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {embeddingCost > 0 && (
                    <div className="flex justify-between">
                      <span>• {t('knowledgeBase.pricing.embeddingWC')}:</span>
                      <span>1 {t('knowledgeBase.pricing.credit')}</span>
                    </div>
                  )}
                  {summarizationCost > 0 && (
                    <div className="flex justify-between">
                      <span>• {t('knowledgeBase.pricing.summarizationWC')}:</span>
                      <span>1 {t('knowledgeBase.pricing.credit')}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start justify-between border-t border-border text-sm">
                  <p className="pt-2 text-xs text-muted-foreground">
                    <strong>{t('knowledgeBase.pricing.note')}:</strong>{' '}
                    {t('knowledgeBase.pricing.noteText')}
                  </p>
                  <Link
                    to="/dashboard/settings#provider-config"
                    className="text-xs text-success underline hover:text-success-strong"
                  >
                    {t('knowledgeBase.pricing.manageProviders')} →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t('knowledgeBase.pricing.yourConfiguration')}:
                  </span>
                  <span className="text-lg font-semibold text-success">
                    {t('knowledgeBase.pricing.free')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('knowledgeBase.pricing.noCharges')}
                </p>
              </div>
            )}
          </div>

          {/* Retrieval Cost Breakdown */}
          {retrievalType && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-x-2">
                <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">
                  {t('settings.knowledgeBase.retrievalSettings.pricing.costPerRetrieval')}
                </h4>
              </div>

              {hasRetrievalCharges ? (
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
          )}

          {/* Rate Limit Information */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-x-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">
                {t('knowledgeBase.pricing.planLimits')}
              </h4>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('knowledgeBase.pricing.documentLimit')}:
                </span>
                <span className="font-medium text-foreground">
                  {numberOfDocumentsLimit === undefined
                    ? t('common.loading')
                    : numberOfDocumentsLimit === -1
                      ? t('knowledgeBase.pricing.unlimited')
                      : `${numberOfDocumentsLimit} ${t('knowledgeBase.pricing.documents')}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('knowledgeBase.pricing.retrievalRateLimit')}:
                </span>
                <span className="font-medium text-foreground">
                  {rateLimit === undefined
                    ? t('common.loading')
                    : rateLimit === null
                      ? t('knowledgeBase.pricing.unlimited')
                      : rateLimit}
                </span>
              </div>
              <div className="rounded bg-success-soft p-2 text-xs text-success-strong">
                <strong>🎉 {t('knowledgeBase.pricing.limitedTime')}:</strong>{' '}
                {t('knowledgeBase.pricing.retrievalsFree')}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="rounded-lg border border-warning bg-warning-soft p-4">
            <div className="flex items-start gap-x-2">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <div className="text-sm">
                <p className="mb-1 font-medium text-warning-strong">
                  {t('knowledgeBase.pricing.pricingPolicy')}
                </p>
                <p className="text-xs text-warning-strong">
                  {t('knowledgeBase.pricing.pricingPolicyText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KnowledgeBasePricingInfo;
