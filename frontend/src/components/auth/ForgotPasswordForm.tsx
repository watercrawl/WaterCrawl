import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import Loading from '../shared/Loading';
import { authApi } from '../../services/api/auth';
import { FormInput } from '../shared/FormInput';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
});

type FormData = yup.InferType<typeof schema>;

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const methods = useForm<FormData>({
    resolver: yupResolver(schema),
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
      toast.error(error.response?.data?.message || 'Failed to send reset instructions');
    }
  };

  if (success) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            If an account exists with that email address, we've sent instructions to reset your password.
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Return to login
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
          Forgot Password
        </h2>
        <p className="mt-2 mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <FormProvider {...methods}>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label="Email address"
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
                {isSubmitting ? <Loading size="sm" /> : 'Send reset instructions'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link
                  to="/"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
