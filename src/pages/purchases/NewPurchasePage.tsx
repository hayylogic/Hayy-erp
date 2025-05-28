import React from 'react';
import { useNavigate } from 'react-router-dom';

const NewPurchasePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
        <p className="mt-1 text-sm text-gray-600">Create a new purchase order</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-6">
          {/* Form fields will be implemented based on requirements */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPurchasePage;