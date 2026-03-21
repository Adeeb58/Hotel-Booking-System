import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { CalendarCheck, DollarSign, Hotel, Hash, X, AlertTriangle } from 'lucide-react';

const MyBookings = () => {
  const { user, userId } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchBookings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/bookings/user/${userId}`);
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user, userId]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    setMessage(null);
    try {
      await api.put(`/bookings/cancel/${bookingId}`);
      setMessage({ type: 'success', text: 'Booking cancelled successfully. Your room has been released.' });
      // Refresh the list
      await fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cancel booking. Please try again.' });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your reservations...</div>;

  if (!user) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <CalendarCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Sign in to view bookings</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to view your booking history.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2 rounded hover:bg-gray-800 transition font-medium">
          Log In
        </Link>
      </div>
    );
  }

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-2 border-b pb-4">
        <CalendarCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Reservations</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {confirmedBookings.length} active · {cancelledBookings.length} cancelled
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded text-sm flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'error' && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto flex-shrink-0">
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED';
            const isCancelling = cancellingId === booking.id;

            return (
              <div
                key={booking.id}
                className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row md:items-start justify-between gap-4 transition ${isCancelled ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                {/* Left: booking details */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-500 tracking-widest">
                      {booking.reservationNumber || `BKG-${booking.id}`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 flex items-center mb-1">
                    <Hotel className="h-5 w-5 mr-2 text-primary" />
                    Hotel ID: {booking.hotelId} &nbsp;·&nbsp; Room ID: {booking.roomId}
                  </h3>

                  <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                    <div>
                      <span className="font-semibold text-gray-800">Check In:</span>{' '}
                      {new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Check Out:</span>{' '}
                      {new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Right: status, price, actions */}
                <div className="flex flex-col items-start md:items-end gap-3 md:min-w-[160px]">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${
                    isCancelled
                      ? 'bg-gray-100 text-gray-500 border border-gray-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {booking.status || 'PENDING'}
                  </span>

                  <div className="text-2xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    {booking.totalPrice?.toFixed(2)}
                  </div>

                  <div className="flex flex-col gap-2 w-full md:items-end">
                    {!isCancelled && (
                      <Link
                        to={`/hotels/${booking.hotelId}`}
                        className="w-full md:w-auto text-center px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded hover:bg-gray-800 transition"
                      >
                        Book Again
                      </Link>
                    )}
                    {!isCancelled && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={isCancelling}
                        className="w-full md:w-auto text-center px-4 py-1.5 border border-red-300 text-red-600 text-sm font-semibold rounded hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-dashed rounded-xl text-gray-500">
          <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">You don't have any reservations yet.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline text-sm font-medium">
            Browse Hotels
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
