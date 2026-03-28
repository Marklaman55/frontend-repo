import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Truck, Package, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { bookingService } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Tracking = () => {
  const [trackingId, setTrackingId] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket && booking?.driver_id) {
      socket.on('locationUpdate', (data: any) => {
        if (data.driver_id === booking.driver_id) {
          setDriverLocation(data.location);
        }
      });
    }
    return () => {
      if (socket) socket.off('locationUpdate');
    };
  }, [socket, booking]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getTrack(trackingId);
      if (data) {
        setBooking(data);
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

  const statusSteps = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { status: 'in-transit', label: 'In Transit', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: Package }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === booking?.status);

  return (
    <div className="py-24 px-6 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Real-Time Updates</span>
          <h1 className="text-5xl md:text-7xl font-bold serif italic text-secondary mb-6">Track Your Order</h1>
          <p className="text-accent max-w-xl mx-auto text-lg">
            Enter your tracking ID to see the real-time status and location of your delivery or tour.
          </p>
        </div>

        <form onSubmit={handleTrack} className="relative max-w-2xl mx-auto mb-20">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID (e.g., KTD-123456)"
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
              className="space-y-12"
            >
              {/* Status Timeline */}
              <div className="bg-bg-light p-12 rounded-[3rem] border border-stone-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative">
                  {/* Progress Line */}
                  <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-stone-200 -translate-y-1/2 z-0" />
                  <div 
                    className="hidden md:block absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-1000" 
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  />

                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.status} className="relative z-10 flex flex-row md:flex-col items-center gap-6 md:gap-4 flex-1">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                          isActive ? 'bg-primary-gradient text-white scale-110' : 'bg-white text-stone-300'
                        }`}>
                          <step.icon className="w-8 h-8" />
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`font-bold text-sm uppercase tracking-widest ${isActive ? 'text-secondary' : 'text-stone-400'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-primary animate-pulse block mt-1">Current Status</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Service Details</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                      <span className="text-stone-400 text-sm font-medium">Type</span>
                      <span className="font-bold uppercase tracking-widest text-xs text-primary">{booking.type}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                      <span className="text-stone-400 text-sm font-medium">Customer</span>
                      <span className="font-bold text-secondary">{booking.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                      <span className="text-stone-400 text-sm font-medium">Tracking ID</span>
                      <span className="font-mono font-bold text-primary">{booking.tracking_id}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary p-10 rounded-[3rem] text-white shadow-2xl space-y-8">
                  <h3 className="text-2xl font-bold serif italic">Route Information</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 text-primary">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">From</p>
                        <p className="font-bold">{booking.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 text-primary">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">To</p>
                        <p className="font-bold">{booking.delivery_location || booking.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-bg-light rounded-[3rem] h-[500px] flex items-center justify-center border border-stone-200 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#C62828_1px,transparent_1px)] [background-size:30px_30px]" />
                </div>
                <div className="text-center relative z-10 p-12">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl text-primary animate-bounce">
                    <MapPin className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-bold serif italic text-secondary mb-4">Live Map Tracking</h3>
                  <p className="text-accent max-w-md mx-auto">
                    {driverLocation 
                      ? `Driver is currently at ${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`
                      : 'Waiting for live location updates from the driver...'}
                  </p>
                  <div className="mt-10 flex justify-center gap-4">
                    <div className="px-6 py-2 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-100 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Live Connection
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
