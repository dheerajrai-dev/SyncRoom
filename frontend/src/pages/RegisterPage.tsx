import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../features/auth/schemas';
import { useAuth } from '../features/auth/hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { UserPlus, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      await registerUser(data.username, data.password);
      // Auto login after registration
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'username_taken' || err.status === 409) {
        setServerError('That username is already taken. Please choose another.');
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="center-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="form-card">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create an Account</h2>
            <p className="text-xs text-slate-400">
              Save chat history and maintain persistent session ownership.
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="e.g. alex_dev"
              autoFocus
              leftIcon={<User className="w-4 h-4" />}
              helperText="3 to 32 characters, letters, numbers, and underscores."
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Password strength requirement checklist */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-[11px]">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    passwordValue.length >= 10 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span className={passwordValue.length >= 10 ? 'text-slate-200' : 'text-slate-400'}>
                  At least 10 characters
                </span>
              </div>
            </div>

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
