import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DirectionProvider } from './contexts/DirectionContext';
import { TeamProvider } from './contexts/TeamContext';
import { UserProvider } from './contexts/UserContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import { TeamScopedComponent } from './components/shared/TeamScopedComponent';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsProvider';
import { NotFoundPage } from './pages/NotFoundPage';
import PlansPage from './pages/dashboard/PlansPage';
import StripeCallbackPage from './pages/dashboard/StripeCallbackPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { CookieConsentProvider } from './cookie-consent/contexts/CookieConsentContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import { useSettings } from './contexts/SettingsProvider';
import './i18n/config'; // Initialize i18n

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const ActivityLogsPage = React.lazy(() => import('./pages/dashboard/CrawlLogsPage'));
const ApiKeysPage = React.lazy(() => import('./pages/dashboard/ApiKeysPage'));
const SettingsPage = React.lazy(() => import('./pages/dashboard/SettingsPage'));
const CrawlPage = React.lazy(() => import('./pages/dashboard/CrawlPage'));
const UsagePage = React.lazy(() => import('./pages/dashboard/UsagePage'));
const ProfilePage = React.lazy(() => import('./pages/dashboard/ProfilePage'));
const CrawlRequestDetailPage = React.lazy(() => import('./pages/dashboard/CrawlRequestDetailPage'));
const SearchPage = React.lazy(() => import('./pages/dashboard/SearchPage'));
const SearchLogsPage = React.lazy(() => import('./pages/dashboard/SearchLogsPage'));
const SearchRequestDetailPage = React.lazy(() => import('./pages/dashboard/SearchRequestDetailPage'));
const SitemapPage = React.lazy(() => import('./pages/dashboard/SitemapPage'));
const SitemapLogsPage = React.lazy(() => import('./pages/dashboard/SitemapLogsPage'));
const SitemapRequestDetailPage = React.lazy(() => import('./pages/dashboard/SitemapRequestDetailPage'));
const ApiReferencePage = React.lazy(() => import('./pages/dashboard/ApiReferencePage'));
const UsageHistoryPage = React.lazy(() => import('./pages/dashboard/UsageHistoryPage'));


// Knowledge Base pages
const KnowledgeBasePage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBasePage'));
const KnowledgeBaseNewPage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBaseNewPage'));
const KnowledgeBaseDetailPage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBaseDetailPage'));
const KnowledgeBaseDocumentDetailPage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBaseDocumentDetailPage'));
const KnowledgeBaseQueryPage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBaseQueryPage'));
const KnowledgeBaseEditPage = React.lazy(() => import('./pages/dashboard/knowledge-base/KnowledgeBaseEditPage'));

// Knowledge Base Import pages with modular structure
const KnowledgeBaseImportOptionsPage = React.lazy(() => import('./pages/dashboard/knowledge-base/ImportOptionsPage'));
const KnowledgeBaseSelectCrawlPage = React.lazy(() => import('./pages/dashboard/knowledge-base/SelectCrawlPage'));
const KnowledgeBaseSelectSitemapPage = React.lazy(() => import('./pages/dashboard/knowledge-base/SelectSitemapPage'));
const KnowledgeBaseSelectCrawlResultsPage = React.lazy(() => import('./pages/dashboard/knowledge-base/SelectCrawlResultsPage'));
const KnowledgeBaseNewCrawlPage = React.lazy(() => import('./pages/dashboard/knowledge-base/NewCrawlPage'));
const KnowledgeBaseNewSitemapPage = React.lazy(() => import('./pages/dashboard/knowledge-base/NewSitemapPage'));
const KnowledgeBaseManualEntryPage = React.lazy(() => import('./pages/dashboard/knowledge-base/ManualEntryPage'));
const KnowledgeBaseUploadDocumentsPage = React.lazy(() => import('./pages/dashboard/knowledge-base/UploadDocumentsPage'));
const BatchUrlImportPage = React.lazy(() => import('./pages/dashboard/knowledge-base/BatchUrlImportPage'));
const KnowledgeBaseUrlSelectorPage = React.lazy(() => import('./pages/dashboard/knowledge-base/UrlSelectorPage'));
const KnowledgeBaseImportProgressPage = React.lazy(() => import('./pages/dashboard/knowledge-base/ImportProgressPage'));

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/manager/ManagerDashboard'));
const ManageProxiesPage = React.lazy(() => import('./pages/manager/ManageProxiesPage'));
const ManageLLMProvidersPage = React.lazy(() => import('./pages/manager/ManageLLMProvidersPage'));
const ProviderConfigDetailPage = React.lazy(() => import('./pages/manager/ProviderConfigDetailPage'));

