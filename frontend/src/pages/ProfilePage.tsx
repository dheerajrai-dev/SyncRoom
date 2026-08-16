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
import { Check, Edit2, LogOut } from 'lucide-react';
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

  const initialLetter = (user?.display_name?.trim() || user?.username?.trim() || 'U').charAt(0).toUpperCase() || 'U';

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1815] tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-[#5C574C]">
            Manage your account identity and preferences.
          </p>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-[10px] bg-[#E3F3E8] border border-[#1F8A4C]/20 flex items-center gap-2 text-xs text-[#1F8A4C]"
          >
            <Check className="w-4 h-4 text-[#1F8A4C]" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Profile Card (§9.5: Stacked form with initial-letter circle avatar) */}
        <Card className="form-card max-w-none flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {/* Initial-letter circle (§9.5) */}
            <div className="w-14 h-14 rounded-full bg-[#1A1815] text-[#FFFDF8] flex items-center justify-center text-xl font-bold font-mono shrink-0">
              {initialLetter}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#1A1815]">{user?.display_name || user?.username}</h2>
              <p className="text-xs text-[#8A8375] font-mono">@{user?.username}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E1D3] flex flex-col gap-4">
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Display Name"
                  placeholder="Your display name"
                  autoFocus
                  error={errors.display_name?.message}
                  {...register('display_name')}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                    className="text-xs text-[#8A8375] hover:text-[#1A1815]"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={updateMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F6F2E9] border border-[#E7E1D3]">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#8A8375]">Display Name</span>
                    <span className="text-sm font-semibold text-[#1A1815]">{user?.display_name || user?.username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-ghost text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F6F2E9] border border-[#E7E1D3]">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#8A8375]">Username</span>
                    <span className="text-sm font-semibold text-[#1A1815] font-mono">@{user?.username}</span>
                  </div>
                  <span className="text-xs text-[#8A8375]">Primary ID</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Log Out Band */}
        <div className="surface-card p-4 sm:p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-[#1A1815]">Log Out</h3>
            <p className="text-xs text-[#8A8375]">Sign out of your account on this browser.</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
