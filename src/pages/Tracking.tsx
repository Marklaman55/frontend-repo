import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Truck, Package, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, Phone, User, ExternalLink, Star, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { bookingService } from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../lib/socket';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DriverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Truck/Driver icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to auto-center map on driver location
const RecenterMap = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const Tracking = () => {
  const { trackingId: urlTrackingId } = useParams();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [eta, setEta] = useState<string | null>(null);

  // Persistent tracking logic
  useEffect(() => {
    const savedId = localStorage.getItem('lastTrackingId');
    if (savedId && !urlTrackingId) {
      navigate(`/track/${savedId}`);
    }
  }, [urlTrackingId, navigate]);

  useEffect(() => {
    if (urlTrackingId) {
      handleTrack(urlTrackingId);
      localStorage.setItem('lastTrackingId', urlTrackingId);
    }
  }, [urlTrackingId]);

  // Socket connection and room joining
  useEffect(() => {
    if (booking?.tracking_id) {
      connectSocket();
      
      socket.on('connect', () => {
        setIsSocketConnected(true);
        socket.emit('joinRoom', booking.tracking_id);
      });

      socket.on('locationUpdate', (data: any) => {
        console.log('Location update received:', data);
        setDriverLocation([data.lat, data.lng]);
        calculateEta(data.lat, data.lng);
      });

      socket.on('disconnect', () => {
        setIsSocketConnected(false);
      });

      // Fallback polling if socket fails
      const fallbackInterval = setInterval(async () => {
        if (!socket.connected) {
          try {
            const data = await bookingService.getTrack(booking.tracking_id);
            if (data?.last_lat && data?.last_lng) {
              setDriverLocation([data.last_lat, data.last_lng]);
            }
          } catch (err) {
            console.error('Fallback polling failed:', err);
          }
        }
      }, 5000);

      return () => {
        socket.off('connect');
        socket.off('locationUpdate');
        socket.off('disconnect');
        clearInterval(fallbackInterval);
        disconnectSocket();
      };
    }
  }, [booking?.tracking_id]);

  const handleTrack = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getTrack(id);
      if (data) {
        setBooking(data);
        if (data.last_lat && data.last_lng) {
          setDriverLocation([data.last_lat, data.last_lng]);
          calculateEta(data.last_lat, data.last_lng, data);
        }
        if (data.rating) {
          setRating(data.rating);
          setRatingSubmitted(true);
        }
      } else {
        setError('No booking found with this ID. Please check and try again.');
        setBooking(null);
      }
    } catch (err) {
      setError('Failed to fetch tracking information.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEta = (driverLat: number, driverLng: number, currentBooking = booking) => {
    if (!currentBooking?.dest_lat || !currentBooking?.dest_lng) return;

    // Simple haversine-like distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (currentBooking.dest_lat - driverLat) * Math.PI / 180;
    const dLon = (currentBooking.dest_lng - driverLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLat * Math.PI / 180) * Math.cos(currentBooking.dest_lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Assume average speed of 30 km/h in city traffic
    const timeInHours = distance / 30;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 1) {
      setEta('Arriving now');
    } else {
      setEta(`${timeInMinutes} mins`);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setCancelling(true);
    try {
      await bookingService.update(booking.id, { status: 'Cancelled' });
      setBooking({ ...booking, status: 'Cancelled' });
    } catch (err) {
      alert('Failed to cancel booking. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRate = async (value: number) => {
    if (!booking || ratingSubmitted) return;
    setRating(value);
    try {
      await bookingService.submitRating(booking.id, value);
      setRatingSubmitted(true);
    } catch (err) {
      alert('Failed to submit rating.');
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track/${trackingId.trim()}`);
    }
  };

  const statusSteps = [
    { status: 'Pending', label: 'Order Placed', icon: Clock },
    { status: 'Assigned', label: 'Driver Assigned', icon: User },
    { status: 'On the way', label: 'In Transit', icon: Truck },
    { status: 'Arrived', label: 'Delivered', icon: Package }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === booking?.status);

  const getWhatsAppLink = () => {
    const message = `Hello, I am tracking my booking ${booking.tracking_id}. Current status: ${booking.status}.`;
    return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="py-24 px-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Real-Time Updates</span>
          <h1 className="text-5xl md:text-7xl font-bold serif italic text-secondary mb-6">Track Your Order</h1>
          <p className="text-accent max-w-xl mx-auto text-lg">
            Enter your tracking ID to see the real-time status and location of your delivery or tour.
          </p>
        </div>

        {!booking && (
          <form onSubmit={onFormSubmit} className="relative max-w-2xl mx-auto mb-20">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Tracking ID (e.g., EM-XXXXXX)"
              className="w-full bg-bg-light border-none rounded-[2.5rem] px-10 py-8 text-xl font-medium focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-stone-400 shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 bg-primary-gradient text-white px-10 rounded-full font-bold hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/20"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Track <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex items-center gap-6 text-red-600 mb-12"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="font-bold">{error}</p>
            </motion.div>
          )}

          {booking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                  <button 
                    onClick={() => { setBooking(null); navigate('/track'); localStorage.removeItem('lastTrackingId'); }}
                    className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-primary transition-colors mb-4 flex items-center gap-2"
                  >
                    ← Track another order
                  </button>
                  <h2 className="text-3xl font-bold text-secondary">Tracking ID: <span className="text-primary font-mono">{booking.tracking_id}</span></h2>
                </div>
                <div className="flex gap-4">
                  {(booking.status === 'Pending' || booking.status === 'Assigned') && (
                    <button 
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
                    >
                      {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Cancel Booking
                    </button>
                  )}
                  <a 
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-emerald-500 text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Phone className="w-4 h-4" /> WhatsApp Support
                  </a>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-bg-light p-8 md:p-12 rounded-[3rem] border border-stone-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                  <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-stone-200 -translate-y-1/2 z-0" />
                  <div 
                    className="hidden md:block absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-1000" 
                    style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
                  />

                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.status} className="relative z-10 flex flex-row md:flex-col items-center gap-6 md:gap-4 flex-1">
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                          isActive ? 'bg-primary-gradient text-white scale-110' : 'bg-white text-stone-300'
                        }`}>
                          <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`font-bold text-[10px] md:text-xs uppercase tracking-widest ${isActive ? 'text-secondary' : 'text-stone-400'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[8px] md:text-[10px] font-bold text-primary animate-pulse block mt-1">Current Status</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold serif italic text-secondary">Service Details</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                        <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">Type</span>
                        <span className="font-bold uppercase tracking-widest text-[10px] text-primary">{booking.type}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                        <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">Customer</span>
                        <span className="font-bold text-secondary text-sm">{booking.customer_name}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                        <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">Date/Time</span>
                        <span className="font-bold text-secondary text-sm">{booking.date} at {booking.time}</span>
                      </div>
                      {eta && booking.status === 'On the way' && (
                        <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                          <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">Estimated Arrival</span>
                          <span className="font-bold text-primary text-sm animate-pulse">{eta}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.status === 'Arrived' && (
                    <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 space-y-6">
                      <h3 className="text-xl font-bold serif italic text-orange-900">Rate your experience</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(star)}
                            disabled={ratingSubmitted}
                            className={`p-2 transition-all ${rating >= star ? 'text-orange-500' : 'text-stone-300'}`}
                          >
                            <Star className={`w-8 h-8 ${rating >= star ? 'fill-orange-500' : ''}`} />
                          </button>
                        ))}
                      </div>
                      {ratingSubmitted && (
                        <p className="text-sm font-bold text-orange-700">Thank you for your feedback!</p>
                      )}
                    </div>
                  )}

                  {booking.driver_name && (
                    <div className="bg-secondary p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
                      <h3 className="text-xl font-bold serif italic">Driver Assigned</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary">
                          {booking.driver_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{booking.driver_name}</p>
                          <p className="text-xs text-stone-400 uppercase tracking-widest">{booking.driver_vehicle}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Driver Contact</p>
                        <p className="font-bold text-primary">{booking.driver_phone || 'Contact Admin'}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-bg-light p-8 rounded-[2.5rem] border border-stone-200 space-y-6">
                    <h3 className="text-xl font-bold serif italic text-secondary">Route</h3>
                    <div className="space-y-6 relative">
                      <div className="absolute left-5 top-8 bottom-8 w-px bg-dashed border-l border-stone-300" />
                      <div className="flex gap-4 relative z-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 text-primary shadow-sm border border-stone-100">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Pickup</p>
                          <p className="font-bold text-sm text-secondary">{booking.pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 relative z-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 text-secondary shadow-sm border border-stone-100">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Destination</p>
                          <p className="font-bold text-sm text-secondary">{booking.delivery_location || booking.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Map */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-[3rem] h-[600px] border border-stone-200 relative overflow-hidden shadow-sm">
                    {driverLocation ? (
                      <MapContainer 
                        center={driverLocation} 
                        zoom={15} 
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={driverLocation} icon={DriverIcon}>
                          <Popup>
                            <div className="p-2">
                              <p className="font-bold text-secondary">{booking.driver_name || 'Driver'}</p>
                              <p className="text-xs text-stone-500">{booking.status}</p>
                            </div>
                          </Popup>
                        </Marker>
                        <RecenterMap position={driverLocation} />
                      </MapContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-24 h-24 bg-bg-light rounded-[2rem] flex items-center justify-center mb-8 text-stone-300">
                          <MapPin className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold serif italic text-secondary mb-4">Waiting for Driver Location</h3>
                        <p className="text-accent max-w-xs mx-auto">
                          Once the driver starts their shift and enables GPS, you'll see their live position on this map.
                        </p>
                      </div>
                    )}

                    {/* Connection Status Overlay */}
                    <div className="absolute bottom-6 left-6 z-[1000]">
                      <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl ${
                        isSocketConnected 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-rose-500 text-white'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-white animate-ping' : 'bg-white'}`} />
                        {isSocketConnected ? 'Live Connection Active' : 'Connecting...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tracking;
