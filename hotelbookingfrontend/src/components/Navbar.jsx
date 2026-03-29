import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
    <nav className="sticky top-0 z-40 bg-white/90 shadow-sm border-b backdrop-blur">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary font-semibold text-xl tracking-tight">
            <div className="h-9 w-9 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <Hotel className="h-5 w-5" />
            </div>
            <span>StayEase</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {role === 'ADMIN' && (
                  <NavLink to="/admin" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                    Admin Dashboard
                  </NavLink>
                )}
                <NavLink to="/bookings" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                  My Bookings
                </NavLink>
                <div className="hidden md:flex items-center space-x-2 text-gray-600 text-sm">
                  <UserCircle className="h-5 w-5" />
                  <span>{user}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
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
