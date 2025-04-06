import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstallForm } from '../../components/auth/InstallForm';
import { AuthService } from '../../services/authService';
import Loading from '../../components/shared/Loading';
import { useSettings } from "../../contexts/SettingsProvider.tsx";

const InstallPage = () => {
  const navigate = useNavigate();
  const {settings, loading} = useSettings();

  useEffect(() => {
    // If already installed, redirect to home page
    if (settings && settings?.is_installed) {
      navigate('/');
    }

  }, [navigate, settings]);

  if (loading) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return <InstallForm />;
};

export default InstallPage;
