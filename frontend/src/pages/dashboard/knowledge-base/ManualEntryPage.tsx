import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { AxiosError } from 'axios';

const ManualEntryPage: React.FC = () => {
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
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: 'Manual Entry', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems]);

  const handleManualSubmit = async () => {
    if (!manualTitle) {
      toast.error('Please enter a title');
      return;
    }
    if (!manualContent) {
      toast.error('Please enter content');
      return;
    }
    
    if (!knowledgeBaseId) {
      toast.error('Missing knowledge base ID');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use the createDocument API to add the manual content
      await knowledgeBaseApi.createDocument(knowledgeBaseId, {
        title: manualTitle,
        content: manualContent
      });
      toast.success('Content added to knowledge base');
      
      // Navigate back to knowledge base detail page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        console.error('Failed to add content:', error);
        toast.error('Failed to add content to knowledge base');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link to={`/dashboard/knowledge-base/${knowledgeBaseId}/import`} className="mr-2 text-primary-600 hover:text-primary-700">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Content Manually
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Create a knowledge base item with custom title and content.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-gray-900 dark:text-gray-100">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white"
              placeholder="Enter a title for this content"
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content (Markdown supported)
            </label>
            <textarea
              id="content"
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white"
              placeholder="# Enter your content here\n\nYou can use **Markdown** to format your text."
            />
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add to Knowledge Base'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryPage;
