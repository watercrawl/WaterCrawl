import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { Button } from '../../../components/shared/Button';
import { ArrowUpOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';

const BatchUrlImportPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [urls, setUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
      return;
    }

    knowledgeBaseApi.get(knowledgeBaseId).then(kb => {
      setItems([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
        { label: kb.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
        { label: 'Import from URLs', current: true },
      ]);
    }).catch(() => {
      toast.error('Failed to load knowledge base details.');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, setItems]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error('Please upload a .txt file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUrls(content);
      toast.success(`Loaded ${content.split('\n').filter(Boolean).length} URLs from ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!knowledgeBaseId) return;

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);

    if (urlList.length === 0) {
      toast.error('Please enter at least one URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await knowledgeBaseApi.importFromUrls(knowledgeBaseId, { urls: urlList });
      toast.success(`${urlList.length} URLs have been queued for import.`);
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      toast.error('Failed to start import process. Please try again.');
      console.error('Failed to import URLs:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlCount = urls.split('\n').filter(Boolean).length;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Import URLs</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Paste URLs directly (one per line) or upload a .txt file.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="urls-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            URLs (one per line)
          </label>
          <textarea
            id="urls-textarea"
            rows={15}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="block w-full shadow-sm sm:text-sm rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://example.com/page1\nhttps://example.com/page2"
          />
        </div>

        <div className="flex items-center gap-4">
            <Button 
                type="submit"
                disabled={isSubmitting || urlCount === 0}
                loading={isSubmitting}
                variant="primary"
            >
                <LinkIcon className="h-5 w-5" />
                <span>{`Import ${urlCount} URL${urlCount === 1 ? '' : 's'}`}</span>
            </Button>
            <Button 
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
            >
                <ArrowUpOnSquareIcon className="h-5 w-5" />
                <span>Upload .txt File</span>
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
            />
        </div>
      </form>
    </div>
  );
};

export default BatchUrlImportPage;
