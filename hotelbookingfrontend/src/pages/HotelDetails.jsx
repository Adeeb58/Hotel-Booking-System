import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { MapPin, CheckCircle, BedDouble, Calendar } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
const today = () => new Date().toISOString().split('T')[0];
// Get a date N days from now in YYYY-MM-DD format
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userId } = useContext(AuthContext);

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Booking date state - user selects from UI
  const [checkIn, setCheckIn] = useState(daysFromNow(1));
  const [checkOut, setCheckOut] = useState(daysFromNow(4));
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const hotelRes = await api.get(`/hotels/${id}`);
        setHotel(hotelRes.data);

        const roomRes = await api.get(`/rooms/${id}`);
        setRooms(roomRes.data);
      } catch (err) {
        console.error('Failed to load hotel info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotelData();
  }, [id]);

  const handleBook = async (roomId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!checkIn || !checkOut) {
      setMessage({ type: 'error', text: 'Please select check-in and check-out dates.' });
      return;
    }

    if (checkOut <= checkIn) {
      setMessage({ type: 'error', text: 'Check-out date must be after check-in date.' });
      return;
    }

    const roomToBook = rooms.find(r => r.id === roomId);
    if (!roomToBook) {
      setMessage({ type: 'error', text: 'Selected room not found.' });
      return;
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = roomToBook.price * nights;

    setBookingLoading(true);
    setMessage(null);
    setSelectedRoom(roomId);

    try {
      const response = await api.post('/bookings', {
        userId: userId,
        hotelId: parseInt(id),
        roomId: roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice: totalPrice
      });

      const resNumber = response.data?.reservationNumber || '';
      setMessage({
        type: 'success',
        text: `✅ Booking confirmed! ${resNumber ? `Reservation #${resNumber}` : ''} — ${nights} night(s), Total: $${totalPrice.toFixed(2)}. A confirmation has been dispatched!`
      });

      // Refresh rooms to show updated availability
      const roomRes = await api.get(`/rooms/${id}`);
      setRooms(roomRes.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage({ type: 'error', text: 'This room is already booked for the selected dates. Please choose different dates.' });
      } else if (err.response?.status === 401) {
        setMessage({ type: 'error', text: 'You must be logged in to book a room. Please log in.' });
      } else {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create booking. Please try again.' });
      }
    } finally {
      setBookingLoading(false);
      setSelectedRoom(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading hotel details...</div>;
  if (!hotel) return <div className="text-center py-20 text-red-500">Hotel not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {message && (
        <div className={`p-4 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {hotel.location}
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-6 font-light leading-relaxed">
          {hotel.description}
        </p>

        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities && hotel.amenities.map(amenity => (
              <span key={amenity} className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                <CheckCircle className="h-3 w-3 mr-1" /> {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Date picker panel */}
      <div className="bg-white border rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-400" /> Select Your Stay Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-In Date</label>
            <input
              type="date"
              min={today()}
              value={checkIn}
              onChange={e => {
                setCheckIn(e.target.value);
                setMessage(null);
              }}
              className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out Date</label>
            <input
              type="date"
              min={checkIn || today()}
              value={checkOut}
              onChange={e => {
                setCheckOut(e.target.value);
                setMessage(null);
              }}
              className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>
        {checkIn && checkOut && checkOut > checkIn && (
          <p className="text-sm text-gray-500 mt-2">
            Duration: <span className="font-semibold text-gray-700">
              {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} night(s)
            </span>
          </p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Available Rooms</h2>
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="border rounded-lg p-5 bg-white shadow-sm flex flex-col">
                <div className="flex items-center mb-3">
                  <BedDouble className="h-5 w-5 mr-2 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Room {room.id}</h3>
                </div>
                <div className="text-gray-500 text-sm mb-4">
                  Type: <span className="text-gray-800 font-medium">{room.roomType}</span><br />
                  Capacity: <span className="text-gray-800 font-medium">{room.capacity}</span>
                </div>

                <div className="mt-auto flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${room.price}</span>
                    <span className="text-gray-500 text-xs ml-1">/ night</span>
                    {checkIn && checkOut && checkOut > checkIn && (
                      <div className="text-xs text-gray-400 mt-1">
                        Total: ${(room.price * Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={(room.totalRooms !== null && room.totalRooms <= 0) || (bookingLoading && selectedRoom === room.id)}
                    onClick={() => handleBook(room.id)}
                    className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {(room.totalRooms !== null && room.totalRooms <= 0)
                      ? 'Sold Out'
                      : (bookingLoading && selectedRoom === room.id) ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white border border-dashed rounded text-gray-500">
            No rooms currently registered for this hotel.
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;
