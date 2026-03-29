import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import HotelDetails from './pages/HotelDetails';
import AdminDashboard from './pages/AdminDashboard';
import MyBookings from './pages/MyBookings';
import Payment from './pages/Payment';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900 font-sans">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/hotels/:id" element={<HotelDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </main>
        <footer className="bg-white/90 border-t py-6 text-center text-sm text-gray-500 backdrop-blur">
          &copy; {new Date().getFullYear()} StayEase. Built for seamless hotel booking.
        </footer>
      </div>
    </Router>
  );
}

export default App;
