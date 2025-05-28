import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="text-gray-500 focus:outline-none focus:text-gray-700 md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-800">HAYY ERP</h1>
            </div>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none">
              <Bell size={20} />
            </button>
            
            <div className="relative ml-3">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full p-2">
                  <User size={20} className="text-gray-600" />
                </div>
                <div className="ml-2 hidden md:block">
                  <div className="text-sm font-medium text-gray-700">{currentUser?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{currentUser?.role}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-4 text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;