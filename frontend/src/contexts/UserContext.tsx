import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { Profile } from '../types/user';
import { useSettings } from './SettingsProvider';
import { profileApi } from '../services/api/profile';

interface UserContextType {
  user: Profile | null;
  loading: boolean;
  error: Error | null;
  showPrivacyTermsModal: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showPrivacyTermsModal, setShowPrivacyTermsModal] = useState(false);
  const { settings } = useSettings();

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = AuthService.getInstance().getToken();

      if (!token) {
        setUser(null);
        setError(null);
        return;
      }

      const userData = await profileApi.getProfile();
      setUser(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!user || !settings) return;
    if (!user.privacy_confirmed_at || !user.terms_confirmed_at) {
      setShowPrivacyTermsModal(true);
      return;
    }
    if (
      new Date(settings?.policy_update_at) > new Date(user.privacy_confirmed_at) ||
      new Date(settings?.terms_update_at) > new Date(user.terms_confirmed_at)
    ) {
      setShowPrivacyTermsModal(true);
      return;
    }
    setShowPrivacyTermsModal(false);
  }, [user, settings]);

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  return (
    <UserContext.Provider value={{ user, loading, error, showPrivacyTermsModal, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
