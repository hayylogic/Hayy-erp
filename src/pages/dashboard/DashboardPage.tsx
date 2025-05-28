import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ShoppingCart, Users, Truck, AlertTriangle, 
  TrendingUp, DollarSign, BarChart2, PieChart
} from 'lucide-react';
import { db, Product, Sale, Purchase } from '../../db/db';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    lowStockProducts: 0,
    revenue: 0,
    purchases: 0,
    profit: 0
  });

  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [purchasesData, setPurchasesData] = useState<Purchase[]>([]);
  const [topProducts, setTopProducts] = useState<{name: string, count: number}[]>([]);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch counts
      const productsCount = await db.products.count();
      const salesCount = await db.sales.count();
      const customersCount = await db.customers.count();
      const suppliersCount = await db.suppliers.count();
      
      // Fetch low stock products
      const lowStockProducts = await db.products.filter(product => 
        product.stock <= product.lowStockAlert
      ).count();
      
      // Fetch sales and calculate revenue
      const sales = await db.sales.toArray();
      const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      
      // Fetch purchases
      const purchases = await db.purchases.toArray();
      const purchasesTotal = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
      
      // Calculate profit (simplified)
      const profit = revenue - purchasesTotal;
      
      setStats({
        totalProducts: productsCount,
        totalSales: salesCount,
        totalCustomers: customersCount,
        totalSuppliers: suppliersCount,
        lowStockProducts,
        revenue,
        purchases: purchasesTotal,
        profit
      });
      
      setSalesData(sales);
      setPurchasesData(purchases);
      
      // Calculate top products
      const productSales: Record<string, number> = {};
      
      for (const sale of sales) {
        for (const item of sale.items) {
          if (productSales[item.productName]) {
            productSales[item.productName] += item.quantity;
          } else {
            productSales[item.productName] = item.quantity;
          }
        }
      }
      
      const topProductsArray = Object.entries(productSales)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopProducts(topProductsArray);
    };
    
    fetchData();
  }, []);

  // Filter data based on time period
  const getFilteredData = () => {
    const now = new Date();
    let filterDate = new Date();
    
    if (timeFilter === 'daily') {
      filterDate.setDate(now.getDate() - 1);
    } else if (timeFilter === 'weekly') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'monthly') {
      filterDate.setMonth(now.getMonth() - 1);
    }
    
    const filteredSales = salesData.filter(sale => new Date(sale.createdAt) >= filterDate);
    const filteredPurchases = purchasesData.filter(purchase => new Date(purchase.createdAt) >= filterDate);
    
    return { filteredSales, filteredPurchases };
  };

  const { filteredSales, filteredPurchases } = getFilteredData();
  
  // Prepare data for sales vs purchases chart
  const salesVsPurchasesData = {
    labels: ['Sales', 'Purchases'],
    datasets: [
      {
        label: 'Amount',
        data: [
          filteredSales.reduce((sum, sale) => sum + sale.total, 0),
          filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0)
        ],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for top products chart
  const topProductsData = {
    labels: topProducts.map(product => product.name),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(product => product.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for sales trend chart
  const prepareTrendData = () => {
    const dateLabels: string[] = [];
    const salesData: number[] = [];
    
    // Create date labels based on filter
    const now = new Date();
    if (timeFilter === 'daily') {
      // Last 24 hours in 3-hour intervals
      for (let i = 7; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i * 3);
        dateLabels.push(`${date.getHours()}:00`);
      }
    } else if (timeFilter === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dateLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (timeFilter === 'monthly') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i * 7);
        dateLabels.push(`Week ${4-i}`);
      }
    }
    
    // Initialize sales data with zeros
    salesData.push(...Array(dateLabels.length).fill(0));
    
    // Fill in actual sales data
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      let index = -1;
      
      if (timeFilter === 'daily') {
        // Find the 3-hour interval
        const hoursSinceNow = Math.floor((now.getTime() - saleDate.getTime()) / (3600 * 1000));
        index = Math.floor(hoursSinceNow / 3);
        if (index >= 0 && index < 8) {
          salesData[7 - index] += sale.total;
        }
      } else if (timeFilter === 'weekly') {
        // Find the day
        const daysSinceNow = Math.floor((now.getTime() - saleDate.getTime()) / (24 * 3600 * 1000));
        if (daysSinceNow >= 0 && daysSinceNow < 7) {
          salesData[6 - daysSinceNow] += sale.total;
        }
      } else if (timeFilter === 'monthly') {
        // Find the week
        const daysSinceNow = Math.floor((now.getTime() - saleDate.getTime()) / (24 * 3600 * 1000));
        const weeksSinceNow = Math.floor(daysSinceNow / 7);
        if (weeksSinceNow >= 0 && weeksSinceNow < 4) {
          salesData[3 - weeksSinceNow] += sale.total;
        }
      }
    });
    
    return { dateLabels, salesData };
  };
  
  const { dateLabels, salesData: trendData } = prepareTrendData();
  
  const salesTrendData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Sales',
        data: trendData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeFilter('daily')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFilter === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Daily
          </button>
          <button 
            onClick={() => setTimeFilter('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFilter === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeFilter('monthly')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFilter === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/products" className="text-sm text-blue-600 hover:underline">View all products</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sales</p>
              <h3 className="text-2xl font-bold">{stats.totalSales}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ShoppingCart className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/sales" className="text-sm text-blue-600 hover:underline">View all sales</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Customers</p>
              <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/customers" className="text-sm text-blue-600 hover:underline">View all customers</Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <h3 className="text-2xl font-bold">{stats.lowStockProducts}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/products" className="text-sm text-blue-600 hover:underline">View inventory</Link>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Revenue</p>
              <h3 className="text-2xl font-bold">${stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Purchases</p>
              <h3 className="text-2xl font-bold">${stats.purchases.toFixed(2)}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Truck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Profit</p>
              <h3 className="text-2xl font-bold">${stats.profit.toFixed(2)}</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <DollarSign className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Sales Trend</h3>
            <BarChart2 size={20} className="text-gray-500" />
          </div>
          <div className="h-64">
            <Line 
              data={salesTrendData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value;
                      }
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return '$' + context.raw;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Top Products</h3>
            <PieChart size={20} className="text-gray-500" />
          </div>
          <div className="h-64 flex items-center justify-center">
            {topProducts.length > 0 ? (
              <Pie 
                data={topProductsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 15,
                        font: {
                          size: 10
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-gray-500">No sales data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Recent Sales</h3>
        </div>
        <div className="p-3">
          {filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${sale.total.toFixed(2)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">No recent sales</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;