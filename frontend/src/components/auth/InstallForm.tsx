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

const passwordStrengthRegex = {
  hasNumber: /\d/,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  minLength: 8,
};

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(passwordStrengthRegex.minLength, `Password must be at least ${passwordStrengthRegex.minLength} characters`)
    .matches(passwordStrengthRegex.hasNumber, 'Password must contain at least one number')
    .matches(passwordStrengthRegex.hasUpperCase, 'Password must contain at least one uppercase letter')
    .matches(passwordStrengthRegex.hasLowerCase, 'Password must contain at least one lowercase letter')
    .matches(passwordStrengthRegex.hasSpecialChar, 'Password must contain at least one special character')
    .required('Password is required'),
  passwordConfirm: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  acceptLicense: yup
    .boolean()
    .oneOf([true], 'You must accept the license agreement')
    .required('You must accept the license agreement'),
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
    0: 'Very weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
    5: 'Very strong',
  };

  return {
    score,
    message: messages[score as keyof typeof messages],
  };
};

export const InstallForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const {reloadSettings} = useSettings();

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
        toast.success('System installed successfully!');
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
              setError(Object.values(errors)[0].toString() || 'An error occurred during installation. Please try again.');
            }
          } else {
            setError(err.response.data?.message || 'An error occurred during installation. Please try again.');
          }
        } else {
          setError('An error occurred during installation. Please try again.');
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
              Installation Complete
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              WaterCrawl has been successfully installed. You can now start using the system.
            </p>
            <button
              type="button"
              onClick={goToHome}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Login and Start Using WaterCrawl
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
              Install WaterCrawl
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Set up your administrator account and configure your installation preferences
            </p>
          </div>

          {error && <ValidationMessage message={error} type="error" />}

          <form onSubmit={onSubmitHandler} className="space-y-8">
            {/* Admin Account Section */}
            <div className="space-y-6">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-primary-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Administrator Account</h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-4">
                <FormInput
                  label="Admin Email Address"
                  name="email"
                  type="email"
                  error={errors.email?.message}
                  required
                />

                <div className="space-y-1">
                  <FormInput
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.password?.message}
                    required
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pr-3 focus:outline-none"
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
                          Password strength: {passwordStrength?.message}
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
                          • At least {passwordStrengthRegex.minLength} characters
                        </p>
                        <p className={passwordStrengthRegex.hasUpperCase.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • At least one uppercase letter
                        </p>
                        <p className={passwordStrengthRegex.hasLowerCase.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • At least one lowercase letter
                        </p>
                        <p className={passwordStrengthRegex.hasNumber.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • At least one number
                        </p>
                        <p className={passwordStrengthRegex.hasSpecialChar.test(password) ? "text-green-500 dark:text-green-400" : ""}>
                          • At least one special character
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <FormInput
                    label="Confirm Password"
                    name="passwordConfirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={errors.passwordConfirm?.message}
                    required
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="pr-3 focus:outline-none"
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
                <ShieldCheckIcon className="h-5 w-5 text-primary-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Legal & Preferences</h3>
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
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptLicense" className="font-medium text-gray-700 dark:text-gray-300">
                      I accept and agree to follow the license policies of WaterCrawl
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      You can read the latest version <a href="https://github.com/watercrawl/WaterCrawl/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 underline">here</a>.
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
                  <div className="ml-3 text-sm">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <label htmlFor="joinNewsletter" className="font-medium text-gray-700 dark:text-gray-300">
                        Join our newsletter
                      </label>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      We'll send you WaterCrawl updates, new features, and important announcements.
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
                  <div className="ml-3 text-sm">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <label htmlFor="allowAnalytics" className="font-medium text-gray-700 dark:text-gray-300">
                        Send anonymous analytics
                      </label>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Help us improve WaterCrawl by sending anonymous installation and usage data.
                    </p>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      <p className="font-medium mb-1">We collect the following system information:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>OS name (Windows, Linux, macOS)</li>
                        <li>OS version and release</li>
                        <li>System architecture (x86_64, ARM)</li>
                        <li>Kernel version</li>
                        <li>CPU model</li>
                        <li>A unique installation ID</li>
                      </ul>
                      <p className="mt-2">All data is collected anonymously and used only for improving WaterCrawl.</p>
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Installing...
                </span>
              ) : 'Install WaterCrawl'}
            </button>
          </form>
        </div>
      </div>
    </FormProvider>
  );
};
