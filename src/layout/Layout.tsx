import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ChatWidget from '../components/ChatWidget';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-secondary font-sans">
      <Navbar />
      <main>
        {children}
      </main>
      <footer className="bg-secondary text-stone-400 py-20 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h3 className="text-white font-bold text-2xl mb-6 italic serif">EasyMove Kenya</h3>
            <p className="text-stone-500 leading-relaxed max-w-md text-lg">
              Kenya's most reliable transport and logistics partner. We deliver excellence through speed, safety, and professional service.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.3em]">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/book" className="hover:text-primary transition-colors">Book a Service</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
              <li><Link to="/track" className="hover:text-primary transition-colors">Track Delivery</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.3em]">Contact Us</h4>
            <div className="space-y-4 text-sm">
              <p className="flex items-center gap-3"><span className="text-primary">Location:</span> Nairobi, Kenya</p>
              <p className="flex items-center gap-3"><span className="text-primary">Phone:</span> +254 712 345 678</p>
              <p className="flex items-center gap-3"><span className="text-primary">Email:</span> info@easymovekenya.com</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <p>&copy; {new Date().getFullYear()} EasyMove Kenya. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
