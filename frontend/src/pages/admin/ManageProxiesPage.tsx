import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import proxyApi from '../../services/api/proxy';
import { Proxy, CreateProxyRequest, TestProxyRequest } from '../../types/proxy';
import toast from 'react-hot-toast';
import ProxyList from '../../components/settings/ProxyList';
import ProxyForm from '../../components/settings/ProxyForm';
import useIsTabletOrMobile from '../../hooks/useIsTabletOrMobile';
import { PaginatedResponse } from '../../types/common';
import Button from '../../components/shared/Button';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const ManageProxiesPage: React.FC = () => {
  const [response, setResponse] = useState<PaginatedResponse<Proxy>>({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Admin', href: '/admin' },
      { label: 'Manage Proxies', href: '/admin/proxies', current: true },
    ]);
  }, [setItems]);

  const isTabletOrMobile = useIsTabletOrMobile();

  // Function to fetch proxies
  const fetchProxies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await proxyApi.list(currentPage);
      setResponse(response);
    } catch (error) {
      console.error('Error fetching proxies:', error);
      toast.error('Failed to fetch proxy servers');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  // Function to create a new proxy
  const handleCreateProxy = async (data: CreateProxyRequest) => {
    try {
      await proxyApi.create(data);
      toast.success('Proxy server created successfully');
      fetchProxies();
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error creating proxy:', error);
      return Promise.reject(error);
    }
  };

  // Function to update a proxy
  const handleUpdateProxy = async (data: CreateProxyRequest) => {
    if (!editingProxy) return Promise.reject(new Error('No proxy selected for editing'));

    try {
      await proxyApi.update(editingProxy.slug, data);
      toast.success('Proxy server updated successfully');
      fetchProxies();
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error updating proxy:', error);
      return Promise.reject(error);
    }
  };

  const handleTestProxy = async (data: TestProxyRequest) => {
    if (editingProxy) {
      data.slug = editingProxy.slug;
    } else {
      delete data.slug;
    }
    await proxyApi.testProxy(data);
  };

  // Function to delete a proxy
  const handleDeleteProxy = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this proxy server?')) {
      try {
        setDeletingSlug(slug);
        await proxyApi.delete(slug);
        toast.success('Proxy server deleted successfully');
        fetchProxies();
      } catch (error) {
        console.error('Error deleting proxy:', error);
        toast.error('Failed to delete proxy server');
      } finally {
        setDeletingSlug(null);
      }
    }
  };

  // Function to open the edit modal
  const handleEditProxy = (proxy: Proxy) => {
    setEditingProxy(proxy);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProxy(null);
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Proxy Servers</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your proxy servers for web crawling.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => {
              setEditingProxy(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add Proxy
          </Button>
        </div>
      </div>

      <ProxyList
        proxies={response.results}
        currentPage={currentPage}
        totalItems={response.count}
        hasNext={response.next !== null}
        hasPrevious={response.previous !== null}
        loading={loading}
        deletingSlug={deletingSlug}
        isTabletOrMobile={isTabletOrMobile}
        onPageChange={setCurrentPage}
        onEdit={handleEditProxy}
        onDelete={handleDeleteProxy}
      />

      <ProxyForm
        isOpen={isModalOpen}
        initialData={editingProxy || undefined}
        onClose={handleCloseModal}
        onSubmit={editingProxy ? handleUpdateProxy : handleCreateProxy}
        onTest={handleTestProxy}
      />
    </div>
  );
};

export default ManageProxiesPage;
