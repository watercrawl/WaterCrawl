import React from 'react';

import { Outlet } from 'react-router-dom';

import { PublicSkeleton } from './PublicSkeleton';

export const AuthLayout: React.FC = () => {
  return (
    <PublicSkeleton>
      <Outlet />
    </PublicSkeleton>
  );
};
