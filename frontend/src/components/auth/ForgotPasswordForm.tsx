import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import Loading from '../shared/Loading';
import { authApi } from '../../services/api/auth';
import { FormInput } from '../shared/FormInput';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const getSchema = (t: (key: string) => string) => yup.object({
  email: yup.string().email(t('validation.email')).required(t('validation.required')),
});

type FormData = {
  email: string;
};

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);
  const methods = useForm<FormData>({
    resolver: yupResolver(getSchema(t)),
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('auth.forgotPassword.error'));
    }
  };

  if (success) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.forgotPassword.checkEmail')}
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.forgotPassword.success')}
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="mt-2 mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.forgotPassword.subtitle')}
        </p>

        <FormProvider {...methods}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label={t('auth.forgotPassword.email')}
              name="email"
              type="email"
              error={errors.email?.message}
              required
            />

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
              >
                {isSubmitting ? <Loading size="sm" /> : t('auth.forgotPassword.sendButton')}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link
                  to="/"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
