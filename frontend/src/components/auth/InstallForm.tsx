import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, EnvelopeIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { FormInput } from '../shared/FormInput';
import { ValidationMessage } from '../shared/ValidationMessage';
import toast from 'react-hot-toast';
import { useSettings } from "../../contexts/SettingsProvider.tsx";
import { authApi } from '../../services/api/auth';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types/common';
import type { InstallRequest } from '../../types/auth';
import { useTranslation } from 'react-i18next';

const passwordStrengthRegex = {
  hasNumber: /\d/,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  minLength: 8,
};


export const InstallForm: React.FC = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const {reloadSettings} = useSettings();

  const schema = yup.object({
    email: yup
      .string()
      .email(t('install.validation.validEmail'))
      .required(t('install.validation.emailRequired')),
    password: yup
      .string()
      .min(passwordStrengthRegex.minLength, t('install.validation.passwordMinLength', { min: passwordStrengthRegex.minLength }))
      .matches(passwordStrengthRegex.hasNumber, t('install.validation.passwordNumber'))
      .matches(passwordStrengthRegex.hasUpperCase, t('install.validation.passwordUppercase'))
      .matches(passwordStrengthRegex.hasLowerCase, t('install.validation.passwordLowercase'))
      .matches(passwordStrengthRegex.hasSpecialChar, t('install.validation.passwordSpecial'))
      .required(t('install.validation.passwordRequired')),
    passwordConfirm: yup
      .string()
      .required(t('install.validation.confirmPassword'))
      .oneOf([yup.ref('password')], t('install.validation.passwordsMatch')),
    acceptLicense: yup
      .boolean()
      .oneOf([true], t('install.validation.acceptLicense'))
      .required(t('install.validation.acceptLicense')),
    joinNewsletter: yup
      .boolean()
      .default(false)
      .required(),
    allowAnalytics: yup
      .boolean()
      .default(false)
      .required(),
  }).required();

