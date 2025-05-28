import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (id) {
      // TODO: Fetch customer data if editing
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement save functionality
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {id ? 'Edit Customer' : 'Add New Customer'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}