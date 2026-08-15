import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../features/auth/schemas';
import { useAuth } from '../features/auth/hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await login(data.username, data.password);
      navigate(redirectUrl);
    } catch (err: any) {
      if (err.message === 'invalid_credentials') {
        setServerError('Invalid username or password.');
      } else {
        setServerError(err.message || 'An error occurred during sign in.');
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
            <h2 className="text-2xl font-bold text-[#1A1815] tracking-tight">Sign In</h2>
            <p className="text-sm text-[#5C574C]">
              Access saved rooms, archived history, and account settings.
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
              label="Username or Email"
              placeholder="e.g. alex"
              autoFocus
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          {/* Equal weight links (§9.1: visually equal weight links) */}
          <div className="pt-3 border-t border-[#E7E1D3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link to="/register" className="text-[#D9720F] hover:underline font-medium">
              Don't have an account? Sign Up
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
