import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function DriverDashboard() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/drivers').then(res => res.json()).then(setDrivers);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTracking && selectedDriver) {
      const socket = io();
      
      const sendLocation = () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setLocation({ lat: latitude, lng: longitude });
              socket.emit("driver:location", {
                driverId: selectedDriver.id,
                lat: latitude,
                lng: longitude
              });
              setError(null);
            },
            (err) => {
              setError("Geolocation permission denied or unavailable.");
              console.error(err);
            },
            { enableHighAccuracy: true }
          );
        } else {
          setError("Geolocation is not supported by your browser.");
        }
      };

      sendLocation();
      interval = setInterval(sendLocation, 5000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [isTracking, selectedDriver]);

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
    <div className="py-20 px-6 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden"
      >
        <div className="bg-stone-900 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {selectedDriver.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedDriver.name}</h2>
              <p className="text-xs text-stone-400 uppercase tracking-widest">{selectedDriver.vehicle}</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsTracking(false); setSelectedDriver(null); }}
            className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-500 ${
              isTracking ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-stone-100 text-stone-400'
            }`}>
              <MapPin className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {isTracking ? 'GPS Tracking Active' : 'Ready to Start?'}
            </h3>
            <p className="text-stone-500 text-sm">
              {isTracking 
                ? 'Your location is being broadcasted to the admin and customers.' 
                : 'Enable tracking to let customers know where their package is.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {location && isTracking && (
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
              <div className="flex justify-between text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                <span>Current Coordinates</span>
                <span className="text-emerald-600">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-tighter">Latitude</p>
                  <p className="text-lg font-mono font-bold">{location.lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-tighter">Longitude</p>
                  <p className="text-lg font-mono font-bold">{location.lng.toFixed(6)}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`w-full py-5 rounded-full font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
              isTracking 
                ? 'bg-rose-600 text-white hover:bg-rose-700' 
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start My Shift'}
          </button>
        </div>

        <div className="bg-stone-50 p-6 border-t border-stone-100 flex items-center justify-center gap-8 text-stone-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Verified Driver</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