// App Content Component (inside SettingsProvider)
const AppContent: React.FC = () => {
  const { settings } = useSettings();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BreadcrumbProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          </Route>
          <Route element={
            <AuthGuard>
              <UserProvider>
                <TeamProvider>
                  <TeamScopedComponent>
                    <DashboardLayout />
                  </TeamScopedComponent>
                </TeamProvider>
              </UserProvider>
            </AuthGuard>
          }>
            <Route path="/dashboard">
              <Route index element={<DashboardPage />} />
              <Route path="playground" element={<Navigate to="/dashboard/crawl" replace />} />
              <Route path="crawl" element={<CrawlPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="sitemap" element={<SitemapPage />} />
              <Route path="logs/crawls" element={<ActivityLogsPage />} />
              <Route path="logs/crawls/:requestId" element={<CrawlRequestDetailPage />} />
              <Route path="logs/searches" element={<SearchLogsPage />} />
              <Route path="logs/searches/:id" element={<SearchRequestDetailPage />} />
              <Route path="logs/sitemaps" element={<SitemapLogsPage />} />
              <Route path="logs/sitemaps/:id" element={<SitemapRequestDetailPage />} />
              <Route path="logs/usage" element={<UsageHistoryPage />} />
              <Route path="usage" element={<UsagePage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="api-reference" element={<ApiReferencePage />} />

              {/* Knowledge Base Routes - Conditionally rendered */}
              {settings?.is_knowledge_base_enabled && (
                <>
                  <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="knowledge-base/new" element={<KnowledgeBaseNewPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId" element={<KnowledgeBaseDetailPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/documents/:documentId" element={<KnowledgeBaseDocumentDetailPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/edit" element={<KnowledgeBaseEditPage />} />

                  {/* Knowledge Base Import Routes with modular structure */}
                  <Route path="knowledge-base/:knowledgeBaseId/import" element={<KnowledgeBaseImportOptionsPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/select-crawl" element={<KnowledgeBaseSelectCrawlPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/select-sitemap" element={<KnowledgeBaseSelectSitemapPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/new-crawl" element={<KnowledgeBaseNewCrawlPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/new-sitemap" element={<KnowledgeBaseNewSitemapPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/manual" element={<KnowledgeBaseManualEntryPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/upload" element={<KnowledgeBaseUploadDocumentsPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/batch-urls" element={<BatchUrlImportPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/select-crawl/:crawlRequestId" element={<KnowledgeBaseSelectCrawlResultsPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import/select-sitemap/:sitemapRequestId" element={<KnowledgeBaseUrlSelectorPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/import-progress" element={<KnowledgeBaseImportProgressPage />} />
                  <Route path="knowledge-base/:knowledgeBaseId/query" element={<KnowledgeBaseQueryPage />} />
                </>
              )}
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={
            <AuthGuard>
              <UserProvider>
                <AdminLayout />
              </UserProvider>
            </AuthGuard>
          }>
            <Route path="/manager">
              <Route index element={<AdminDashboard />} />
              <Route path="proxies" element={<ManageProxiesPage />} />
              <Route path="llm-providers" element={<ManageLLMProvidersPage />} />
              <Route path="llm-providers/:providerConfigId" element={<ProviderConfigDetailPage />} />
            </Route>
          </Route>

          <Route path="stripe-callback/" element={<StripeCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BreadcrumbProvider>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DirectionProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgb(51, 65, 85)',
                color: '#fff',
                borderRadius: '8px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <SettingsProvider>
            <CookieConsentProvider>
              <AppContent />
            </CookieConsentProvider>
          </SettingsProvider>
        </Router>
      </DirectionProvider>
    </ThemeProvider >
  );
};

export default App;
