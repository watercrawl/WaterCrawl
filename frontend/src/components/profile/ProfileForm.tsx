import { useEffect, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { profileApi } from '../../services/api/profile';
import toast from 'react-hot-toast';
import { FormInput } from '../shared/FormInput';
import Loading from '../shared/Loading';
import { EnvelopeOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Switch } from '../shared/Switch';

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Please enter a valid email address'),
  newsletter_confirmed: yup.boolean(),
});

type FormData = yup.InferType<typeof schema>;

export const ProfileForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      newsletter_confirmed: false
    }
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = methods;

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await profileApi.getProfile();
        reset({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          newsletter_confirmed: profile.newsletter_confirmed
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      await profileApi.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        newsletter_confirmed: data.newsletter_confirmed
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mt-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <FormInput
                  label="First name"
                  name="first_name"
                  type="text"
                  error={errors.first_name?.message}
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <FormInput
                  label="Last name"
                  name="last_name"
                  type="text"
                  error={errors.last_name?.message}
                  required
                />
              </div>

              <div className="col-span-6">
                <FormInput
                  label="Email address"
                  name="email"
                  type="text"
                  error={errors.email?.message}
                  disabled
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Email address cannot be changed.</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start space-x-4 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <EnvelopeOpenIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    Newsletter Subscription
                    <InformationCircleIcon 
                      className="h-4 w-4 ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-help"
                      title="Stay updated with our latest features, updates, and exclusive offers!"
                    />
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                    Get the latest updates, product news, and exclusive offers directly in your inbox.
                  </p>
                  
                  <div className="flex items-center">
                    <Controller
                      name="newsletter_confirmed"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Switch
                          checked={value}
                          onChange={onChange}
                          label="Receive newsletters and updates"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isSubmitting}
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? <Loading size="sm" /> : 'Save'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
