import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { User, RoleType } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  X, 
  ShieldCheck 
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [roleId, setRoleId] = useState<number>(2); // 2 = supervisor

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get(`/admin/users${search ? `?search=${search}` : ''}`);
      setUsers(res.data);
    } catch (e) {
      console.error('Error loading users', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setEmail('');
    setUsername('');
    setFullName('');
    setPassword('');
    setRoleId(2);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setUsername(user.username);
    setFullName(user.full_name);
    setPassword('');
    setRoleId(user.role_id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        await apiClient.put(`/admin/users/${editingUser.id}`, {
          email,
          username,
          full_name: fullName,
          role_id: roleId,
          ...(password ? { password } : {})
        });
      } else {
        // Create user
        await apiClient.post('/admin/users', {
          email,
          username,
          full_name: fullName,
          password: password || 'default123',
          role_id: roleId,
          is_active: true
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Error saving user record');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Error deactivating user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2E4E] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>User & Access Authorization Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure system operators, assign mine site scopes & role-based permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="mission-card p-3 flex items-center space-x-3 bg-[#080D1A]">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, email or full name..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="mission-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#090F20] text-slate-400 font-mono border-b border-[#1E2E4E]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Full Name & Username</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2640] font-mono">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#0E172A]">
                  <td className="p-3 text-slate-400">#{u.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-white font-sans text-xs">{u.full_name}</div>
                    <div className="text-[11px] text-cyan-400">@{u.username}</div>
                  </td>
                  <td className="p-3 text-slate-300">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role?.name === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      u.role?.name === 'supervisor' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {u.role?.name || 'USER'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {new Date(u.created_at || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 rounded-lg bg-[#080D1A] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Edit User Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {u.is_active && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="p-1.5 rounded-lg bg-[#080D1A] hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                        title="Deactivate User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0D1527] border border-[#1E2E4E] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingUser ? `Edit User: ${editingUser.username}` : 'Create New System User'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 font-mono uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 font-mono uppercase">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. jdoe"
                  className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 font-mono uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jdoe@miningrover.com"
                  className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 font-mono uppercase">
                  {editingUser ? 'New Password (leave blank to retain)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Enter password'}
                  className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 font-mono uppercase">System Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full bg-[#080D1A] border border-[#1E2E4E] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>Admin (Full Access)</option>
                  <option value={2}>Mine Supervisor (Operations)</option>
                  <option value={3}>Higher Authority (Inspection)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E2E4E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Save User Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
