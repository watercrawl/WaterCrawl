import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import KnowledgeBaseQueryForm from '../../../components/knowledge/KnowledgeBaseQueryForm';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';

const KnowledgeBaseQueryPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: 'Query', href: `/dashboard/knowledge-base/${knowledgeBaseId}/query`, current: true },
    ]);
  }, [knowledgeBase, setItems, knowledgeBaseId]);



  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Knowledge Base Playground</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Test and experiment with your knowledge base in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <KnowledgeBaseQueryForm
          knowledgeBaseId={knowledgeBaseId!}
        />

      </div>
    </div>
  );
};

export default KnowledgeBaseQueryPage;
