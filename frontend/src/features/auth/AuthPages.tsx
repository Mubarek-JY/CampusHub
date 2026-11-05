import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import { useAuth } from './AuthContext';
import { Logo } from '../../components/branding/Logo';

const loginSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Password is required.') });
type LoginValues = z.infer<typeof loginSchema>;
const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Password must be 72 characters or fewer.'),
  university: z.string().optional(), department: z.string().optional(),
  yearOfStudy: z.string().optional().refine((value) => !value || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10), 'Enter a year from 1 to 10.'),
});
type RegisterValues = z.infer<typeof registerSchema>;

function AuthShell({ children, title, subtitle, footer }: { children: ReactNode; title: string; subtitle: string; footer: ReactNode }) {
  return <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7fb] px-4 py-10 dark:bg-[#080d18]"><div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/20" /><div className="pointer-events-none absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/15" /><div className="relative w-full max-w-[460px]"><div className="mb-7 flex justify-center"><Logo href="/login" /></div><Card className="border-white/80 p-6 shadow-[0_24px_70px_-35px_rgba(15,23,42,.35)] sm:p-8"><div className="mb-7"><h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p></div>{children}</Card><p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p></div></div>;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const submit = form.handleSubmit(async (values) => {
    try { await signIn(values); toast('Welcome back.'); navigate((location.state as { from?: string } | null)?.from ?? '/app', { replace: true }); }
    catch (error) {
      if (error instanceof ApiError && error.fieldErrors) Object.entries(error.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof LoginValues, { message: messages[0] }));
      toast(error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.', 'error');
    }
  });
  return <AuthShell title="Welcome back" subtitle="Sign in to continue to your university workspace." footer={<>New to CampusHub? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">Create an account</Link></>}>
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field id="email" label="University email" type="email" autoComplete="email" placeholder="you@university.edu" {...form.register('email')} error={form.formState.errors.email?.message} />
      <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" {...form.register('password')} error={form.formState.errors.password?.message} />
      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Signing in…' : <>Sign in <ArrowRight className="size-4" /></>}</Button>
    </form>
  </AuthShell>;
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: '', lastName: '', email: '', password: '', university: '', department: '', yearOfStudy: '' } });
  const submit = form.handleSubmit(async (values) => {
    try {
      await signUp({ ...values, university: values.university || undefined, department: values.department || undefined, yearOfStudy: values.yearOfStudy ? Number(values.yearOfStudy) : undefined });
      toast('Your CampusHub account is ready.'); navigate('/app', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) Object.entries(error.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof RegisterValues, { message: messages[0] }));
      toast(error instanceof ApiError ? error.message : 'Unable to create your account.', 'error');
    }
  });
  return <AuthShell title="Create your account" subtitle="Join your classmates and keep your university work organized." footer={<>Already have an account? <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">Sign in</Link></>}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3"><Field id="firstName" label="First name" autoComplete="given-name" placeholder="First name" {...form.register('firstName')} error={form.formState.errors.firstName?.message} /><Field id="lastName" label="Last name" autoComplete="family-name" placeholder="Last name" {...form.register('lastName')} error={form.formState.errors.lastName?.message} /></div>
      <Field id="email" label="Email address" type="email" autoComplete="email" placeholder="you@university.edu" {...form.register('email')} error={form.formState.errors.email?.message} />
      <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...form.register('password')} error={form.formState.errors.password?.message} />
      <Field id="university" label="University (optional)" placeholder="Your university" {...form.register('university')} />
      <div className="grid grid-cols-2 gap-3"><Field id="department" label="Department" placeholder="e.g. Software Engineering" {...form.register('department')} /><Field id="yearOfStudy" label="Year of study" type="number" min="1" max="10" placeholder="e.g. 2" {...form.register('yearOfStudy')} error={form.formState.errors.yearOfStudy?.message} /></div>
      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating account…' : <>Create account <ArrowRight className="size-4" /></>}</Button>
    </form>
  </AuthShell>;
}
