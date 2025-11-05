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
import { RegisterRequest } from '../../types/auth';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsProvider';

const passwordStrengthRegex = {
  hasNumber: /\d/,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
  minLength: 8,
};

const getSchema = (t: (key: string) => string) =>
  yup
    .object({
      first_name: yup.string().required(t('validation.required')),
      last_name: yup.string().required(t('validation.required')),
      email: yup.string().email(t('validation.email')).required(t('validation.required')),
      password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .matches(passwordStrengthRegex.hasNumber, 'Password must contain at least one number')
        .matches(
          passwordStrengthRegex.hasUpperCase,
          'Password must contain at least one uppercase letter'
        )
        .matches(
          passwordStrengthRegex.hasLowerCase,
          'Password must contain at least one lowercase letter'
        )
        .matches(
          passwordStrengthRegex.hasSpecialChar,
          'Password must contain at least one special character'
        )
        .required(t('validation.required')),
    })
    .required();

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

interface SignupFormProps {
  invitationCode?: string;
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

export const SignupForm: React.FC<SignupFormProps> = ({ invitationCode }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings();



  const methods = useForm<FormData>({
    resolver: yupResolver(getSchema(t)),
    mode: 'onChange',
  });


  const {
    handleSubmit,
    formState: { errors },
    watch,
    setError: setFieldError,
  } = methods;
  const password = watch('password', '');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = (data: FormData) => {
    setIsLoading(true);
    setError(null);

    // Clear any previous field errors
    Object.keys(data).forEach(field => {
      setFieldError(field as keyof FormData, { type: 'manual', message: '' });
    });

    const registerRequest: RegisterRequest = {
      ...data,
    };

    let request;
    if (invitationCode) {
      request = authApi.registerWithInvitation(registerRequest, invitationCode);
    } else {
      request = authApi.register(registerRequest);
    }

    request
      .then(_response => {
        if (!settings?.is_email_verification_active) {
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
      0: 'bg-error',
      1: 'bg-error',
      2: 'bg-warning',
      3: 'bg-warning',
      4: 'bg-success',
      5: 'bg-success',
    };
    return colors[score as keyof typeof colors];
  };

  if (success) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-foreground">
            {t('auth.signup.checkEmail')}
          </h2>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.signup.verificationSent')}
          </p>
          <div className="mt-6 text-center">
            <Link to="/" className="font-medium text-primary hover:text-primary-strong">
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
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
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
                      <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-muted-foreground" />
                    )}
                  </button>
                }
              />

              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-x-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${getPasswordStrengthColor(
                          passwordStrength.score
                        )} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="min-w-[80px] text-sm text-muted-foreground">
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/" className="font-medium text-primary hover:text-primary-strong">
                  {t('auth.signup.hasAccount')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isLoading ? 'cursor-not-allowed opacity-50' : ''
                }`}
            >
              {isLoading ? t('auth.signup.creating') : t('auth.signup.signupButton')}
            </button>
          </form>

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
              {settings?.is_signup_active && <OAuthButtons />}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};
