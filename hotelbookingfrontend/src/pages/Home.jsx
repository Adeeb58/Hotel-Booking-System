import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { MapPin, DollarSign, CalendarRange, Star, Filter, X } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const AMENITY_OPTIONS = ['WiFi', 'Pool', 'Gym', 'Spa', 'Parking', 'Restaurant', 'Bar', 'AC', 'Breakfast'];

const Home = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    minPrice: '',
    maxPrice: '',
  });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchParams.location) query.append('location', searchParams.location);
      if (searchParams.checkIn) query.append('checkIn', searchParams.checkIn);
      if (searchParams.checkOut) query.append('checkOut', searchParams.checkOut);
      if (searchParams.minPrice) query.append('minPrice', searchParams.minPrice);
      if (searchParams.maxPrice) query.append('maxPrice', searchParams.maxPrice);
      selectedAmenities.forEach(a => query.append('amenities', a));

      const res = await api.get(`/hotels/search?${query.toString()}`);
      setHotels(res.data);
    } catch (err) {
      console.error('Failed to fetch hotels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels();
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearchParams({ location: '', checkIn: '', checkOut: '', minPrice: '', maxPrice: '' });
    setSelectedAmenities([]);
  };

  const hasActiveFilters = searchParams.location || searchParams.checkIn || searchParams.checkOut ||
    searchParams.minPrice || searchParams.maxPrice || selectedAmenities.length > 0;

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <section className="bg-primary text-white rounded-xl p-8 md:p-12 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">Find your next stay</h1>
          <p className="text-gray-300 text-lg mb-8 font-light">Search hotels by location, dates, price & amenities.</p>

          <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-5 space-y-4">
            {/* Row 1: Location + Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Location</label>
                <div className="flex items-center text-gray-900 border-b border-gray-300 pb-1">
                  <MapPin className="text-gray-400 h-5 w-5 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="City or hotel name"
                    className="w-full outline-none bg-transparent text-sm"
                    value={searchParams.location}
                    onChange={e => setSearchParams({ ...searchParams, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Check-In</label>
                <div className="flex items-center text-gray-900 border-b border-gray-300 pb-1">
                  <CalendarRange className="text-gray-400 h-5 w-5 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    min={today()}
                    className="w-full outline-none bg-transparent text-sm"
                    value={searchParams.checkIn}
                    onChange={e => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Check-Out</label>
                <div className="flex items-center text-gray-900 border-b border-gray-300 pb-1">
                  <CalendarRange className="text-gray-400 h-5 w-5 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    min={searchParams.checkIn || today()}
                    className="w-full outline-none bg-transparent text-sm"
                    value={searchParams.checkOut}
                    onChange={e => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Price + Filter toggle + Search */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-28">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Min Price</label>
                <div className="flex items-center text-gray-900 border-b border-gray-300 pb-1">
                  <DollarSign className="text-gray-400 h-4 w-4 flex-shrink-0" />
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full outline-none bg-transparent text-sm"
                    value={searchParams.minPrice}
                    onChange={e => setSearchParams({ ...searchParams, minPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Max Price</label>
                <div className="flex items-center text-gray-900 border-b border-gray-300 pb-1">
                  <DollarSign className="text-gray-400 h-4 w-4 flex-shrink-0" />
                  <input
                    type="number"
                    placeholder="Any"
                    className="w-full outline-none bg-transparent text-sm"
                    value={searchParams.maxPrice}
                    onChange={e => setSearchParams({ ...searchParams, maxPrice: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border transition ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'}`}
              >
                <Filter className="h-4 w-4" />
                Amenities
                {selectedAmenities.length > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedAmenities.length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" /> Clear
                </button>
              )}

              <button
                type="submit"
                className="ml-auto bg-gray-900 text-white font-medium py-2 px-7 rounded hover:bg-gray-700 transition text-sm"
              >
                Search Hotels
              </button>
            </div>

            {/* Amenity Chips */}
            {showFilters && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter by Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Results */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {hasActiveFilters ? 'Search Results' : 'Featured Hotels'}
          </h2>
          {!loading && hotels.length > 0 && (
            <span className="text-sm text-gray-500">{hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading hotels...</div>
        ) : hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map(hotel => (
              <Link
                to={`/hotels/${hotel.id}`}
                key={hotel.id}
                className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col h-full group"
              >
                {/* Hotel Image Placeholder */}
                <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b text-gray-400 relative">
                  <span className="text-sm tracking-wide uppercase font-medium">Hotel Photo</span>
                  {hotel.rating && (
                    <div className="absolute top-3 right-3 flex items-center bg-white rounded-full px-2 py-0.5 shadow-sm text-xs font-bold text-yellow-600">
                      <Star className="h-3 w-3 mr-0.5 fill-yellow-400 text-yellow-400" />
                      {hotel.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{hotel.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hotel.location}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-grow">{hotel.description}</p>

                  {/* Amenity Preview */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {hotel.amenities.slice(0, 4).map(amenity => (
                        <span key={amenity} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="text-xs text-gray-400">+{hotel.amenities.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto border-t pt-3 flex justify-between items-center text-sm font-medium">
                    <span className="text-primary group-hover:underline">View Rooms &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 bg-white border rounded-xl border-dashed">
            {hasActiveFilters
              ? 'No hotels match your search criteria. Try adjusting the filters.'
              : 'No hotels available right now. Check back later.'}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
