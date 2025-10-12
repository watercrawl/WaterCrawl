import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FormInput } from '../shared/FormInput';
import { ValidationMessage } from '../shared/ValidationMessage';
import { OAuthButtons } from './OAuthButtons';
import { authApi } from '../../services/api/auth';
import type { ApiError } from '../../types/common';
import { AuthService } from '../../services/authService';
import { useSettings } from '../../contexts/SettingsProvider';
import { TeamService } from '../../services/teamService';
import { AxiosError } from 'axios';
import { EmailVerificationPopup } from '../EmailVerificationPopup';
import { useTranslation } from 'react-i18next';

const getSchema = (t: (key: string) => string) => yup.object({
  email: yup
    .string()
    .email(t('validation.email'))
    .required(t('validation.required')),
  password: yup
    .string()
    .required(t('validation.required')),
}).required();

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

  const { handleSubmit, formState: { errors } } = methods;

  const { settings } = useSettings();

  const onSubmitHandler = handleSubmit((data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setUserEmail(data.email);

    authApi.login(data)
      .then((response) => {
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
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {settings?.is_login_active &&
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
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                {settings.is_signup_active &&
                  (<div className="text-sm">
                    <Link
                      to="/register"
                      className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {t('auth.signup.signupButton')}
                    </Link>
                  </div>)
                }
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? t('auth.login.loading') : t('auth.login.loginButton')}
              </button>
            </form>
          }
          {(settings?.is_github_login_active || settings?.is_google_login_active) &&
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('auth.login.or')}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <OAuthButtons />
              </div>
            </div>
          }
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
