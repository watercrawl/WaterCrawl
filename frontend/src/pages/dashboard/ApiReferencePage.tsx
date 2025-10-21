import { useCallback, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RedocStandalone } from 'redoc';
import { API_URL } from '../../utils/env';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
const ApiReferencePage: React.FC = () => {
  const { setItems } = useBreadcrumbs();
  const { theme } = useTheme();
  const getBaseUrl = useCallback(() => {
    let url = API_URL;
    if (!/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);
  const getThemeConfig = useCallback(() => {
    const baseTheme = {
      scrollYOffset: 64,
      theme: {
        colors: {
          primary: { main: '#1e40af' },
          ...(theme === 'dark' && {
            tonalOffset: 0.2,
            primary: { main: '#60a5fa' },
            text: { primary: '#f8fafc', secondary: '#e2e8f0' },
            gray: { 50: '#0f172a', 100: '#1e293b' },
            border: { dark: '#475569' },
          }),
        },
        sidebar: {
          ...(theme === 'dark' && {
            backgroundColor: '#0f172a',
            textColor: '#f8fafc',
            activeTextColor: '#60a5fa',
            groupItems: {
              textTransform: 'uppercase',
              fontSize: '0.9em',
              paddingBottom: '5px',
              marginBottom: '13px',
              color: '#cbd5e1',
              borderBottom: '1px solid #475569',
            },
          }),
        },
        rightPanel: {
          ...(theme === 'dark' && {
            backgroundColor: '#1e293b',
            textColor: '#9ca3af',
            servers: {
              overlay: { backgroundColor: '#334155', textColor: '#f8fafc' },
              url: { backgroundColor: '#475569' },
            },
          }),
        },
        codeBlock: {
          ...(theme === 'dark' && {
            backgroundColor: '#0f172a',
            border: '1px solid #475569',
            color: '#f8fafc',
          }),
        },
        fab: { ...(theme === 'dark' && { backgroundColor: '#1e40af', color: '#f8fafc' }) },
        schema: { ...(theme === 'dark' && { nestedBackground: '#1e293b' }) },
      },
    };
    return baseTheme;
  }, [theme]);
  useEffect(() => {
    setItems([]);
  }, [setItems]);
  return (
    <div className="ltr relative">
      <style>
        {`
                    .redoc-wrap h5{
                        color: ${theme === 'dark' ? '#f8fafc' : '#1e293b'};
                    }
                `}
      </style>
      <RedocStandalone specUrl={getBaseUrl() + '/api/schema/team'} options={getThemeConfig()} />
    </div>
  );
};

export default ApiReferencePage;
