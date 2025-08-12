import React from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon, CreditCardIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '../shared/Card';
import { useSettings } from '../../contexts/SettingsProvider';

interface KnowledgeBasePricingInfoProps {
  isEmbeddingEnabled: boolean;
  isEnhancementEnabled: boolean;
  embeddingProviderType?: 'watercrawl' | 'external';
  summarizationProviderType?: 'watercrawl' | 'external';
  rateLimit?: string;
  numberOfDocumentsLimit?: number;
  className?: string;
}

export const KnowledgeBasePricingInfo: React.FC<KnowledgeBasePricingInfoProps> = ({
  isEmbeddingEnabled,
  isEnhancementEnabled,
  embeddingProviderType = 'watercrawl',
  summarizationProviderType = 'watercrawl',
  rateLimit,
  numberOfDocumentsLimit,
  className = ''
}) => {
  const hasWaterCrawlCharges =
    (isEmbeddingEnabled && embeddingProviderType === 'watercrawl') ||
    (isEnhancementEnabled && summarizationProviderType === 'watercrawl');

  const embeddingCost = isEmbeddingEnabled && embeddingProviderType === 'watercrawl' ? 1 : 0;
  const summarizationCost = isEnhancementEnabled && summarizationProviderType === 'watercrawl' ? 1 : 0;
  const totalCostPerDocument = embeddingCost + summarizationCost;
  const { settings } = useSettings();

  if (!settings || !settings.is_enterprise_mode_active) return null;

  return (
    <Card className={`border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 ${className}`}>
      <Card.Title
        className="text-blue-900 dark:text-blue-100"
        icon={<InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      >
        Pricing & Usage Information
      </Card.Title>

      <Card.Body>
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCardIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Cost Per Document</h4>
            </div>

            {hasWaterCrawlCharges ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Your configuration:</span>
                  <span className="font-semibold text-lg text-primary-600 dark:text-primary-400">
                    {totalCostPerDocument} {totalCostPerDocument === 1 ? 'credit' : 'credits'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  {embeddingCost > 0 && (
                    <div className="flex justify-between">
                      <span>• Embedding (WaterCrawl provider):</span>
                      <span>1 credit</span>
                    </div>
                  )}
                  {summarizationCost > 0 && (
                    <div className="flex justify-between">
                      <span>• Summarization (WaterCrawl provider):</span>
                      <span>1 credit</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start text-sm flex-col border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-xs pt-2">
                    <strong>Note:</strong> You can add your own provider configurations in the settings page. and use you own api keys for embedding and summarization.
                  </p>
                  <Link
                    to="/dashboard/settings#provider-config"
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 underline text-xs"
                  >
                    Manage your provider configurations →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Your configuration:</span>
                  <span className="font-semibold text-lg text-green-600 dark:text-green-400">Free</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  No charges when using your own API keys for enabled features.
                </p>

              </div>
            )}
          </div>

          {/* Rate Limit Information */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2 mb-3">
              <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Your Plan's Limits</h4>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Document Limit:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {numberOfDocumentsLimit === undefined ? 'Loading...' : numberOfDocumentsLimit === -1 ? 'Unlimited' : `${numberOfDocumentsLimit} documents`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Retrieval Rate Limit:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {rateLimit === undefined ? 'Loading...' : rateLimit === null ? 'Unlimited' : rateLimit}
                </span>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950/50 rounded text-xs text-green-700 dark:text-green-300">
                <strong>🎉 Limited Time:</strong> Retrievals are currently free with no hard limits.
                Only rate limiting applies to prevent abuse.
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/50">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                  Pricing Policy
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                  This pricing model is current as of today and may change in the future.
                  We will notify all users before implementing any pricing changes.
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
