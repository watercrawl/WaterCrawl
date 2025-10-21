import { useEffect, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { profileApi } from '../../services/api/profile';
import toast from 'react-hot-toast';
import { FormInput } from '../shared/FormInput';
import Loading from '../shared/Loading';
import { EnvelopeOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Switch } from '../shared/Switch';

const getSchema = (t: (key: string) => string) =>
  yup
    .object({
      first_name: yup.string().required(t('profile.form.firstNameRequired')),
      last_name: yup.string().required(t('profile.form.lastNameRequired')),
      email: yup.string().email(t('profile.form.emailInvalid')),
      newsletter_confirmed: yup.boolean(),
    })
    .required();

type FormData = yup.InferType<ReturnType<typeof getSchema>>;

export const ProfileForm: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm<FormData>({
    resolver: yupResolver(getSchema(t)),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      newsletter_confirmed: false,
    },
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
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
          newsletter_confirmed: profile.newsletter_confirmed,
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('profile.form.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [reset, t]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      await profileApi.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        newsletter_confirmed: data.newsletter_confirmed,
      });
      toast.success(t('profile.form.updateSuccess'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('profile.form.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
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
                  label={t('profile.info.firstName')}
                  name="first_name"
                  type="text"
                  error={errors.first_name?.message}
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <FormInput
                  label={t('profile.info.lastName')}
                  name="last_name"
                  type="text"
                  error={errors.last_name?.message}
                  required
                />
              </div>

              <div className="col-span-6">
                <FormInput
                  label={t('profile.info.email')}
                  name="email"
                  type="text"
                  error={errors.email?.message}
                  disabled
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('profile.info.emailCannotChange')}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-start gap-x-4 rounded-lg border border-alert-info-border bg-alert-info-bg p-4">
                <EnvelopeOpenIcon className="mt-1 h-6 w-6 flex-shrink-0 text-alert-info-icon" />
                <div className="flex-1">
                  <h3 className="flex items-center text-sm font-semibold text-alert-info-text">
                    {t('profile.newsletter.title')}
                    <InformationCircleIcon
                      className="ms-2 h-4 w-4 cursor-help text-alert-info-text/70 hover:text-alert-info-text"
                      title={t('profile.newsletter.tooltip')}
                    />
                  </h3>
                  <p className="mb-3 text-xs text-alert-info-text/80">
                    {t('profile.newsletter.description')}
                  </p>

                  <div className="flex items-center">
                    <Controller
                      name="newsletter_confirmed"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Switch
                          checked={value || false}
                          onChange={onChange}
                          label={t('profile.newsletter.receiveUpdates')}
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
                className="ms-3 inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? <Loading size="sm" /> : t('profile.form.save')}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
