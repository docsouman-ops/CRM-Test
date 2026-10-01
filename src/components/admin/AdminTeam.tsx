import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Compass,
  PhoneCall,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role, User } from '../../types';
import { hashPassword } from '../../services/crypto';

export const AdminTeam: React.FC = () => {
  const { users, addUser, updateUser, resetUserPassword } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Add form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('telecaller');
  const [phone, setPhone] = useState('');

  const roleMeta: Record<Role, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrator', icon: Shield, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    backoffice: { label: 'Back Office', icon: Briefcase, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    telecaller: { label: 'Telecaller', icon: PhoneCall, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    surveyor: { label: 'Surveyor', icon: Compass, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      alert('Name, username and initial password are required.');
      return;
    }

    const hash = await hashPassword(password);
    const success = await addUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hash,
      role,
      active: true,
      phone: phone.trim(),
      mustChangePassword: false,
    });

    if (!success) {
      alert('Username already exists. Please choose a different username.');
      return;
    }

    setShowAddModal(false);
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordInput) return;
    if (newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    await resetUserPassword(selectedUserForReset.id, newPasswordInput);
    setShowResetModal(false);
    setSelectedUserForReset(null);
    setNewPasswordInput('');
    alert(`Password reset successfully for @${selectedUserForReset.username}!`);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Team Members ({users.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage roles, access, and credentials for all employees
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs min-h-[44px]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map((user) => {
          const meta = roleMeta[user.role] || roleMeta.telecaller;
          const RoleIcon = meta.icon;

          return (
            <div
              key={user.id}
              className={`p-4 rounded-2xl bg-white border transition shadow-2xs space-y-3 ${
                user.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${meta.color}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{meta.label}</span>
                </span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">+91 {user.phone}</span>
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  />
                  <span className="text-[11px] font-medium text-slate-500">
                    {user.active ? 'Active Account' : 'Deactivated'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedUserForReset(user);
                      setShowResetModal(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Reset Password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => updateUser(user.id, { active: !user.active })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      user.active
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Team Member</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Login Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rahul"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Role Assignment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="telecaller">Telecaller (Calls, Logs, Checklist)</option>
                  <option value="backoffice">Back Office (Assigns Surveyors, Lead review)</option>
                  <option value="surveyor">Surveyor (Site Visits, Technical review)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Reset Password for {selectedUserForReset.name}
            </h3>
            <p className="text-xs text-slate-500">
              Username: <strong className="font-mono">@{selectedUserForReset.username}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
