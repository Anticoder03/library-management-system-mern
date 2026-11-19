import { useState } from 'react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar, Badge, FormField, PageHeader } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await api.put('/auth/profile', profile);
      updateUser(data.data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader breadcrumb="Account" title="Profile & Settings" subtitle="Manage your personal information and password." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card h-fit p-6 text-center">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <h2 className="mt-4 text-lg font-extrabold text-ink-900">{user?.name}</h2>
          <p className="text-xs text-ink-500">{user?.email}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Badge status={user?.role} />
            <Badge status={user?.membershipStatus} />
          </div>
          <div className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-ink-500">Student ID</span>
              <strong className="text-ink-800">{user?.studentId || '—'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Member since</span>
              <strong className="text-ink-800">{formatDate(user?.membershipDate)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Account type</span>
              <strong className="capitalize text-ink-800">{user?.role}</strong>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <form className="card p-6" onSubmit={saveProfile}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Personal information</h2>
                <p className="text-xs text-ink-500">Update your contact details.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Full name">
                <input className="input" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              </FormField>
              <FormField label="Phone number">
                <input className="input" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
              </FormField>
              <FormField label="Avatar URL" className="sm:col-span-2">
                <input className="input" value={profile.avatar} onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} placeholder="https://example.com/avatar.jpg" />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <textarea className="input min-h-[90px]" value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save className="h-4 w-4" /> Save changes
              </button>
            </div>
          </form>

          <form className="card p-6" onSubmit={changePassword}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Change password</h2>
                <p className="text-xs text-ink-500">Use a strong password you haven't used before.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Current password">
                <input className="input" type="password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} />
              </FormField>
              <FormField label="New password">
                <input className="input" type="password" minLength={8} required value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" className="btn-secondary" disabled={saving}>Update password</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
