import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  status: 'active' | 'inactive';
}

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    role: 'user',
    password: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = id !== 'new';

  useEffect(() => {
    if (isEditMode) {
      // TODO: Fetch user data from API
      setTimeout(() => {
        setUser({
          id: id || '',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          password: '',
          status: 'active'
        });
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement save/update API call
      console.log('Saving user:', user);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Users</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit User' : 'Add New User'}
        </h1>
        <div className="w-24"></div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={user.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={user.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={user.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {!isEditMode && (
              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={user.password}
                  onChange={handleChange}
                  required={!isEditMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              <Save className="h-5 w-5" />
              <span>{isSubmitting ? 'Saving...' : 'Save User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}