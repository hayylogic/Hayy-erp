import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = id !== 'new';

  useEffect(() => {
    if (isEditMode) {
      // TODO: Fetch supplier data from API
      // Mock data for now
      setTimeout(() => {
        setSupplier({
          id: id || '',
          name: 'ABC Wholesale',
          email: 'contact@abc.com',
          phone: '555-123-4567',
          address: '123 Business Rd, Industrial Park'
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
      console.log('Saving supplier:', supplier);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      navigate('/suppliers');
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplier(prev => ({ ...prev, [name]: value }));
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
          onClick={() => navigate('/suppliers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Suppliers</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
        </h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={supplier.name}
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
                value={supplier.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={supplier.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={supplier.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              <Save className="h-5 w-5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}