import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, Save, Printer, Download } from 'lucide-react';
import { db, Product, Customer, Sale, SaleItem } from '../../db/db';
import { useToast } from '../../contexts/ToastContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const NewSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(10); // Default tax rate
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'HAYY ERP',
    address: '123 Business Street, City',
    phone: '+1 234 567 8900',
    email: 'info@hayy-erp.com'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const allProducts = await db.products.toArray();
        setProducts(allProducts);
        
        // Fetch customers
        const allCustomers = await db.customers.toArray();
        setCustomers(allCustomers);
        
        // Fetch settings for tax rate and company info
        const settings = await db.settings.get(1);
        if (settings) {
          setTaxRate(settings.taxRate);
          setCompanyInfo({
            name: settings.companyName,
            address: settings.address,
            phone: settings.phone,
            email: settings.email
          });
        }
        
        // Focus on barcode input
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load data', 'error');
      }
    };
    
    fetchData();
  }, [showToast]);

  useEffect(() => {
    // Calculate subtotal
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    
    // Calculate tax
    const newTax = (newSubtotal - discount) * (taxRate / 100);
    setTax(newTax);
    
    // Calculate total
    setTotal(newSubtotal - discount + newTax);
  }, [cartItems, discount, taxRate]);

  useEffect(() => {
    // Update selected customer when customer ID changes
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, customers]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) return;
    
    // Find product by barcode
    const product = products.find(p => p.barcode === barcode.trim());
    
    if (product) {
      addProductToCart(product);
      setBarcode('');
    } else {
      showToast('Product not found', 'error');
    }
    
    // Focus back on barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const addProductToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      setCartItems(updatedItems);
    } else {
      // Add new item to cart
      const newItem: SaleItem = {
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id!,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addProductToCart(product);
    }
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total: quantity * item.price
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscount(Math.min(value, subtotal)); // Discount cannot exceed subtotal
  };

  const validateSale = () => {
    if (cartItems.length === 0) {
      showToast('Please add at least one product', 'error');
      return false;
    }
    
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return false;
    }
    
    return true;
  };

  const handleSaveSale = async () => {
    if (!validateSale()) return;
    
    setLoading(true);
    
    try {
      // Check stock availability
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.stock < item.quantity) {
          showToast(`Not enough stock for ${product.name}`, 'error');
          setLoading(false);
          return;
        }
      }
      
      // Create sale object
      const sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || '',
        items: cartItems,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        status: 'completed'
      };
      
      // Add sale to database
      const saleId = await db.sales.add({
        ...sale,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update product stock
      for (const item of cartItems) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            stock: product.stock - item.quantity,
            updatedAt: new Date()
          });
        }
      }
      
      showToast('Sale completed successfully', 'success');
      navigate(`/sales/${saleId}`);
    } catch (error) {
      console.error('Error saving sale:', error);
      showToast('Failed to complete sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = () => {
    if (!validateSale()) return;
    
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
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
      doc.text(`Invoice #: INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, 20, 65);
      
      // Add customer info
      if (selectedCustomer) {
        doc.text('Bill To:', 140, 60);
        doc.text(selectedCustomer.name, 140, 65);
        doc.text(selectedCustomer.address, 140, 70);
        doc.text(`Phone: ${selectedCustomer.phone}`, 140, 75);
        doc.text(`Email: ${selectedCustomer.email}`, 140, 80);
      }
      
      // Add items table
      const tableColumn = ['#', 'Product', 'Qty', 'Price', 'Total'];
      const tableRows = cartItems.map((item, index) => [
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
      doc.text(`$${subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
      
      doc.text('Discount:', 140, finalY + 5);
      doc.text(`$${discount.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      
      doc.text(`Tax (${taxRate}%):`, 140, finalY + 10);
      doc.text(`$${tax.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text('Total:', 140, finalY + 20);
      doc.text(`$${total.toFixed(2)}`, 170, finalY + 20, { align: 'right' });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + 35, { align: 'center' });
      
      // Save the PDF
      doc.save('invoice.pdf');
      
      showToast('Invoice generated successfully', 'success');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('Failed to generate invoice', 'error');
    }
  };

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
          <h1 className="text-2xl font-semibold text-gray-800">New Sale</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scan Barcode</h2>
            <form onSubmit={handleBarcodeSubmit} className="flex">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </form>
          </div>
          
          {/* Product Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onChange={(e) => handleProductSelect(e.target.value)}
                value=""
              >
                <option value="" disabled>Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Cart Items */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Cart Items</h2>
            </div>
            
            {cartItems.length > 0 ? (
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="mx-2 w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No items in cart. Scan a barcode or select a product to add.
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Sale Summary */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
            <div className="space-y-4">
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    id="cash"
                    name="paymentMethod"
                    type="radio"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="cash" className="ml-2 block text-sm text-gray-700">
                    Cash
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="card"
                    name="paymentMethod"
                    type="radio"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="card" className="ml-2 block text-sm text-gray-700">
                    Card
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="bank"
                    name="paymentMethod"
                    type="radio"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="bank" className="ml-2 block text-sm text-gray-700">
                    Bank Transfer
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sale Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sale Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Discount:</span>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={handleDiscountChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="text-gray-900">${tax.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleSaveSale}
              disabled={loading || cartItems.length === 0}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={16} className="mr-2" />
                  Complete Sale
                </span>
              )}
            </button>
            
            <button
              onClick={generateInvoice}
              disabled={cartItems.length === 0 || !selectedCustomerId}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download size={16} className="mr-2" />
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSalePage;