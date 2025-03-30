import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { TeamProvider } from './contexts/TeamContext';
import { UserProvider } from './contexts/UserContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TeamScopedComponent } from './components/shared/TeamScopedComponent';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsProvider';
import { NotFoundPage } from './pages/NotFoundPage';
import PlansPage from './pages/dashboard/PlansPage';
import StripeCallbackPage from './pages/dashboard/StripeCallbackPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { CookieConsentProvider } from './cookie-consent/contexts/CookieConsentContext';

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const ActivityLogsPage = React.lazy(() => import('./pages/dashboard/ActivityLogsPage'));
const ApiKeysPage = React.lazy(() => import('./pages/dashboard/ApiKeysPage'));
const SettingsPage = React.lazy(() => import('./pages/dashboard/SettingsPage'));
const PlaygroundPage = React.lazy(() => import('./pages/dashboard/PlaygroundPage'));
const UsagePage = React.lazy(() => import('./pages/dashboard/UsagePage'));
const ProfilePage = React.lazy(() => import('./pages/dashboard/ProfilePage'));
const CrawlRequestDetailPage = React.lazy(() => import('./pages/dashboard/CrawlRequestDetailPage'));

const App: React.FC = () => {
  return (
    <ThemeProvider>
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
            <Suspense fallback={<div>Loading...</div>}>
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
                    <Route path="playground" element={<PlaygroundPage />} />
                    <Route path="logs" element={<ActivityLogsPage />} />
                    <Route path="logs/:requestId" element={<CrawlRequestDetailPage />} />
                    <Route path="usage" element={<UsagePage />} />
                    <Route path="api-keys" element={<ApiKeysPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="plans" element={<PlansPage />} />
                  </Route>
                </Route>
                <Route path="stripe-callback/" element={<StripeCallbackPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </CookieConsentProvider>
        </SettingsProvider>
      </Router>
    </ThemeProvider >
  );
};

export default App;
