import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../features/auth/schemas';
import { useAuth } from '../features/auth/hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md"
      >
        <Card className="form-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-2xl font-bold text-[#1A1815] tracking-tight">Create Account</h2>
            <p className="text-sm text-[#5C574C]">
              Optional account to save chat logs and view past session history.
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded-[10px] bg-[#FBEAE6] border border-[#C23B2E]/20 flex items-center gap-2 text-xs text-[#C23B2E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="e.g. alex_dev"
              autoFocus
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              type="password"
              label="Password"
              placeholder="At least 10 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          {/* Equal weight links (§9.2) */}
          <div className="pt-3 border-t border-[#E7E1D3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link to="/login" className="text-[#D9720F] hover:underline font-medium">
              Already have an account? Sign In
            </Link>
            <Link to="/" className="text-[#8A8375] hover:text-[#1A1815] transition-colors">
              Continue as Guest →
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
