import { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { InvitationsList } from '../../components/profile/InvitationsList';
import { LogoutButton } from '../../components/profile/LogoutButton';
import { ProfileForm } from '../../components/profile/ProfileForm';
import PageHeader from '../../components/shared/PageHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('profile.title'), href: '/dashboard/profile', current: true },
    ]);
  }, [setItems, t]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader titleKey="profile.title" descriptionKey="profile.subtitle" />
      <div>
        <div className="py-4">
          <ProfileForm />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            {t('profile.teamInvitations')}
          </h2>
          <InvitationsList />
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">{t('profile.accountActions')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('profile.accountActionsSubtitle')}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
