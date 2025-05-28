import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Download } from 'lucide-react';
import { db, Sale } from '../../db/db';
import { useToast } from '../../contexts/ToastContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { showToast } = useToast();
  const [companyInfo, setCompanyInfo] = useState({
    name: 'HAYY ERP',
    address: '123 Business Street, City',
    phone: '+1 234 567 8900',
    email: 'info@hayy-erp.com'
  });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const allSales = await db.sales.toArray();
        setSales(allSales);
        
        // Fetch company info from settings
        const settings = await db.settings.get(1);
        if (settings) {
          setCompanyInfo({
            name: settings.companyName,
            address: settings.address,
            phone: settings.phone,
            email: settings.email
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales:', error);
        showToast('Failed to load sales', 'error');
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [showToast]);

  const generateInvoice = async (sale: Sale) => {
    try {
      // Fetch customer details
      const customer = await db.customers.get(sale.customerId);
      
      const doc = new jsPDF();
      
      // Add company info
      doc.setFontSize(20);
      doc.text(companyInfo.name, 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(companyInfo.address, 105, 30, { align: 'center' });
      doc.text(`Phone: ${companyInfo.phone}`, 105, 35, { align: 'center' });
      doc.text(`Email: ${companyInfo.email}`, 105, 40, { align: 'center' });
      
      // Add invoice title
      doc.setFontSize(16);
      doc.text('INVOICE', 105, 50, { align: 'center' });
      
      // Add invoice details
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 20, 60);
      doc.text(`Invoice #: INV-${sale.id?.substring(0, 8).toUpperCase()}`, 20, 65);
      
      // Add customer info
      if (customer) {
        doc.text('Bill To:', 140, 60);
        doc.text(customer.name, 140, 65);
        doc.text(customer.address, 140, 70);
        doc.text(`Phone: ${customer.phone}`, 140, 75);
        doc.text(`Email: ${customer.email}`, 140, 80);
      }
      
      // Add items table
      const tableColumn = ['#', 'Product', 'Qty', 'Price', 'Total'];
      const tableRows = sale.items.map((item, index) => [
        index + 1,
        item.productName,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]);
      
      (doc as any).autoTable({
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Subtotal:', 140, finalY);
      doc.text(`$${sale.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
      
      doc.text('Discount:', 140, finalY + 5);
      doc.text(`$${sale.discount.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      
      doc.text(`Tax:`, 140, finalY + 10);
      doc.text(`$${sale.tax.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text('Total:', 140, finalY + 20);
      doc.text(`$${sale.total.toFixed(2)}`, 170, finalY + 20, { align: 'right' });
      
      // Add payment method
      doc.setFontSize(10);
      doc.text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`, 20, finalY);
      
      // Add footer
      doc.text('Thank you for your business!', 105, finalY + 35, { align: 'center' });
      
      // Save the PDF
      doc.save(`invoice-${sale.id?.substring(0, 8)}.pdf`);
      
      showToast('Invoice generated successfully', 'success');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('Failed to generate invoice', 'error');
    }
  };

  const getFilteredSales = () => {
    return sales.filter(sale => {
      // Search filter
      const matchesSearch = 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      const saleDate = new Date(sale.createdAt);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        matchesDate = saleDate >= monthAgo;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filteredSales = getFilteredSales();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Sales</h1>
        
        <Link
          to="/sales/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          New Sale
        </Link>
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
                placeholder="Search sales..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-48">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="w-full md:w-48">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
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
            {filteredSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {sale.id?.substring(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${sale.total.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/sales/${sale.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye size={18} />
                            </Link>
                            <button
                              onClick={() => generateInvoice(sale)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">No sales found</div>
                <Link
                  to="/sales/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus size={16} className="mr-2" />
                  New Sale
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesPage;