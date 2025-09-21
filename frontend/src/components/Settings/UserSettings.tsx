import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Bell, Save, Camera, Shield, Settings as SettingsIcon, Moon, Sun, Monitor, Contrast, Type, MessageSquare, ClipboardList } from 'lucide-react';

const UserSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    // Notification preferences broken down by type
    notifications: {
      grievanceStatus: {
        email: user?.notificationPreferences?.email ?? true,
        sms: user?.notificationPreferences?.sms ?? false,
        inApp: user?.notificationPreferences?.push ?? true,
      },
      adminMessages: {
        email: user?.notificationPreferences?.email ?? true,
        sms: user?.notificationPreferences?.sms ?? false,
        inApp: user?.notificationPreferences?.push ?? true,
      },
    },
    // Theme & accessibility
    theme: 'system', // 'light' | 'dark' | 'system'
    fontScale: 'normal', // 'normal' | 'large'
    highContrast: false,
  });

  // Helper to apply appearance to document
  const applyAppearance = (theme: 'light' | 'dark' | 'system', fontScale: 'normal' | 'large', highContrast: boolean) => {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', shouldDark);
      document.documentElement.classList.toggle('a11y-font-large', fontScale === 'large');
      document.documentElement.classList.toggle('a11y-contrast', !!highContrast);
    } catch {}
  };

  // Load persisted theme/accessibility on mount
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem('app_theme') || 'system') as 'light' | 'dark' | 'system';
      const storedFont = (localStorage.getItem('app_font_scale') || 'normal') as 'normal' | 'large';
      const storedContrast = localStorage.getItem('app_high_contrast') === 'true';
      setFormData((prev: any) => ({ ...prev, theme: storedTheme, fontScale: storedFont, highContrast: storedContrast }));
      // Ensure applied on page load
      applyAppearance(storedTheme, storedFont, storedContrast);
    } catch {}
  }, []);

  // Live preview while editing these settings
  useEffect(() => {
    if (isEditing) {
      applyAppearance(formData.theme, formData.fontScale, formData.highContrast);
    }
  }, [isEditing, formData.theme, formData.fontScale, formData.highContrast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      // Generic checkbox for top-level keys
      setFormData((prev: any) => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Toggle per-type notification preferences
  const toggleNotify = (group: 'grievanceStatus' | 'adminMessages', channel: 'email' | 'sms' | 'inApp') => {
    setFormData((prev: any) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [group]: {
          ...prev.notifications[group],
          [channel]: !prev.notifications[group][channel],
        },
      },
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData((prev: any) => ({ ...prev, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Backward-compatible payload expected by backend/User type
      const updates = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        avatar: formData.avatar,
        notificationPreferences: {
          email: !!(formData.notifications?.grievanceStatus?.email || formData.notifications?.adminMessages?.email),
          push: !!(formData.notifications?.grievanceStatus?.inApp || formData.notifications?.adminMessages?.inApp),
          sms: !!(formData.notifications?.grievanceStatus?.sms || formData.notifications?.adminMessages?.sms),
        },
      } as any;
      const success = await updateProfile(updates);
      if (success) {
        // Persist appearance settings
        try {
          localStorage.setItem('app_theme', formData.theme);
          localStorage.setItem('app_font_scale', formData.fontScale);
          localStorage.setItem('app_high_contrast', String(!!formData.highContrast));
        } catch {}
        // Ensure applied after save
        applyAppearance(formData.theme, formData.fontScale, formData.highContrast);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar: user?.avatar || '',
      notifications: {
        grievanceStatus: {
          email: user?.notificationPreferences?.email ?? true,
          sms: user?.notificationPreferences?.sms ?? false,
          inApp: user?.notificationPreferences?.push ?? true,
        },
        adminMessages: {
          email: user?.notificationPreferences?.email ?? true,
          sms: user?.notificationPreferences?.sms ?? false,
          inApp: user?.notificationPreferences?.push ?? true,
        },
      },
      theme: 'system',
      fontScale: 'normal',
      highContrast: false,
    });
    setIsEditing(false);
    // Re-apply persisted appearance (revert any preview changes)
    try {
      const t = (localStorage.getItem('app_theme') || 'system') as 'light' | 'dark' | 'system';
      const f = (localStorage.getItem('app_font_scale') || 'normal') as 'normal' | 'large';
      const hc = localStorage.getItem('app_high_contrast') === 'true';
      applyAppearance(t, f, hc);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark px-4 md:px-6 lg:px-8 py-6 md:py-10">
      <form className="w-full max-w-6xl mx-auto space-y-10" aria-label="User settings form">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">⚙️</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage your profile, notifications, and accessibility preferences.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </h2>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>
              {/* Avatar Section */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-primary dark:text-primary-dark" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow border border-gray-200 dark:border-slate-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <Camera className="h-4 w-4 text-gray-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user?.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 capitalize">{user?.role}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member since {new Date(user?.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
              {/* Form Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="+1-555-0123"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={user?.role || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Enter your address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Side Section: Notifications and Theme */}
          <div className="space-y-8">
            {/* Notifications */}
            <div className="p-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </h2>
              <div className="space-y-6">
                {/* Grievance Status */}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4" />
                    <h3 className="font-medium">Grievance Status</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('grievanceStatus', 'email')} className={`px-3 py-2 rounded-md border ${formData.notifications.grievanceStatus.email ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Mail className="inline h-4 w-4 mr-1" /> Email
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('grievanceStatus', 'sms')} className={`px-3 py-2 rounded-md border ${formData.notifications.grievanceStatus.sms ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <MessageSquare className="inline h-4 w-4 mr-1" /> SMS
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('grievanceStatus', 'inApp')} className={`px-3 py-2 rounded-md border ${formData.notifications.grievanceStatus.inApp ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Bell className="inline h-4 w-4 mr-1" /> In-app
                    </button>
                  </div>
                </div>
                {/* Admin Messages */}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-medium">Admin Messages</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('adminMessages', 'email')} className={`px-3 py-2 rounded-md border ${formData.notifications.adminMessages.email ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Mail className="inline h-4 w-4 mr-1" /> Email
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('adminMessages', 'sms')} className={`px-3 py-2 rounded-md border ${formData.notifications.adminMessages.sms ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <MessageSquare className="inline h-4 w-4 mr-1" /> SMS
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => toggleNotify('adminMessages', 'inApp')} className={`px-3 py-2 rounded-md border ${formData.notifications.adminMessages.inApp ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Bell className="inline h-4 w-4 mr-1" /> In-app
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme & Accessibility */}
            <div className="p-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Theme & Accessibility</span>
              </h2>
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button type="button" disabled={!isEditing} onClick={() => setFormData((p: any) => ({ ...p, theme: 'system' }))} className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${formData.theme === 'system' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Monitor className="h-4 w-4" /> System
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => setFormData((p: any) => ({ ...p, theme: 'light' }))} className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${formData.theme === 'light' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Sun className="h-4 w-4" /> Light
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => setFormData((p: any) => ({ ...p, theme: 'dark' }))} className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${formData.theme === 'dark' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Moon className="h-4 w-4" /> Dark
                    </button>
                  </div>
                </div>
                {/* Font size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={!isEditing} onClick={() => setFormData((p: any) => ({ ...p, fontScale: 'normal' }))} className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${formData.fontScale === 'normal' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Type className="h-4 w-4" /> Normal
                    </button>
                    <button type="button" disabled={!isEditing} onClick={() => setFormData((p: any) => ({ ...p, fontScale: 'large' }))} className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${formData.fontScale === 'large' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'}`}>
                      <Type className="h-5 w-5" /> Large
                    </button>
                  </div>
                </div>
                {/* High contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Contrast className="h-4 w-4" />
                      High Contrast
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better readability</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="highContrast" checked={!!formData.highContrast} onChange={handleInputChange} disabled={!isEditing} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Divider */}
        <hr className="border-slate-200 dark:border-slate-700" />
        {/* Sticky bottom actions */}
        <div className="sticky bottom-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-end gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-md p-3 shadow border border-slate-200 dark:border-slate-700">
            <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserSettings;