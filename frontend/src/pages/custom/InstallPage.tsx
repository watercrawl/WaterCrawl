import React from 'react';
import { InstallForm } from '../../components/auth/InstallForm';
import { PublicSkeleton } from '../../layouts/PublicSkeleton';

export const InstallPage: React.FC = () => {
  return (
    <PublicSkeleton>
      <InstallForm />
    </PublicSkeleton>
  );
};
