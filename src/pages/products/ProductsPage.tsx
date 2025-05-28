import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash, AlertTriangle } from 'lucide-react';
import { db, Product } from '../../db/db';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const { showToast } = useToast();
  const { isManager } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await db.products.toArray();
        setProducts(allProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(allProducts.map(product => product.category)));
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products', 'error');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [showToast]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await db.products.delete(id);
        setProducts(products.filter(product => product.id !== id));
        showToast('Product deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
        
        {isManager() && (
          <Link
            to="/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </Link>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-48">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm ${product.stock <= product.lowStockAlert ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {product.stock}
                            </div>
                            {product.stock <= product.lowStockAlert && (
                              <AlertTriangle size={16} className="ml-1 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.barcode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isManager() && (
                            <div className="flex justify-end space-x-2">
                              <Link
                                to={`/products/edit/${product.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit size={18} />
                              </Link>
                              <button
                                onClick={() => handleDelete(product.id!)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">No products found</div>
                {isManager() && (
                  <Link
                    to="/products/new"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Product
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;