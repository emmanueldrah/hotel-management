import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials } from '@/store/authSlice';
import type { ApiResponse, LoginResponse } from '@/types';

interface FormValues {
  email: string;
  password: string;
}

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@hms.com' },
  { label: 'Hotel Owner', email: 'owner@hms.com' },
  { label: 'Receptionist', email: 'receptionist@hms.com' },
  { label: 'Housekeeping', email: 'housekeeping@hms.com' },
  { label: 'Accountant', email: 'accountant@hms.com' },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    navigate('/dashboard');
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', values);
      const { user, accessToken, refreshToken } = res.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-brand-700 p-10 text-white md:flex">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/20">
              <Sparkles size={20} />
            </div>
            <span className="text-lg font-bold">HMS</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              Run your entire hotel from one place.
            </h2>
            <p className="mt-3 text-sm text-brand-100">
              Reservations, front desk, housekeeping, billing, restaurant POS, inventory, staff
              and analytics — built for single properties and multi-branch chains.
            </p>
          </div>
          <p className="text-xs text-brand-200">Enterprise Hotel Management System</p>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use a demo account or your credentials.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@hotel.com"
                {...register('email', { required: 'Email is required' })}
              />
              {formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">{formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              {formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">{formState.errors.password.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Demo accounts (password: Password123)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
