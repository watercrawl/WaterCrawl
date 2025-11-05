import React from 'react';

import { useNavigate } from 'react-router-dom';

import { AuthService } from '../../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  if (!AuthService.getInstance().getToken()) {
    navigate('/', { replace: true });
  }

  return <div>{children}</div>;
};
