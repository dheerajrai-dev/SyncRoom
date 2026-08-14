import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { useUpdateProfile } from '../features/profile/hooks';
import { updateProfileSchema, type UpdateProfileFormData } from '../features/profile/schemas';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogOut, Check, Edit2, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const updateMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      display_name: user?.display_name || user?.username || '',
      avatar_url: user?.avatar_url || '',
    },
  });

  const onSubmit = async (formData: UpdateProfileFormData) => {
    try {
      await updateMutation.mutateAsync({
        display_name: formData.display_name,
        avatar_url: formData.avatar_url || undefined,
      });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your identity and session preferences.</p>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Profile Overview Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xl font-bold text-blue-300">
            {user?.display_name?.charAt(0).toUpperCase() || user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.display_name || user?.username}</h2>
            <p className="text-xs text-slate-400 font-mono">@{user?.username}</p>
          </div>
        </div>

        {/* Details and Edit Form */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Display Name"
                placeholder="Your display name"
                error={errors.display_name?.message}
                {...register('display_name')}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs text-slate-400">Display Name</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{user?.display_name || user?.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs text-slate-400">Username</p>
                  <p className="text-sm font-semibold text-white mt-0.5 font-mono">@{user?.username}</p>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Primary Handle
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Log Out Section */}
      <Card className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Log Out</h3>
          <p className="text-xs text-slate-400 mt-0.5">End your account session on this device.</p>
        </div>
        <Button variant="danger" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
