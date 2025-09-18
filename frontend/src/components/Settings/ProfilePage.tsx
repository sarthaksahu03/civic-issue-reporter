import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState<string>(user?.name || '');
  const [email] = useState<string>(user?.email || '');
  const [notifEmail, setNotifEmail] = useState<boolean>(user?.notificationPreferences?.email ?? true);
  const [notifPush, setNotifPush] = useState<boolean>(user?.notificationPreferences?.push ?? false);
  const [notifSms, setNotifSms] = useState<boolean>(user?.notificationPreferences?.sms ?? false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-slate-500 mt-2">No user session.</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const ok = await updateProfile({
        name,
        notificationPreferences: {
          email: notifEmail,
          push: notifPush,
          sms: notifSms,
        },
      } as any);
      setSaving(false);
      setMsg(ok ? 'Profile updated successfully.' : 'Failed to update profile.');
    } catch (e) {
      setSaving(false);
      setMsg('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Profile</h1>
        <p className="text-slate-600 dark:text-slate-300">View and update your account information.</p>
      </header>

      <section className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="name">Full name</label>
            <input id="name" className="w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">Email</label>
            <input id="email" className="w-full" value={email} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
            <input className="w-full" value={user.role} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">User ID</label>
            <input className="w-full" value={user.id} disabled />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Notifications</h3>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} /> Email
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={notifPush} onChange={(e) => setNotifPush(e.target.checked)} /> Push
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={notifSms} onChange={(e) => setNotifSms(e.target.checked)} /> SMS
            </label>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">{msg}</div>}

        <div className="mt-6">
          <button onClick={handleSave} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
