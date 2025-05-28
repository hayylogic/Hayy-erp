import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, Package, ShoppingCart, Truck, Users, UserCircle, Settings, BarChart4 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { isAdmin, isManager } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, access: true },
    { name: 'Products', path: '/products', icon: <Package size={20} />, access: true },
    { name: 'Sales', path: '/sales', icon: <ShoppingCart size={20} />, access: true },
    { name: 'Purchases', path: '/purchases', icon: <Truck size={20} />, access: isManager() },
    { name: 'Customers', path: '/customers', icon: <Users size={20} />, access: true },
    { name: 'Suppliers', path: '/suppliers', icon: <Users size={20} />, access: isManager() },
    { name: 'Reports', path: '/reports', icon: <BarChart4 size={20} />, access: isManager() },
    { name: 'Users', path: '/users', icon: <UserCircle size={20} />, access: isAdmin() },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, access: isAdmin() }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <div className="flex items-center">
            <span className="text-xl font-semibold">HAYY ERP</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.filter(item => item.access).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;