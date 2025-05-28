import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { db, Sale, Customer } from '../../db/db';
import { useToast } from '../../contexts/ToastContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const SaleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'HAYY ERP',
    address: '123 Business Street, City',
    phone: '+1 234 567 8900',
    email: 'info@hayy-erp.com'
  });

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!id) return;
      
      try {
        // Fetch sale
        const saleData = await db.sales.get(id);
        if (!saleData) {
          showToast('Sale not found', 'error');
          navigate('/sales');
          return;
        }
        
        setSale(saleData);
        
        // Fetch customer
        if (saleData.customerId) {
          const customerData = await db.customers.get(saleData.customerId);
          setCustomer(customerData || null);
        }
        
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
        console.error('Error fetching sale details:', error);
        showToast('Failed to load sale details', 'error');
        setLoading(false);
      }
    };
    
    fetchSaleDetails();
  }, [id, navigate, showToast]);

  const generateInvoice = () => {
    if (!sale) return;
    
    try {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Sale not found</div>
        <Link
          to="/sales"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/sales')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Sale Details</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateInvoice}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            Download Invoice
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sale Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Invoice #{sale.id?.substring(0, 8).toUpperCase()}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Date: {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                  sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {sale.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Right Column - Customer & Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
            {customer ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.email}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
                <p className="text-sm text-gray-500">{customer.address}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{sale.customerName}</p>
            )}
          </div>
          
          {/* Payment Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Method:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`text-sm font-medium ${
                  sale.status === 'completed' ? 'text-green-600' :
                  sale.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                } capitalize`}>
                  {sale.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Sale Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">${sale.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Discount:</span>
                <span className="text-sm font-medium text-gray-900">${sale.discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tax:</span>
                <span className="text-sm font-medium text-gray-900">${sale.tax.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-blue-600">${sale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsPage;