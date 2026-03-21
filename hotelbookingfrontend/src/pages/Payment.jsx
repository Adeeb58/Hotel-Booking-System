import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  CreditCard,
  Calendar,
  Lock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Hotel,
  DollarSign,
} from 'lucide-react';

const OFFER_OPTIONS = [
  {
    code: 'WELCOME20',
    title: 'First Time Hotel Offer',
    description: 'New users get 20% off on their first booking.',
  },
  {
    code: 'SAVE10',
    title: 'Standard Savings Offer',
    description: 'Get 10% off on eligible stays.',
  },
];

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, amount, reservationNumber, hotelName, checkIn, checkOut } =
    location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [promoCode, setPromoCode] = useState('');
  const [selectedOfferCode, setSelectedOfferCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const finalAmount = discount > 0 ? (amount * (1 - discount / 100)) : amount;

  // Guard: if navigated here without state, redirect home
  if (!bookingId) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No booking found</h2>
        <p className="text-gray-500 mb-6">Please select a room first.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-gray-800 transition font-medium"
        >
          Browse Hotels
        </button>
      </div>
    );
  }

  const formatCardNumber = (val) => {
    return val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const fetchPromo = async (codeArg) => {
    const codeToValidate = (codeArg ?? promoCode).trim().toUpperCase();
    if (!codeToValidate) return;

    setValidatingPromo(true);
    setPromoMessage(null);
    try {
      const res = await api.get(`/promotions/validate/${codeToValidate}`);
      setDiscount(res.data.discountPercentage || 0);
      setPromoCode(codeToValidate);
      setSelectedOfferCode(codeToValidate);
      setPromoMessage({ type: 'success', text: `Promotion applied: ${res.data.discountPercentage}% off!` });
    } catch (err) {
      setPromoMessage({ type: 'error', text: err.response?.data?.message || 'Invalid or expired promotion code.' });
      setDiscount(0);
    } finally {
      setValidatingPromo(false);
    }
  };

  const clearPromo = () => {
    setPromoCode('');
    setSelectedOfferCode('');
    setDiscount(0);
    setPromoMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanBookingId = String(bookingId);
      await api.post('/payments', {
        bookingId: cleanBookingId,
        amount: finalAmount,
        paymentMethod: paymentMethod,
      });

      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again and retry payment.');
      } else {
        setError(
          err.response?.data?.message || err.response?.data?.error || 'Payment failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="bg-white rounded-2xl shadow-md border p-10">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-4">Your booking has been confirmed.</p>
          {reservationNumber && (
            <div className="bg-gray-50 border rounded-lg px-5 py-3 mb-6 inline-block">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Reservation Number</p>
              <p className="text-lg font-mono font-bold text-gray-800">{reservationNumber}</p>
            </div>
          )}
          <div className="text-sm text-gray-600 mb-8 space-y-1">
            {hotelName && <p><span className="font-semibold">Hotel:</span> {hotelName}</p>}
            {checkIn && <p><span className="font-semibold">Check-In:</span> {checkIn}</p>}
            {checkOut && <p><span className="font-semibold">Check-Out:</span> {checkOut}</p>}
            <p>
              <span className="font-semibold">Amount Paid:</span>{' '}
              <span className="text-green-700 font-bold">${Number(finalAmount).toFixed(2)}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/bookings')}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            View My Bookings <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Complete Payment</h1>
        <p className="text-gray-500 text-sm mt-1">Your room is reserved. Complete payment to confirm your booking.</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Booking Summary</h2>
        <div className="flex items-start gap-3 mb-3">
          <Hotel className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">{hotelName || `Booking #${bookingId}`}</p>
            {reservationNumber && (
              <p className="text-xs font-mono text-gray-400 tracking-widest mt-0.5">{reservationNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>
            {checkIn} → {checkOut}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">${Number(finalAmount).toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="text-right">
              <p className="text-xs text-red-500 line-through">${Number(amount).toFixed(2)}</p>
              <p className="text-xs font-bold text-green-600">-{discount}% Applied</p>
            </div>
          )}
        </div>
      </div>

      {/* Promotions */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Promotions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {OFFER_OPTIONS.map((offer) => (
            <button
              key={offer.code}
              type="button"
              onClick={() => {
                setPromoCode(offer.code);
                setSelectedOfferCode(offer.code);
                fetchPromo(offer.code);
              }}
              disabled={discount > 0 && promoCode !== offer.code}
              className={`text-left border rounded-lg p-3 transition ${
                selectedOfferCode === offer.code
                  ? 'border-primary bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              } ${discount > 0 && promoCode !== offer.code ? 'opacity-60' : ''}`}
            >
              <p className="text-xs font-bold tracking-wide text-primary mb-1">{offer.code}</p>
              <p className="text-sm font-semibold text-gray-900">{offer.title}</p>
              <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Discount Code"
            value={promoCode}
            onChange={e => {
              setPromoCode(e.target.value.toUpperCase());
              setSelectedOfferCode('');
            }}
            disabled={discount > 0}
            className="flex-1 border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
          <button 
            type="button" 
            onClick={() => fetchPromo()}
            disabled={!promoCode || validatingPromo || discount > 0}
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-black transition disabled:opacity-50"
          >
            {validatingPromo ? '...' : discount > 0 ? 'Applied' : 'Apply'}
          </button>
          {discount > 0 && (
            <button
              type="button"
              onClick={clearPromo}
              className="border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 transition"
            >
              Remove
            </button>
          )}
        </div>
        {promoMessage && (
          <p className={`text-xs mt-2 font-medium ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {promoMessage.text}
          </p>
        )}
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Payment Details</h2>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="flex gap-3">
            {['Credit Card', 'Debit Card', 'Net Banking'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                  paymentMethod === method
                    ? 'border-primary bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Card Holder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
          <input
            type="text"
            required
            placeholder="John Doe"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              required
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="text"
              required
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="•••"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Pay ${Number(finalAmount).toFixed(2)} Now
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Payments are securely simulated for demo purposes
        </p>
      </form>
    </div>
  );
};

export default Payment;
