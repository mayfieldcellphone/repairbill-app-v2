import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Mail, 
  Calendar,
  MoreVertical,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../lib/types';
import { subscribeToDocuments, saveDocument, removeDocument } from '../lib/firestore';
import { cn } from '@/lib/utils';

export function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  useEffect(() => {
    return subscribeToDocuments<AppUser>('users', (data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: AppUser['status']) => {
    const user = users.find(u => u.uid === userId);
    if (!user) return;

    try {
      await saveDocument('users', userId, { ...user, status: newStatus });
    } catch (error) {
      console.error('Failed to update user status', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await removeDocument('users', userId);
        // Also remove from admins if they were there
        await removeDocument('admins', userId);
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  const getStatusColor = (status: AppUser['status']) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'suspended': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium text-sm">Approve, restrict, and manage platform access</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
           <Users size={18} className="text-blue-600" />
           <span className="text-sm font-black text-slate-800">{users.length} Users Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr 
                      key={user.uid}
                      className={cn(
                        "group hover:bg-slate-50/50 transition-colors cursor-pointer",
                        selectedUser?.uid === user.uid && "bg-blue-50/30"
                      )}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">
                              {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate">{user.displayName || 'No Name'}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          user.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600"
                        )}>
                          <Shield size={10} />
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          getStatusColor(user.status)
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-slate-400 italic">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details / Actions Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                key={selectedUser.uid}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-8 text-center border-b border-slate-50 space-y-4">
                  <div className="relative inline-block">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-24 h-24 rounded-[32px] object-cover ring-8 ring-slate-50" />
                    ) : (
                      <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-400 font-black text-3xl ring-8 ring-slate-50">
                        {selectedUser.displayName?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center",
                      selectedUser.status === 'active' ? "bg-emerald-500" : selectedUser.status === 'pending' ? "bg-amber-500" : "bg-red-500"
                    )}>
                       {selectedUser.status === 'active' ? <CheckCircle size={14} className="text-white" /> : selectedUser.status === 'pending' ? <Calendar size={14} className="text-white" /> : <XCircle size={14} className="text-white" />}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedUser.displayName || 'No Name'}</h2>
                    <p className="text-slate-400 font-bold text-sm">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-1">Account Actions</p>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedUser.status !== 'active' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedUser.uid, 'active')}
                          className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-100 transition-all group"
                        >
                          Approve Account
                          <CheckCircle size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      {selectedUser.status === 'active' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedUser.uid, 'suspended')}
                          className="w-full flex items-center justify-between p-4 bg-amber-50 text-amber-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-100 transition-all group"
                        >
                          Suspend Access
                          <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(selectedUser.uid)}
                        className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all group"
                      >
                        Delete Permanently
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select a user to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
