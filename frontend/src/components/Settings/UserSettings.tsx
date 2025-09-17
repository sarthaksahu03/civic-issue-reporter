import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Bell, Save, Camera, Shield, Settings as SettingsIcon } from 'lucide-react';

const UserSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    notificationPreferences: user?.notificationPreferences || {
      email: true,
      push: true,
      sms: false
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [name]: checkbox.checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
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
      notificationPreferences: user?.notificationPreferences || {
        email: true,
        push: true,
        sms: false
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center p-4">
      <form className="w-full max-w-4xl bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6 md:p-10 space-y-8" aria-label="User settings form">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">⚙️</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">User Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
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
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
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
                  <div className="w-20 h-20 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary dark:text-primary-dark" />
                  </div>
                  {isEditing && (
                    <button type="button" className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow border border-gray-200 hover:bg-gray-50 transition-colors">
                      <Camera className="h-4 w-4 text-gray-600" />
                    </button>
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
          {/* Side Section: Notifications and Stats */}
          <div className="space-y-8">
            <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="email"
                      checked={formData.notificationPreferences.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="push"
                      checked={formData.notificationPreferences.push}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">SMS Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive text messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="sms"
                      checked={formData.notificationPreferences.sms}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Account Stats</span>
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Account Type</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{new Date(user?.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserSettings;