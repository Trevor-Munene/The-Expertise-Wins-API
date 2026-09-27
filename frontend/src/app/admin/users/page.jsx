// frontend/src/app/admin/users/page.jsx
"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../api/admin.api";
import { formatDate } from "../../../lib/utils";
import toast from "react-hot-toast";
import { Users, Search, Shield, UserCheck, UserX, Edit3 } from "lucide-react";
import Modal from "../../../components/Modal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roleInput, setRoleInput] = useState("USER");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      const list = res?.users || res?.data || res || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error("Failed loading users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      loadUsers();
    } catch (err) {
      toast.error("Failed updating user status");
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminApi.updateUser(selectedUser.id, { role: roleInput });
      toast.success("User role updated successfully");
      setEditModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error("Failed updating user role");
    }
  };

  const filteredUsers = users.filter((u) => {
    const str = `${u.username} ${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Users & Role Management
          </h1>
          <p className="text-slate-400 text-xs">View all system users, assign roles, or suspend accounts.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 pl-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading users list...</div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-300">
                        {(u.username || u.email)[0].toUpperCase()}
                      </div>
                      <span>{u.username || "No Username"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === "SUSPENDED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {u.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setRoleInput(u.role || "USER");
                          setEditModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
                      >
                        Edit Role
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                          u.status === "SUSPENDED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        {u.status === "SUSPENDED" ? "Activate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No users found.</div>
        )}
      </div>

      {/* Role Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Update Role: ${selectedUser?.username || selectedUser?.email}`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="USER">USER (Standard Member)</option>
              <option value="TIPSTER">TIPSTER (Can post predictions)</option>
              <option value="EDITOR">EDITOR (Can curate predictions)</option>
              <option value="ADMIN">ADMIN (Full System Access)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Save Role Changes
          </button>
        </form>
      </Modal>
    </div>
  );
}
