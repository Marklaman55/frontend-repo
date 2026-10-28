import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { statsService, bookingService, driverService, promoService, galleryService } from '../services/api';

interface AppContextType {
  stats: any;
  bookings: any[];
  drivers: any[];
  promotions: any[];
  galleryItems: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [s, b, d, p, g] = await Promise.all([
        statsService.get(),
        bookingService.getAll(),
        driverService.getAll(),
        promoService.getAll(),
        galleryService.getAll()
      ]);
      setStats(s);
      setBookings(b);
      setDrivers(d);
      setPromotions(p);
      setGalleryItems(g);
    } catch (err) {
      console.error('Failed to fetch app data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ stats, bookings, drivers, promotions, galleryItems, loading, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
