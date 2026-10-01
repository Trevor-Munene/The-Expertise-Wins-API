// frontend/src/app/admin/users/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../../api/admin.api";
import { formatDate } from "../../../lib/utils";
import Modal from "../../../components/Modal";

const ROLE_OPTIONS = [
  {
    value: "USER",
    label: "USER",
    description: "Standard member",
  },
  {
    value: "TIPSTER",
    label: "TIPSTER",
    description: "Can post predictions",
  },
  {
    value: "EDITOR",
    label: "EDITOR",
    description: "Can curate predictions",
  },
  {
    value: "ADMIN",
    label: "ADMIN",
    description: "Full system access",
  },
];

const inputClassName =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20";

function getUsers(response) {
  const list =
    response?.users ??
    response?.data ??
    response ??
    [];

  return Array.isArray(list) ? list : [];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [roleInput, setRoleInput] = useState("USER");
  const [savingRole, setSavingRole] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await adminApi.getUsers();
      setUsers(getUsers(response));
    } catch (error) {
      console.error("Failed loading users", error);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus =
      user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

    const action =
      newStatus === "SUSPENDED" ? "suspend" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${
        user.username || user.email
      }?`
    );

    if (!confirmed) return;

    setUpdatingStatusId(user.id);

    try {
      await adminApi.updateUserStatus(user.id, newStatus);

      toast.success(
        `${user.username || user.email} is now ${newStatus.toLowerCase()}`
      );

      await loadUsers();
    } catch (error) {
      console.error("Failed updating user status", error);
      toast.error("Failed to update user status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setRoleInput(user.role || "USER");
    setEditModalOpen(true);
  };

  const closeRoleModal = () => {
    if (savingRole) return;

    setEditModalOpen(false);
    setSelectedUser(null);
    setRoleInput("USER");
  };

  const handleUpdateRole = async (event) => {
    event.preventDefault();

    if (!selectedUser) return;

    if (roleInput === selectedUser.role) {
      closeRoleModal();
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedUser.username || selectedUser.email}'s role from ${
        selectedUser.role || "USER"
      } to ${roleInput}?`
    );

    if (!confirmed) return;

    setSavingRole(true);

    try {
      await adminApi.updateUser(selectedUser.id, {
        role: roleInput,
      });

      toast.success("User role updated successfully");

      closeRoleModal();
      await loadUsers();
    } catch (error) {
      console.error("Failed updating user role", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update user role"
      );
    } finally {
      setSavingRole(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const searchableText = [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-400" />

            <h1 className="text-2xl font-black text-slate-100">
              Users & Role Management
            </h1>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Manage accounts, roles, and access status.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>

          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />

          <input
            id="user-search"
            type="search"
            placeholder="Search email or username..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3.5 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "users"}
            {searchTerm.trim() ? " found" : ""}
          </span>

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="font-semibold text-sky-400 hover:text-sky-300"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading ? (
          <div
            role="status"
            className="p-10 text-center text-xs text-slate-400"
          >
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-600" />

            <h2 className="mt-3 text-sm font-bold text-slate-300">
              {searchTerm
                ? "No matching users"
                : "No users found"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {searchTerm
                ? "Try a different search term."
                : "There are currently no users to display."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    User
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Role
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const isSuspended =
                    user.status === "SUSPENDED";

                  const isUpdatingStatus =
                    updatingStatusId === user.id;

                  const displayName =
                    user.username ||
                    user.email ||
                    "Unknown User";

                  const initial =
                    displayName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-800/30"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300">
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-100">
                              {displayName}
                            </div>

                            {(user.firstName ||
                              user.lastName) && (
                              <div className="truncate text-[10px] text-slate-500">
                                {[
                                  user.firstName,
                                  user.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-400">
                        {user.email || "—"}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                          <Shield className="h-3 w-3" />
                          {user.role || "USER"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${
                            isSuspended
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {isSuspended ? (
                            <UserX className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}

                          {user.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-slate-500">
                        {user.createdAt
                          ? formatDate(user.createdAt)
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openRoleModal(user)
                            }
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          >
                            Edit Role
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(user)
                            }
                            disabled={isUpdatingStatus}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSuspended
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            }`}
                          >
                            {isUpdatingStatus
                              ? "Updating..."
                              : isSuspended
                              ? "Activate"
                              : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeRoleModal}
        title={`Update Role: ${
          selectedUser?.username ||
          selectedUser?.email ||
          "User"
        }`}
      >
        <form
          onSubmit={handleUpdateRole}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="user-role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Select Role
            </label>

            <select
              id="user-role"
              value={roleInput}
              onChange={(event) =>
                setRoleInput(event.target.value)
              }
              disabled={savingRole}
              className={inputClassName}
            >
              {ROLE_OPTIONS.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label} — {role.description}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-400">
            Role changes affect what this account can access.
            Admin permissions should only be granted to trusted
            accounts.
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeRoleModal}
              disabled={savingRole}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                savingRole ||
                roleInput === selectedUser?.role
              }
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingRole
                ? "Saving..."
                : "Save Role Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