type InstallFormData = {
  email: string;
  password: string;
  passwordConfirm: string;
  acceptLicense: boolean;
  joinNewsletter: boolean;
  allowAnalytics: boolean;
};

  const getPasswordStrength = (password: string): { score: number; message: string } => {
    let score = 0;
    const checks = [
      { regex: passwordStrengthRegex.hasNumber, message: 'number' },
      { regex: passwordStrengthRegex.hasUpperCase, message: 'uppercase letter' },
      { regex: passwordStrengthRegex.hasLowerCase, message: 'lowercase letter' },
      { regex: passwordStrengthRegex.hasSpecialChar, message: 'special character' },
    ];

    checks.forEach(check => {
      if (check.regex.test(password)) score++;
    });

    if (password.length >= passwordStrengthRegex.minLength) score++;

    const messages = {
      0: t('install.password.veryWeak'),
      1: t('install.password.weak'),
      2: t('install.password.fair'),
      3: t('install.password.good'),
      4: t('install.password.strong'),
      5: t('install.password.veryStrong'),
    };

    return {
      score,
      message: messages[score as keyof typeof messages],
    };
  };

  const methods = useForm<InstallFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      acceptLicense: false,
      joinNewsletter: false,
      allowAnalytics: false
    },
    mode: 'onChange'
  });

  const { handleSubmit, formState: { errors }, register, watch } = methods;
  const password = watch('password', '');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const getPasswordStrengthColor = (score: number) => {
    const colors = {
      0: 'bg-red-500',
      1: 'bg-red-400',
      2: 'bg-yellow-500',
      3: 'bg-yellow-400',
      4: 'bg-green-500',
      5: 'bg-green-400',
    };
    return colors[score as keyof typeof colors];
  };

  const onSubmitHandler = handleSubmit((data: InstallFormData) => {
    setIsLoading(true);
    setError(null);

    // Map form data to API request format
    const requestData: InstallRequest = {
      email: data.email,
      password: data.password,
      newsletter_confirmed: data.joinNewsletter,
      analytics_confirmed: data.allowAnalytics
    };

    // Make API call to install endpoint
    authApi.install(requestData)
      .then(() => {
        // Store auth tokens
        setInstallSuccess(true);
        toast.success(t('install.success'));
      })
      .catch((err: AxiosError<ApiError>) => {
        console.error('Installation error:', err);

        if (err.response?.status === 400) {
          // Handle validation errors
          if (err.response.data?.errors) {
            const errors = err.response.data.errors;
            if (errors.email) {
              setError(errors.email.toString());
            } else if (errors.password) {
              setError(errors.password.toString());
            } else {
              setError(Object.values(errors)[0].toString() || t('install.error'));
            }
          } else {
            setError(err.response.data?.message || t('install.error'));
          }
        } else {
          setError(t('install.error'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  });

  const goToHome = () => {
    reloadSettings();
  };

  if (installSuccess) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow sm:rounded-lg">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('install.complete.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('install.complete.message')}
            </p>
            <button
              type="button"
              onClick={goToHome}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              {t('install.complete.button')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow sm:rounded-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('install.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('install.subtitle')}
            </p>
          </div>

          {error && <ValidationMessage message={error} type="error" />}

          <form onSubmit={onSubmitHandler} className="space-y-8">
            {/* Admin Account Section */}
            <div className="space-y-6">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-primary-500 me-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('install.adminAccount')}</h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-4">
                <FormInput
                  label={t('install.form.email')}
                  name="email"
                  type="email"
                  error={errors.email?.message}
                  required
                />

                <div className="space-y-1">
                  <FormInput
                    label={t('install.form.password')}
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

                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('install.password.strength')}: {passwordStrength?.message}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {passwordStrength?.score}/5
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${passwordStrength ? getPasswordStrengthColor(passwordStrength.score) : ''}`}
                          style={{ width: `${(passwordStrength?.score || 0) * 20}%` }}
                        ></div>
                      </div>

                      {/* Password requirements */}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p className={password.length >= passwordStrengthRegex.minLength ? "text-green-500 dark:text-green-400" : ""}>
                          • {t('install.password.minChars', { min: passwordStrengthRegex.minLength })}
                        </p>
                        <p className={passwordStrengthRegex.hasUpperCase.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • {t('install.password.uppercase')}
                        </p>
                        <p className={passwordStrengthRegex.hasLowerCase.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • {t('install.password.lowercase')}
                        </p>
                        <p className={passwordStrengthRegex.hasNumber.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • {t('install.password.number')}
                        </p>
                        <p className={passwordStrengthRegex.hasSpecialChar.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • {t('install.password.specialChar')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <FormInput
                    label={t('install.form.confirmPassword')}
                    name="passwordConfirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={errors.passwordConfirm?.message}
                    required
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="pe-3 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="space-y-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-primary-500 me-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('install.preferences')}</h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-5">
                {/* License Agreement Checkbox - Required */}
                <div className="flex items-start pb-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="acceptLicense"
                      type="checkbox"
                      {...register('acceptLicense')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded dark:focus:ring-primary-600 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ms-3 text-sm">
                    <label htmlFor="acceptLicense" className="font-medium text-gray-700 dark:text-gray-300">
                      {t('install.license.accept')}
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {t('install.license.readVersion')} <a href="https://github.com/watercrawl/WaterCrawl/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 underline">{t('install.license.here')}</a>.
                    </p>
                    {errors.acceptLicense && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.acceptLicense.message}</p>
                    )}
                  </div>
                </div>

                {/* Newsletter Opt-in Checkbox - Optional */}
                <div className="flex items-start py-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="joinNewsletter"
                      type="checkbox"
                      {...register('joinNewsletter')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded dark:focus:ring-primary-600 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ms-3 text-sm">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 me-1" />
                      <label htmlFor="joinNewsletter" className="font-medium text-gray-700 dark:text-gray-300">
                        {t('install.newsletter.title')}
                      </label>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {t('install.newsletter.description')}
                    </p>
                  </div>
                </div>

                {/* Analytics Opt-in Checkbox - Optional */}
                <div className="flex items-start pt-4">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="allowAnalytics"
                      type="checkbox"
                      {...register('allowAnalytics')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded dark:focus:ring-primary-600 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ms-3 text-sm">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 me-1" />
                      <label htmlFor="allowAnalytics" className="font-medium text-gray-700 dark:text-gray-300">
                        {t('install.analytics.title')}
                      </label>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {t('install.analytics.description')}
                    </p>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      <p className="font-medium mb-1">{t('install.analytics.collected')}:</p>
                      <ul className="list-disc ps-4 space-y-1">
                        <li>{t('install.analytics.os')}</li>
                        <li>{t('install.analytics.osVersion')}</li>
                        <li>{t('install.analytics.architecture')}</li>
                        <li>{t('install.analytics.kernel')}</li>
                        <li>{t('install.analytics.cpu')}</li>
                        <li>{t('install.analytics.installId')}</li>
                      </ul>
                      <p className="mt-2">{t('install.analytics.anonymous')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ms-1 me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('install.button.installing')}
                </span>
              ) : t('install.button.install')}
            </button>
          </form>
        </div>
      </div>
    </FormProvider>
  );
};
