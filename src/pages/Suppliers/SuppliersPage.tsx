import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { db, Supplier } from '../../db/db';
import { useToast } from '../../contexts/ToastContext';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const allSuppliers = await db.suppliers.toArray();
        setSuppliers(allSuppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        showToast('Failed to load suppliers', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [showToast]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      await db.suppliers.delete(id);
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
      showToast('Supplier deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showToast('Failed to delete supplier', 'error');
    }
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
        <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
        <Link
          to="/suppliers/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Supplier</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {supplier.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <Link
                      to={`/suppliers/edit/${supplier.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(supplier.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No suppliers found. Add your first supplier to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuppliersPage;