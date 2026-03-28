import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Truck, MapPin, Home, Menu, X, DollarSign, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Services', path: '/book', icon: Truck },
    { name: 'Pricing', path: '/pricing', icon: DollarSign },
    { name: 'Tracking', path: '/track', icon: MapPin },
    { name: 'Admin', path: '/admin', icon: ShieldAlert },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-secondary text-white px-6 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl italic serif shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            E
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-xl leading-none tracking-tight text-white">EasyMove</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Kenya</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-bold uppercase tracking-widest transition-all hover:text-primary flex items-center gap-2 relative py-2",
                location.pathname === item.path ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" : "text-stone-300"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/book"
            className="hidden sm:block bg-primary-gradient text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            Book Now
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-stone-300 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 top-[72px] bg-secondary z-40 md:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <div className="p-8 space-y-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "flex items-center gap-4 text-xl font-bold uppercase tracking-widest p-4 rounded-2xl transition-all",
                location.pathname === item.path ? "bg-primary text-white" : "text-stone-400 hover:bg-stone-800"
              )}
            >
              <item.icon className="w-6 h-6" />
              {item.name}
            </Link>
          ))}
          <Link
            to="/book"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-center gap-4 w-full bg-primary-gradient text-white py-5 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20"
          >
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
