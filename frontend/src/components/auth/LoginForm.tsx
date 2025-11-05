import React, { useState } from 'react';

import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { AxiosError } from 'axios';
import * as yup from 'yup';

import { EmailVerificationPopup } from '../EmailVerificationPopup';
import { FormInput } from '../shared/FormInput';
import { ValidationMessage } from '../shared/ValidationMessage';

import { useSettings } from '../../contexts/SettingsProvider';
import { authApi } from '../../services/api/auth';
import { AuthService } from '../../services/authService';
import { TeamService } from '../../services/teamService';

import { OAuthButtons } from './OAuthButtons';

import type { ApiError } from '../../types/common';




const getSchema = (t: (key: string) => string) =>
  yup
    .object({
      email: yup.string().email(t('validation.email')).required(t('validation.required')),
      password: yup.string().required(t('validation.required')),
    })
    .required();

type LoginFormData = {
  email: string;
  password: string;
};

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerificationPopup, setShowEmailVerificationPopup] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const methods = useForm<LoginFormData>({
    resolver: yupResolver(getSchema(t)),
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const { settings } = useSettings();

  const onSubmitHandler = handleSubmit((data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setUserEmail(data.email);

    authApi
      .login(data)
      .then(response => {
        TeamService.getInstance().removeCurrentTeam();
        AuthService.getInstance().setTokens(response.access, response.refresh);
        navigate('/dashboard');
      })
      .catch((err: AxiosError<ApiError>) => {
        if (err.response?.status === 400) {
          setError(err.response?.data?.errors?.email?.toLocaleString() || t('auth.login.error'));
        }
        if (err.response?.status === 403) {
          setShowEmailVerificationPopup(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  });

  return (
    <FormProvider {...methods}>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {settings?.is_login_active && (
            <form onSubmit={onSubmitHandler} className="space-y-6">
              {error && <ValidationMessage message={error} type="error" />}

              <FormInput
                label={t('auth.login.email')}
                name="email"
                type="email"
                error={errors.email?.message}
                required
              />

              <div className="space-y-1">
                <FormInput
                  label={t('auth.login.password')}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  error={errors.password?.message}
                  required
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pe-3 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-muted-foreground" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-muted-foreground" />
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary hover:text-primary-strong"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                {settings.is_signup_active && (
                  <div className="text-sm">
                    <Link
                      to="/register"
                      className="font-medium text-primary hover:text-primary-strong"
                    >
                      {t('auth.signup.signupButton')}
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isLoading ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                {isLoading ? t('auth.login.loading') : t('auth.login.loginButton')}
              </button>
            </form>
          )}
          {(settings?.is_github_login_active || settings?.is_google_login_active) && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">{t('auth.login.or')}</span>
                </div>
              </div>
              <div className="mt-6">
                <OAuthButtons />
              </div>
            </div>
          )}
        </div>
      </div>
      {showEmailVerificationPopup && (
        <EmailVerificationPopup
          email={userEmail}
          onClose={() => setShowEmailVerificationPopup(false)}
        />
      )}
    </FormProvider>
  );
};
