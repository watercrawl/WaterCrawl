import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  ChatBubbleLeftRightIcon, 
  PencilIcon,
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import AgentChatInterface from '../../components/agent/AgentChatInterface';
import ChatMessage from '../../components/chat/ChatMessage';
import Loading from '../../components/shared/Loading';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../hooks';
import { agentApi } from '../../services/api/agent';
import { conversationApi } from '../../services/api/conversation';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

import type { Agent, AgentVersion } from '../../types/agent';
import type { Conversation, MessageBlock } from '../../types/conversation';

const AgentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const { agentId } = useParams<{ agentId: string }>();
  const dateLocale = useDateLocale();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<AgentVersion | null>(null);

  useEffect(() => {
    if (agentId) {
      fetchAgent();
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Fetch published version when agent is loaded and published
  useEffect(() => {
    const fetchPublishedVersion = async () => {
      if (agent && agent.status === 'published') {
        try {
          const version = await agentApi.getPublishedVersion(agent.uuid);
          setPublishedVersion(version);
        } catch (error) {
          console.error('Error fetching published version:', error);
        }
      }
    };
    fetchPublishedVersion();
  }, [agent]);

  useEffect(() => {
    if (agent) {
      setItems([
        { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
        { label: t('dashboard.navigation.agents'), href: '/dashboard/agents' },
        { label: agent.name, current: true },
      ]);
    }
  }, [agent, setItems, t]);

  const fetchAgent = async () => {
    if (!agentId) return;
    
    setLoading(true);
    try {
      const agentData = await agentApi.get(agentId);
      setAgent(agentData);
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
      navigate('/dashboard/agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = useCallback(async () => {
    if (!agentId) return;
    
    setLoadingConversations(true);
    try {
      const response = await conversationApi.list(agentId, 1, 50);
      // Sort by created_at descending (most recent first)
      const sorted = [...response.results].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setConversations(sorted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoadingConversations(false);
    }
  }, [agentId, t]);

  const fetchMessageBlocks = useCallback(async (conversationUuid: string) => {
    setLoadingMessages(true);
    try {
      const response = await conversationApi.getMessageBlocks(conversationUuid, 1, 100);
      setMessageBlocks(response.results);
    } catch (error) {
      console.error('Error fetching message blocks:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoadingMessages(false);
    }
  }, [t]);

  const handleConversationSelect = async (conversation: Conversation | null) => {
    setSelectedConversation(conversation);
    if (conversation) {
      await fetchMessageBlocks(conversation.uuid);
    } else {
      setMessageBlocks([]);
    }
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setMessageBlocks([]);
  };

  const handleConversationCreated = useCallback(async (conversationId: string, title?: string) => {
    try {
      // Fetch the full conversation details
      const conversation = await conversationApi.get(conversationId);
      // Add to the top of the conversations list
      setConversations((prev) => {
        // Check if conversation already exists
        if (prev.some(conv => conv.uuid === conversationId)) {
          // Update existing conversation
          return prev.map(conv => 
            conv.uuid === conversationId ? conversation : conv
          );
        }
        // Add new conversation at the beginning (most recent first)
        return [conversation, ...prev];
      });
    } catch (error) {
      console.error('Error fetching new conversation:', error);
      // If fetching fails, still add a basic entry
      const newConversation: Conversation = {
        uuid: conversationId,
        title: title || undefined,
        user_identifier: undefined,
        agent: agent?.uuid || '',
        agent_version: '', // Will be updated when conversation is fetched
        inputs: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => {
        if (prev.some(conv => conv.uuid === conversationId)) {
          return prev;
        }
        // Add new conversation at the beginning (most recent first)
        return [newConversation, ...prev];
      });
    }
  }, [agent]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user_identifier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  if (!agent) {
    return null;
  }

  const isPublished = agent.status === 'published';

  return (
    <div className="flex h-[calc(100vh-128px)] bg-background overflow-hidden">
      {/* Left Sidebar - Conversation History */}
      <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0 h-full">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-foreground truncate">
              {agent.name}
            </h2>
          </div>
          <div className="mb-3">
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                agent.status === 'published'
                  ? 'bg-success-soft text-success'
                  : 'bg-warning-soft text-warning'
              }`}
            >
              {t(`agents.status.${agent.status}`)}
            </span>
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full inline-flex items-center justify-center gap-x-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t('agents.testBench.newChat')}
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5">
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border border-input bg-background py-1 ps-8 pe-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t('agents.detail.searchConversations')}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center p-8">
              <Loading />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.uuid === conversation.uuid;
                return (
                  <button
                    key={conversation.uuid}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`w-full text-left px-3 py-2 hover:bg-muted/30 transition-colors ${
                      isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <ChatBubbleLeftRightIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}>
                          {conversation.title || t('agents.detail.untitledConversation')}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {conversation.user_identifier && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {conversation.user_identifier}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {conversation.user_identifier && '• '}
                            {formatDistanceToNowLocalized(new Date(conversation.created_at), dateLocale, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center">
              <div className="max-w-xs">
                <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery
                    ? t('agents.detail.noConversationsFound')
                    : t('agents.detail.noConversations')
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-3 flex-shrink-0 space-y-1.5">
          <button
            onClick={() => navigate(`/dashboard/agents/${agentId}/edit`)}
            className="w-full inline-flex items-center justify-center gap-x-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            {t('agents.detail.editAgent')}
          </button>
          <button
            onClick={() => setShowIntegrations(true)}
            className="w-full inline-flex items-center justify-center gap-x-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            {t('agents.detail.integrations')}
          </button>
        </div>
      </div>

      {/* Right Content Area - Selected Conversation or New Chat */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {selectedConversation ? (
          // View Selected Conversation
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedConversation.title || t('agents.detail.untitledConversation')}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedConversation.user_identifier && (
                      <span className="mr-3">{selectedConversation.user_identifier}</span>
                    )}
                    {new Date(selectedConversation.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-x-2 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  {t('agents.testBench.newChat')}
                </button>
              </div>
            </div>

            {/* Message Blocks */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loading />
                </div>
              ) : messageBlocks.length > 0 ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {messageBlocks.map((block) => (
                    <ChatMessage key={block.uuid} messageBlock={block} />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="max-w-md">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t('agents.detail.noMessages')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // New Chat Interface
          <AgentChatInterface 
            agent={agent} 
            isPublished={isPublished}
            onConversationCreated={handleConversationCreated}
            jsonOutput={publishedVersion?.json_output}
            jsonSchema={publishedVersion?.json_schema}
          />
        )}
      </div>

      {/* Integrations Modal/Drawer */}
      {showIntegrations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowIntegrations(false)}>
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t('agents.detail.integrations')}
              </h3>
              <button
                onClick={() => setShowIntegrations(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            <div className="text-center py-8">
              <Cog6ToothIcon className="mx-auto h-16 w-16 text-muted-foreground" />
              <h4 className="mt-4 text-base font-semibold text-foreground">
                {t('agents.detail.integrationsComingSoon')}
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('agents.detail.integrationsDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetailPage;
