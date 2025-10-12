import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FormInput } from '../shared/FormInput';
import { ValidationMessage } from '../shared/ValidationMessage';
import { OAuthButtons } from './OAuthButtons';
import { authApi } from '../../services/api/auth';
import { RegisterRequest, VerifyInvitationResponse } from '../../types/auth';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const passwordStrengthRegex = {
  hasNumber: /\d/,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  minLength: 8,
};

const getSchema = (t: (key: string) => string) => yup.object({
  first_name: yup.string().required(t('validation.required')),
  last_name: yup.string().required(t('validation.required')),
  email: yup
    .string()
    .email(t('validation.email'))
    .required(t('validation.required')),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(passwordStrengthRegex.hasNumber, 'Password must contain at least one number')
    .matches(passwordStrengthRegex.hasUpperCase, 'Password must contain at least one uppercase letter')
    .matches(passwordStrengthRegex.hasLowerCase, 'Password must contain at least one lowercase letter')
    .matches(passwordStrengthRegex.hasSpecialChar, 'Password must contain at least one special character')
    .required(t('validation.required')),
}).required();

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

interface SignupFormProps {
  invitation?: VerifyInvitationResponse | null;
}

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

export const SignupForm: React.FC<SignupFormProps> = ({ invitation }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const defaultValues = React.useMemo(() => {
    if (invitation) {
      return {
        email: invitation.email
      };
    }
    return {};
  }, [invitation]);

  const methods = useForm<FormData>({
    resolver: yupResolver(getSchema(t)),
    mode: 'onChange',
    defaultValues
  });

  useEffect(() => {
    if (invitation) {
      methods.reset({
        ...methods.getValues(),
        email: invitation.email
      });
    }
  }, [invitation, methods]);

  const { handleSubmit, formState: { errors }, watch, setError: setFieldError } = methods;
  const password = watch('password', '');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = (data: FormData) => {
    setIsLoading(true);
    setError(null);

    // Clear any previous field errors
    Object.keys(data).forEach((field) => {
      setFieldError(field as keyof FormData, { type: 'manual', message: '' });
    });

    const registerRequest: RegisterRequest = {
      ...data,
    };

    let request;
    if (invitation) {
      request = authApi.registerWithInvitation(registerRequest, invitation.invitation_code);
    } else {
      request = authApi.register(registerRequest);
    }

    request
      .then((response) => {
        if (response.email_verified) {
          toast.success(t('auth.signup.success'), {
            duration: 3000,
          });
          navigate('/');
        }
        setSuccess(true);
      })
      .catch((err: any) => {
        console.log('API Error:', err);
        // Access the error data from the Axios response
        const errorData = err.response?.data;
        console.log('Error Data:', errorData);

        if (errorData?.errors) {
          // Handle field-specific errors
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            if (field === 'non_field_errors') {
              setError(Array.isArray(messages) ? messages[0] : messages);
            } else {
              setFieldError(field as keyof FormData, {
                type: 'manual',
                message: Array.isArray(messages) ? messages[0] : messages,
              });
            }
          });

          // If we have a general message but no non_field_errors, show it at the top
          if (!errorData.errors.non_field_errors && errorData.message) {
            setError(errorData.message);
          }
        } else {
          setError(errorData?.message || t('auth.signup.error'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

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

  if (success) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.signup.checkEmail')}
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.signup.verificationSent')}
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              {t('auth.signup.returnToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && <ValidationMessage message={error} type="error" />}

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label={t('auth.signup.firstName')}
                name="first_name"
                type="text"
                error={errors.first_name?.message}
                required
              />

              <FormInput
                label={t('auth.signup.lastName')}
                name="last_name"
                type="text"
                error={errors.last_name?.message}
                required
              />
            </div>

            <FormInput
              label={t('auth.signup.email')}
              name="email"
              type="email"
              error={errors.email?.message}
              disabled={!!invitation}
              required
            />

            <div className="space-y-1">
              <FormInput
                label={t('auth.signup.password')}
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

              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor(
                          passwordStrength.score
                        )} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t('auth.signup.hasAccount')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? t('auth.signup.creating') : t('auth.signup.signupButton')}
            </button>
          </form>

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
        </div>
      </div>
    </FormProvider>
  );
};
