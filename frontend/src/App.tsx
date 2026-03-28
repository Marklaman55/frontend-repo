import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './layout/Layout';

const Home = lazy(() => import('./pages/Home'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Admin = lazy(() => import('./pages/Admin'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));

const LoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<Bookings />} />
              <Route path="/track" element={<Tracking />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/driver" element={<DriverDashboard />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}
