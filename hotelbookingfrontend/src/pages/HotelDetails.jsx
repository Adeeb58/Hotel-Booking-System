import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { MapPin, CheckCircle, BedDouble, Calendar, Hotel } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
const today = () => new Date().toISOString().split('T')[0];
// Get a date N days from now in YYYY-MM-DD format
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const HOTEL_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=80',
];

const ROOM_TYPE_IMAGES = {
  STANDARD: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  DELUXE: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  SUITE: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
};

const fallbackHotelImage = (hotelId) => {
  const numeric = Number(hotelId);
  const index = Number.isFinite(numeric)
    ? Math.abs(numeric) % HOTEL_FALLBACK_IMAGES.length
    : 0;
  return HOTEL_FALLBACK_IMAGES[index];
};

const getRoomImage = (room) => {
  const key = String(room?.roomType || '').toUpperCase();
  return ROOM_TYPE_IMAGES[key] || ROOM_TYPE_IMAGES.STANDARD;
};

const resolveHotelImage = (hotel) => {
  if (hotel?.imageUrl) return hotel.imageUrl;
  if (hotel?.image) return hotel.image;
  if (Array.isArray(hotel?.photos) && hotel.photos.length > 0) return hotel.photos[0];
  return fallbackHotelImage(hotel?.id);
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
  const [roomAvailability, setRoomAvailability] = useState({});
  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0;

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

  useEffect(() => {
    const fetchAvailability = async () => {
      if (rooms.length > 0 && checkIn && checkOut && checkOut > checkIn) {
        try {
          const roomIds = rooms
            .map(r => Number(r?.id))
            .filter(id => Number.isFinite(id));

          if (roomIds.length === 0) {
            setRoomAvailability({});
            return;
          }

          const res = await api.post(`/availability/bulk?checkIn=${checkIn}&checkOut=${checkOut}`, roomIds);
          setRoomAvailability(res.data);
        } catch (err) {
          setRoomAvailability({});
          console.warn('Real-time availability is temporarily unavailable. Showing default room stock.');
        }
      }
    };
    fetchAvailability();
  }, [rooms, checkIn, checkOut]);

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

    const roomToBook = rooms.find(r => Number(r.id) === Number(roomId));
    if (!roomToBook) {
      setMessage({ type: 'error', text: 'Selected room not found.' });
      return;
    }

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

      const booking = response.data;
      const resNumber = booking?.reservationNumber || '';

      navigate('/payment', {
        state: {
          bookingId: booking.id,
          amount: totalPrice,
          reservationNumber: resNumber,
          hotelName: hotel?.name || `Hotel ${id}`,
          checkIn,
          checkOut,
        },
      });
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
    <div className="max-w-5xl mx-auto space-y-8">
      {message && (
        <div className={`p-4 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm">
        <div className="mb-6 overflow-hidden rounded-xl border bg-slate-100 h-64 md:h-80">
          <img
            src={resolveHotelImage(hotel)}
            alt={hotel.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = fallbackHotelImage(hotel?.id);
            }}
          />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-900 text-white flex items-center justify-center">
              <Hotel className="h-5 w-5" />
            </div>
            <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {hotel.location}
            </div>
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
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
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
        {nights > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Duration: <span className="font-semibold text-gray-700">
              {nights} night(s)
            </span>
          </p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Available Rooms</h2>
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => {
              const roomId = Number(room.id);
              const bookedCount = Number(roomAvailability[roomId] ?? roomAvailability[String(roomId)] ?? 0);
              const availableRooms = (room.totalRooms || 0) - bookedCount;
              const isSoldOut = availableRooms <= 0;

              return (
              <div key={room.id} className={`border rounded-xl p-5 bg-white shadow-sm flex flex-col ${isSoldOut ? 'opacity-60 bg-gray-50' : 'hover:shadow-md transition'}`}>
                <div className="mb-4 overflow-hidden rounded-lg border h-36 bg-slate-100">
                  <img
                    src={getRoomImage(room)}
                    alt={`${room.roomType || 'Standard'} room`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <BedDouble className="h-5 w-5 mr-2 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Room {room.id}</h3>
                  </div>
                  {checkIn && checkOut && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isSoldOut ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {isSoldOut ? 'Sold Out' : `${availableRooms} room(s) left`}
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-sm mb-4">
                  Type: <span className="text-gray-800 font-medium">{room.roomType}</span><br />
                  Capacity: <span className="text-gray-800 font-medium">{room.capacity} Guests</span>
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
                    disabled={isSoldOut || (bookingLoading && selectedRoom === room.id)}
                    onClick={() => handleBook(room.id)}
                    className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {isSoldOut
                      ? 'Sold Out'
                      : (bookingLoading && selectedRoom === room.id) ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              </div>
            )})}
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
