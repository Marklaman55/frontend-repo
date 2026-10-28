import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, MapPin, Calendar, Clock, Search, Loader2, ChevronRight, CheckCircle2, Truck, Compass, XCircle, Star, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/api';

const MyBookings = () => {
  const [phone, setPhone] = useState(localStorage.getItem('customer_phone') || '');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchBookings = async (phoneNum: string) => {
    if (!phoneNum) return;
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getByPhone(phoneNum);
      setBookings(data);
      localStorage.setItem('customer_phone', phoneNum);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      fetchBookings(phone);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(phone);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'assigned': return 'text-blue-600 bg-blue-50';
      case 'on the way': return 'text-purple-600 bg-purple-50';
      case 'arrived': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'assigned': return <User className="w-4 h-4" />;
      case 'on the way': return <Truck className="w-4 h-4" />;
      case 'arrived': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and track your active and past orders</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                placeholder="Enter your phone number (e.g., 254...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Bookings'}
            </button>
          </form>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                          {booking.type === 'delivery' ? <Package className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 capitalize">{booking.type} Service</h3>
                          <p className="text-sm text-gray-500">ID: {booking.tracking_id}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pickup</p>
                            <p className="text-sm text-gray-900">{booking.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Destination</p>
                            <p className="text-sm text-gray-900">{booking.delivery_location || booking.destination}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date</p>
                            <p className="text-sm text-gray-900">{booking.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Time</p>
                            <p className="text-sm text-gray-900">{booking.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                          <p className="font-bold text-gray-900">KES {booking.amount}</p>
                        </div>
                        {booking.rating && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-yellow-700">{booking.rating}</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/track/${booking.tracking_id}`}
                        className="flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                      >
                        Track Order <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : hasSearched && !loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200"
              >
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No bookings found</h3>
                <p className="text-gray-500">We couldn't find any bookings associated with this phone number.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
