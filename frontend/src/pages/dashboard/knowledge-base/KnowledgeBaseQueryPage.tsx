import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import KnowledgeBaseQueryForm from '../../../components/knowledge/KnowledgeBaseQueryForm';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';

const KnowledgeBaseQueryPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

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
        label: t('settings.knowledgeBase.query.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/query`,
        current: true,
      },
    ]);
  }, [knowledgeBase, setItems, knowledgeBaseId, t]);

  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t('settings.knowledgeBase.playground.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.knowledgeBase.playground.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <KnowledgeBaseQueryForm knowledgeBaseId={knowledgeBaseId!} />
      </div>
    </div>
  );
};

export default KnowledgeBaseQueryPage;
