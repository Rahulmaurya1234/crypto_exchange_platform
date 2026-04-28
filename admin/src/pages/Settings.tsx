import React, { useState, useEffect } from 'react';
import { Users, Lock, Bell, Shield } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Tab, Tabs, TabContent } from '../components/common/Tabs';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel, getRoleBadgeColor, PERMISSIONS } from '../utils/permissions';
import { useUpdateAdminProfileMutation, useChangeAdminPasswordMutation } from '../store/api/adminApi';
import { setUser } from '../store/slices/authSlice';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('profile');

  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateAdminProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangeAdminPasswordMutation();

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await updateProfile({ name }).unwrap();
      dispatch(setUser(res.data.user));
      toast.success('Profile updated successfully');
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword }).unwrap();
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your admin account and preferences</p>
      </div>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <Tab id="profile" label="Profile" icon={<Users className="w-4 h-4" />} />
          <Tab id="security" label="Security" icon={<Lock className="w-4 h-4" />} />
          <Tab id="permissions" label="Permissions" icon={<Shield className="w-4 h-4" />} />
          <Tab id="notifications" label="Notifications" icon={<Bell className="w-4 h-4" />} />
        </div>

        <TabContent id="profile" active={activeTab === 'profile'}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{user?.name?.charAt(0) || 'A'}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium mt-1 ${getRoleBadgeColor(user?.role!)}`}>
                      {getRoleLabel(user?.role!)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                  <Input 
                    label="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  <Input label="Email Address" value={user?.email || ''} disabled />
                  <Input label="Account Status" value={user?.isActive ? 'Active' : 'Inactive'} disabled />
                  <Input
                    label="Member Since"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    disabled
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="primary" type="submit" isLoading={isUpdatingProfile}>
                    Update Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent id="security" active={activeTab === 'security'}>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    For security reasons, password changes must be performed through your account settings in a secure environment.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="primary" type="submit" isLoading={isChangingPassword}>
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent id="permissions" active={activeTab === 'permissions'}>
          <Card>
            <CardHeader>
              <CardTitle>Your Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PERMISSIONS).map(([permission, allowedRoles]) => {
                  const hasAccess = allowedRoles.includes(user?.role!);
                  return (
                    <div key={permission} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{permission.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500">
                           Allowed for: {allowedRoles.map((r) => getRoleLabel(r as any)).join(', ')}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        hasAccess
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasAccess ? 'Granted' : 'Denied'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent id="notifications" active={activeTab === 'notifications'}>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Disputes</p>
                    <p className="text-sm text-gray-500">Get notified when new disputes are created</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Pending KYCs</p>
                    <p className="text-sm text-gray-500">Get notified about new KYC submissions</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Support Tickets</p>
                    <p className="text-sm text-gray-500">Get notified about new support tickets</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button variant="primary">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>
    </div>
  );
};
