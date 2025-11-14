import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { FormInput } from '../shared/FormInput';
import Loading from '../shared/Loading';

import { authApi } from '../../services/api/auth';

const getSchema = (t: (key: string) => string) =>
  yup.object({
    password: yup.string().required(t('validation.required')),
    confirmPassword: yup
      .string()
      .required(t('validation.required'))
      .oneOf([yup.ref('password')], t('validation.passwordMatch')),
  });

type FormData = {
  password: string;
  confirmPassword: string;
};

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const methods = useForm<FormData>({
    resolver: yupResolver(getSchema(t)),
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(token, data.password);
      toast.success(t('auth.resetPassword.success'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('auth.resetPassword.error'));
    }
  };

  return (
    <>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-foreground">
            {t('auth.resetPassword.title')}
          </h2>

          <FormProvider {...methods}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <FormInput
                label={t('auth.resetPassword.newPassword')}
                name="password"
                type="password"
                error={errors.password?.message}
                required
              />

              <FormInput
                label={t('auth.resetPassword.confirmPassword')}
                name="confirmPassword"
                type="password"
                error={errors.confirmPassword?.message}
                required
              />

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:opacity-50"
                >
                  {isSubmitting ? <Loading size="sm" /> : t('auth.resetPassword.resetButton')}
                </button>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-sm">
                  <Link
                    to="/auth/login"
                    className="font-medium text-primary hover:text-primary-strong"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </>
  );
}
