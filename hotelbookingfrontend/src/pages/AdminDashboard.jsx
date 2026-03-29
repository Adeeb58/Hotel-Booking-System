import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [hotelForm, setHotelForm] = useState({ name: '', location: '', description: '', amenities: '' });
  const [roomForm, setRoomForm] = useState({ hotelId: '', roomType: '', price: '', capacity: '', totalRooms: '' });
  
  const [message, setMessage] = useState(null);

  // Kick out non-admins gracefully
  if (role !== 'ADMIN') {
    return (
      <div className="text-center py-20 bg-white border rounded shadow-sm max-w-lg mx-auto mt-10">
        <ShieldCheck className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6 px-6">You must have administrator privileges to view this page. The server will reject your requests otherwise.</p>
        <button onClick={() => navigate('/')} className="text-primary font-medium hover:underline">Return Home</button>
      </div>
    );
  }

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArray = hotelForm.amenities.split(',').map(s => s.trim()).filter(s => s !== '');
      const res = await api.post('/hotels', { ...hotelForm, amenities: amenitiesArray });
      setMessage({ type: 'success', text: `Hotel successfully created! Inserted ID: ${res.data.id}` });
      setHotelForm({ name: '', location: '', description: '', amenities: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create hotel (Permission Denied)' });
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', { 
        ...roomForm, 
        hotelId: parseInt(roomForm.hotelId), 
        price: parseFloat(roomForm.price),
        capacity: parseInt(roomForm.capacity),
        totalRooms: parseInt(roomForm.totalRooms)
      });
      setMessage({ type: 'success', text: 'Room successfully added to hotel!' });
      setRoomForm({ hotelId: '', roomType: '', price: '', capacity: '', totalRooms: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add room (Permission Denied)' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-8 border-b pb-4">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Control Panel</h1>
      </div>

      {message && (
        <div className={`p-4 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
            <PlusCircle className="mr-2 h-5 w-5 text-gray-400" /> Register Hotel
          </h2>
          <form onSubmit={handleCreateHotel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
              <input required type="text" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={hotelForm.name} onChange={e => setHotelForm({...hotelForm, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Location</label>
              <input required type="text" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={hotelForm.location} onChange={e => setHotelForm({...hotelForm, location: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" rows="3" value={hotelForm.description} onChange={e => setHotelForm({...hotelForm, description: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (Comma separated)</label>
              <input type="text" placeholder="WiFi, Pool, Gym" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={hotelForm.amenities} onChange={e => setHotelForm({...hotelForm, amenities: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded font-medium hover:bg-gray-800 transition">Create Hotel</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
            <PlusCircle className="mr-2 h-5 w-5 text-gray-400" /> Add Room to Hotel
          </h2>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Hotel ID</label>
              <input required type="number" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={roomForm.hotelId} onChange={e => setRoomForm({...roomForm, hotelId: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select required className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none bg-white" value={roomForm.roomType} onChange={e => setRoomForm({...roomForm, roomType: e.target.value})}>
                <option value="">Select Type</option>
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price / Night ($)</label>
                <input required type="number" step="0.01" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input required type="number" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Inventory Count</label>
              <input required type="number" className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary outline-none" value={roomForm.totalRooms} onChange={e => setRoomForm({...roomForm, totalRooms: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2.5 rounded font-medium hover:bg-gray-800 transition mt-4">Add Room</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
