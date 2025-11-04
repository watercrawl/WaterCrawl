import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';

import { Link } from 'react-router-dom';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { AxiosError } from 'axios';
import { ArrowLeft } from '../../../components/shared/DirectionalIcon';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/shared/Input';

const ManualEntryPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  // Manual entry states
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setKnowledgeBase(response);
      })
      .catch(() => {
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      {
        label: t('settings.knowledgeBase.import.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`,
      },
      {
        label: t('settings.knowledgeBase.manualEntry.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`,
        current: true,
      },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  const handleManualSubmit = async () => {
    if (!manualTitle) {
      toast.error(t('settings.knowledgeBase.manualEntry.titleRequired'));
      return;
    }
    if (!manualContent) {
      toast.error(t('settings.knowledgeBase.manualEntry.contentRequired'));
      return;
    }

    if (!knowledgeBaseId) {
      toast.error(t('settings.knowledgeBase.manualEntry.missingId'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the createDocument API to add the manual content
      await knowledgeBaseApi.createDocument(knowledgeBaseId, {
        title: manualTitle,
        content: manualContent,
      });
      toast.success(t('settings.knowledgeBase.manualEntry.success'));

      // Navigate back to knowledge base detail page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        console.error('Failed to add content:', error);
        toast.error(t('settings.knowledgeBase.manualEntry.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center">
          <Link
            to={`/dashboard/knowledge-base/${knowledgeBaseId}/import`}
            className="me-2 text-primary hover:text-primary-dark"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            {t('settings.knowledgeBase.manualEntry.pageTitle')}
          </h1>
        </div>
        <p className="mt-2 text-sm text-foreground">
          {t('settings.knowledgeBase.manualEntry.pageSubtitle')}
        </p>
      </div>

      <div className="rounded-lg bg-card p-6 text-foreground shadow">
        <div className="space-y-4">
          <div>
            <Input
              label={t('settings.knowledgeBase.manualEntry.titleLabel')}
              type="text"
              id="title"
              value={manualTitle}
              onChange={e => setManualTitle(e.target.value)}
              placeholder={t('settings.knowledgeBase.manualEntry.titlePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="content" className="mb-1 block text-sm font-medium text-foreground">
              {t('settings.knowledgeBase.manualEntry.contentLabel')}
            </label>
            <textarea
              id="content"
              value={manualContent}
              onChange={e => setManualContent(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-input-border px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              placeholder={t('settings.knowledgeBase.manualEntry.contentPlaceholder')}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="-ms-1 me-2 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('settings.knowledgeBase.manualEntry.adding')}
                </>
              ) : (
                t('settings.knowledgeBase.manualEntry.submit')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryPage;
