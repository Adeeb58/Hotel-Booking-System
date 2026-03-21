import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Hotel, UserCircle, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary font-semibold text-xl">
            <Hotel className="h-6 w-6" />
            <span>Hotel Explorer</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {role === 'ADMIN' && (
                  <Link to="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/bookings" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  My Bookings
                </Link>
                <div className="flex items-center space-x-2 text-gray-600 text-sm">
                  <UserCircle className="h-5 w-5" />
                  <span>{user}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
