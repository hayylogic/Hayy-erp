import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PurchaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/purchases')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Purchase Details</h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Purchase #{id}</p>
        {/* Purchase details content will be implemented later */}
      </div>
    </div>
  );
};

export default PurchaseDetailsPage;