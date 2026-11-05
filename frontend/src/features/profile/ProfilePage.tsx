import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, TextAreaField } from '../../components/ui/Field';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import { useAuth } from '../auth/AuthContext';
import { useUpdateProfile } from './hooks';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  university: z.string().optional(), department: z.string().optional(),
  yearOfStudy: z.string().optional().refine((value) => !value || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10), 'Enter a year from 1 to 10.'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.').optional(),
  avatarUrl: z.string().optional().refine((value) => !value || /^https?:\/\/.+/.test(value), 'Enter a valid URL.'),
});
type ProfileValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: {
    firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', university: user?.university ?? '',
    department: user?.department ?? '', yearOfStudy: user?.yearOfStudy ? String(user.yearOfStudy) : '',
    bio: user?.bio ?? '', avatarUrl: user?.avatarUrl ?? '',
  } });
  const { reset } = form;
  useEffect(() => {
    reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', university: user?.university ?? '', department: user?.department ?? '', yearOfStudy: user?.yearOfStudy ? String(user.yearOfStudy) : '', bio: user?.bio ?? '', avatarUrl: user?.avatarUrl ?? '' });
  }, [user, reset]);
  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await updateProfile.mutateAsync({
        firstName: values.firstName, lastName: values.lastName,
        university: values.university || null, department: values.department || null,
        yearOfStudy: values.yearOfStudy ? Number(values.yearOfStudy) : null,
        bio: values.bio || null, avatarUrl: values.avatarUrl || null,
      });
      updateUser(result.user); toast('Profile updated.');
    } catch (error) {
      if (error instanceof ApiError) Object.entries(error.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof ProfileValues, { message: messages[0] }));
      toast(error instanceof ApiError ? error.message : 'Could not update your profile.', 'error');
    }
  });
  return <div className="mx-auto max-w-4xl space-y-7"><div><p className="text-sm font-medium text-brand-600">Account</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Your profile</h1><p className="mt-2 text-sm text-slate-500">Keep your personal and academic information up to date.</p></div>
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]"><Card className="flex flex-col items-center p-6 text-center"><Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} src={user?.avatarUrl} size="lg" /><h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</h2><p className="mt-1 text-xs text-slate-500">{user?.email}</p><span className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">{user?.role}</span><div className="mt-6 w-full border-t border-slate-100 pt-5 text-left dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Member since</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p></div></Card>
      <Card className="p-5 sm:p-7"><form onSubmit={submit} className="space-y-5" noValidate><div className="flex items-center gap-2"><UserRound className="size-4 text-brand-600" /><h2 className="font-semibold text-slate-900 dark:text-white">Personal information</h2></div><div className="grid gap-4 sm:grid-cols-2"><Field id="profile-first-name" label="First name" {...form.register('firstName')} error={form.formState.errors.firstName?.message} /><Field id="profile-last-name" label="Last name" {...form.register('lastName')} error={form.formState.errors.lastName?.message} /></div><Field id="profile-email" label="Email address" value={user?.email ?? ''} disabled readOnly hint="Email address cannot be changed." /><div className="grid gap-4 sm:grid-cols-2"><Field id="profile-university" label="University" placeholder="Your university" {...form.register('university')} /><Field id="profile-department" label="Department" placeholder="Your department" {...form.register('department')} /></div><div className="grid gap-4 sm:grid-cols-2"><Field id="profile-year" label="Year of study" type="number" min="1" max="10" placeholder="e.g. 2" {...form.register('yearOfStudy')} error={form.formState.errors.yearOfStudy?.message} /><Field id="profile-avatar" label="Avatar URL" type="url" placeholder="https://example.com/avatar.png" {...form.register('avatarUrl')} error={form.formState.errors.avatarUrl?.message} /></div><TextAreaField id="profile-bio" label="Bio" rows={4} maxLength={500} placeholder="Tell your groupmates a little about yourself…" {...form.register('bio')} error={form.formState.errors.bio?.message} /><div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800"><Button type="submit" disabled={form.formState.isSubmitting || updateProfile.isPending}><Save className="size-4" />{form.formState.isSubmitting || updateProfile.isPending ? 'Saving…' : 'Save changes'}</Button></div></form></Card>
    </div>
  </div>;
}
