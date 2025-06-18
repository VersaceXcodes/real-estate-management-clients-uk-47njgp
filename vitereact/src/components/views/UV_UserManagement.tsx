import React, { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

// Define User interface based on the provided schema
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Payload interfaces for creating and updating a user
interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

const UV_UserManagement: React.FC = () => {
  // Global auth state (includes JWT token)
  const auth = useAppStore((state) => state.auth);

  // Local state for search and pagination
  const [userSearch, setUserSearch] = useState<string>("");
  const [pagination, setPagination] = useState<{ limit: number; offset: number }>({ limit: 10, offset: 0 });

  // Local state for modals and form data for add/edit user
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    role: "Agent", // default role (can be Admin, Agent, Support)
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  // React Query client for refetching queries after mutations
  const queryClient = useQueryClient();

  // Base URL for API calls
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch users query function
  const fetchUsers = async (): Promise<User[]> => {
    const response = await axios.get(`${baseUrl}/api/users`, {
      params: {
        query: userSearch,
        limit: pagination.limit,
        offset: pagination.offset,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    return response.data;
  };

  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[], Error>(["users", userSearch, pagination.limit, pagination.offset], fetchUsers, { keepPreviousData: true });

  // Mutation for adding a user
  const addUserMutation = useMutation<User, Error, CreateUserPayload>(
    async (newUser) => {
      const response = await axios.post(`${baseUrl}/api/users`, newUser, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
        setShowAddModal(false);
        setFormData({ username: "", email: "", password: "", role: "Agent" });
        setErrorMessage("");
      },
      onError: (err: Error) => {
        setErrorMessage(`Failed to add user: ${err.message}`);
      }
    }
  );

  // Mutation for editing a user
  const editUserMutation = useMutation<User, Error, { id: string; payload: UpdateUserPayload }>(
    async ({ id, payload }) => {
      const response = await axios.put(`${baseUrl}/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ username: "", email: "", password: "", role: "Agent" });
        setErrorMessage("");
      },
      onError: (err: Error) => {
        setErrorMessage(`Failed to update user: ${err.message}`);
      }
    }
  );

  // Mutation for deleting a user
  const deleteUserMutation = useMutation<void, Error, string>(
    async (userId) => {
      await axios.delete(`${baseUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["users"]);
        setErrorMessage("");
      },
      onError: (err: Error) => {
        setErrorMessage(`Failed to delete user: ${err.message}`);
      }
    }
  );

  // Handler for opening the add user modal
  const openAddModal = () => {
    setFormData({ username: "", email: "", password: "", role: "Agent" });
    setShowAddModal(true);
  };

  // Handler for opening the edit user modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ username: user.username, email: user.email, password: "", role: user.role });
    setShowEditModal(true);
  };

  // Handler for form submission for add/edit
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (showAddModal) {
      if (!formData.username || !formData.email || !formData.password || !formData.role) return;
      addUserMutation.mutate(formData);
    } else if (showEditModal && selectedUser) {
      const payload: UpdateUserPayload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      editUserMutation.mutate({ id: selectedUser.id, payload });
    }
  };

  // Handler for delete user confirmation
  const handleDeleteUser = (userId: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Handler for search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
  };

  // Pagination handlers
  const handleNextPage = () => {
    setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({ ...prev, offset: Math.max(prev.offset - prev.limit, 0) }));
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User & Role Management</h1>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage("")} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              &times;
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <input
              type="text"
              placeholder="Search by username or role..."
              value={userSearch}
              onChange={handleSearchChange}
              className="border rounded px-3 py-2 mr-2"
            />
            <button onClick={() => refetch()} className="bg-blue-500 text-white px-4 py-2 rounded">
              Search
            </button>
          </div>
          <button onClick={openAddModal} className="bg-green-500 text-white px-4 py-2 rounded">
            Add User
          </button>
        </div>
        {isLoading ? (
          <p>Loading users...</p>
        ) : isError ? (
          <p className="text-red-500">Error loading users: {(error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Username</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Role</th>
                  <th className="px-4 py-2 border">Created At</th>
                  <th className="px-4 py-2 border">Updated At</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="text-center">
                      <td className="px-4 py-2 border">{user.username}</td>
                      <td className="px-4 py-2 border">{user.email}</td>
                      <td className="px-4 py-2 border">{user.role}</td>
                      <td className="px-4 py-2 border">{user.created_at}</td>
                      <td className="px-4 py-2 border">{user.updated_at}</td>
                      <td className="px-4 py-2 border space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2 border text-center" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-between mt-4">
          <button onClick={handlePrevPage} disabled={pagination.offset === 0} className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50">
            Previous
          </button>
          <button onClick={handleNextPage} className="bg-gray-500 text-white px-4 py-2 rounded">
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded shadow-lg w-11/12 sm:w-1/2 p-6">
            <h2 className="text-xl font-bold mb-4">{showAddModal ? "Add New User" : "Edit User"}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Username:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{showAddModal ? "Password:" : "Password (leave blank to keep unchanged):"}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  // required for add, optional for edit
                  required={showAddModal}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="Agent">Agent</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormData({ username: "", email: "", password: "", role: "Agent" });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                  {showAddModal ? "Add User" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_UserManagement;