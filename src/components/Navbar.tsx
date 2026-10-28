import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, MapPin, User, ShieldCheck, Home } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Services', path: '/book', icon: Truck },
    { name: 'Tracking', path: '/track', icon: MapPin },
    { name: 'Admin', path: '/admin', icon: ShieldCheck },
    { name: 'Driver', path: '/driver', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center text-white font-bold text-xl italic serif">
            E
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">EasyMove</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">Kenya</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-stone-900 flex items-center gap-2",
                location.pathname === item.path ? "text-stone-900" : "text-stone-500"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <Link
          to="/book"
          className="bg-stone-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-sm"
        >
          Book Now
        </Link>
      </div>
    </nav>
  );
}
