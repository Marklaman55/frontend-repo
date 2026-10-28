import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Shield, AlertCircle, CheckCircle, Loader2, Truck, Package, Clock, LogOut, Play, Square, Power } from 'lucide-react';
import { driverService, bookingService } from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../lib/socket';

export default function DriverDashboard() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    driverService.getAll().then(setDrivers);
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      fetchBookings();
      setIsAvailable(selectedDriver.status === 'Available');
      const interval = setInterval(fetchBookings, 30000); // Refresh bookings every 30s
      return () => clearInterval(interval);
    }
  }, [selectedDriver]);

  const toggleAvailability = async () => {
    if (!selectedDriver || updatingStatus) return;
    setUpdatingStatus(true);
    const newStatus = isAvailable ? 'Unavailable' : 'Available';
    try {
      await driverService.updateStatus(selectedDriver.id, newStatus);
      setIsAvailable(!isAvailable);
      setSelectedDriver({ ...selectedDriver, status: newStatus });
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedDriver) return;
    try {
      const data = await driverService.getBookings(selectedDriver.id);
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const startTracking = (booking: any) => {
    setActiveBooking(booking);
    setIsTracking(true);
    connectSocket();
    
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Emit location to server
          socket.emit("driverLocation", {
            driverId: selectedDriver.id,
            trackingId: booking.tracking_id,
            lat: latitude,
            lng: longitude
          });
          
          setError(null);
        },
        (err) => {
          setError("Geolocation permission denied or unavailable.");
          console.error(err);
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setActiveBooking(null);
    disconnectSocket();
  };

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      await bookingService.update(id, { status });
      fetchBookings();
      if (activeBooking && activeBooking.id === id) {
        setActiveBooking({ ...activeBooking, status });
        if (status === 'Arrived') {
          stopTracking();
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!selectedDriver) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
          <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mb-8">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold serif italic mb-4">Driver Login</h2>
          <p className="text-stone-500 mb-8">Select your name to start your shift and enable GPS tracking.</p>
          <div className="space-y-3">
            {drivers.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDriver(d)}
                className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200 hover:border-stone-900 hover:bg-stone-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-600 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    {d.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">{d.vehicle}</p>
                  </div>
                </div>
                <Navigation className="w-4 h-4 text-stone-300 group-hover:text-stone-900" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Driver Profile & Status */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden"
          >
            <div className="bg-stone-900 p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {selectedDriver.name[0]}
                </div>
                <button 
                  onClick={() => { stopTracking(); setSelectedDriver(null); }}
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold">{selectedDriver.name}</h2>
              <p className="text-xs text-stone-400 uppercase tracking-widest">{selectedDriver.vehicle}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Status</p>
                    <p className={`text-sm font-bold ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAvailability}
                  disabled={updatingStatus}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isAvailable ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAvailable ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-500 ${
                  isTracking ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-stone-100 text-stone-400'
                }`}>
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg">
                  {isTracking ? 'GPS Active' : 'Offline'}
                </h3>
                {isTracking && activeBooking && (
                  <p className="text-stone-500 text-xs mt-1">Tracking: {activeBooking.tracking_id}</p>
                )}
              </div>

              {location && isTracking && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-[8px] text-stone-400 uppercase tracking-tighter">Lat</p>
                      <p className="text-sm font-mono font-bold">{location.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-stone-400 uppercase tracking-tighter">Lng</p>
                      <p className="text-sm font-mono font-bold">{location.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Assigned Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold serif italic text-secondary">Assigned Bookings</h3>
            <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {bookings.length} Active
            </span>
          </div>

          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-stone-200 text-center">
                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-300">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-stone-400 font-medium">No active bookings assigned to you.</p>
              </div>
            ) : (
              bookings.map(booking => (
                <motion.div 
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white p-6 rounded-3xl border transition-all ${
                    activeBooking?.id === booking.id ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-stone-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{booking.type}</span>
                        <span className="text-stone-300">•</span>
                        <span className="font-mono font-bold text-xs text-secondary">{booking.tracking_id}</span>
                      </div>
                      <h4 className="text-lg font-bold text-secondary">{booking.customer_name}</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      booking.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                      booking.status === 'Assigned' ? 'bg-blue-100 text-blue-600' :
                      booking.status === 'On the way' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {booking.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center shrink-0 text-stone-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] text-stone-400 uppercase tracking-widest font-bold mb-0.5">Pickup</p>
                        <p className="text-xs font-bold text-secondary truncate">{booking.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center shrink-0 text-stone-400">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] text-stone-400 uppercase tracking-widest font-bold mb-0.5">Dropoff</p>
                        <p className="text-xs font-bold text-secondary truncate">{booking.delivery_location || booking.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {activeBooking?.id === booking.id ? (
                      <>
                        <button
                          onClick={stopTracking}
                          className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors"
                        >
                          <Square className="w-4 h-4" /> Stop Tracking
                        </button>
                        <select 
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                          className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold text-xs px-4 focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="On the way">On the way</option>
                          <option value="Arrived">Mark as Delivered</option>
                        </select>
                      </>
                    ) : (
                      <button
                        onClick={() => startTracking(booking)}
                        disabled={isTracking}
                        className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" /> Start Tracking
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
