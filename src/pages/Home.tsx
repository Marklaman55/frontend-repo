import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Truck, MapPin, Compass, Shield, Clock, Star, Package, Zap } from 'lucide-react';
import { galleryService, promoService } from '../services/api';

const Home = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    galleryService.getAll().then(setGallery);
    promoService.getAll().then(setPromos);
  }, []);

  const services = useMemo(() => [
    { title: 'Tours & Safaris', icon: Compass, desc: 'Explore the beauty of Kenya with our curated tour packages and experienced guides.' },
    { title: 'Parcel Delivery', icon: Package, desc: 'Fast, secure, and trackable delivery services for your packages across the country.' },
    { title: 'Transport Services', icon: Truck, desc: 'Reliable transport solutions for people and goods, ensuring comfort and safety.' },
    { title: 'Same-Day Delivery', icon: Zap, desc: 'Urgent delivery services within major cities, guaranteed same-day arrival.' }
  ], []);

  return (
    <div className="pb-20 bg-white">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0 opacity-50">
          <img 
            src="https://images.unsplash.com/photo-1516422213484-21438fe5d1a2?auto=format&fit=crop&q=80&w=2000" 
            alt="Kenya Safari" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-transparent" />
        </div>
        
        {/* Road Line Pattern */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,#fff,#fff_40px,transparent_40px,transparent_80px)] opacity-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-primary-gradient text-white px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold mb-6 inline-block shadow-lg shadow-primary/20">
              Premium Logistics & Travel
            </span>
            <h1 className="text-5xl md:text-8xl font-bold mb-8 leading-[0.9] tracking-tight text-white serif italic">
              Fast. Reliable. <span className="text-primary">Professional.</span>
            </h1>
            <p className="text-stone-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
              Kenya's leading partner for tours, parcel deliveries, and professional transport services with EasyMove Kenya.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="bg-primary-gradient text-white px-10 py-5 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-3 shadow-2xl shadow-primary/30">
                Book a Service <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/track" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-full font-bold hover:bg-white/20 transition-all">
                Track Delivery
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000" 
                alt="Travel" 
                className="w-full h-[600px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Floating Stats */}
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl z-20 border border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">100%</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Secure Delivery</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Our Expertise</span>
              <h2 className="text-4xl md:text-6xl font-bold serif italic text-secondary leading-tight">
                Logistics Solutions for Every Need
              </h2>
            </div>
            <p className="text-accent max-w-sm text-lg">
              Tailored transport and delivery services designed for speed, safety, and reliability across Kenya.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((s, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                className="bg-bg-light p-10 rounded-[2.5rem] border border-stone-200 hover:border-primary/30 transition-all group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary-gradient group-hover:text-white transition-all duration-500">
                  <s.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-secondary">{s.title}</h3>
                <p className="text-accent text-sm leading-relaxed mb-8">{s.desc}</p>
                <Link to="/book" className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions / Events */}
      {promos.length > 0 && (
        <section className="py-32 px-6 bg-secondary relative overflow-hidden">
          {/* Map Pattern Background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Limited Time</span>
              <h2 className="text-4xl md:text-6xl font-bold serif italic text-white">Featured Promotions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {promos.map((promo) => (
                <div key={promo.id} className="group relative overflow-hidden rounded-[3rem] bg-stone-800 aspect-[16/9] shadow-2xl">
                  {promo.image_url && (
                    <img 
                      src={promo.image_url} 
                      alt={promo.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent p-12 flex flex-col justify-end text-white">
                    <h3 className="text-3xl font-bold mb-4">{promo.title}</h3>
                    <p className="text-stone-300 text-lg max-w-md mb-8">{promo.description}</p>
                    <Link to="/book" className="w-fit bg-primary-gradient text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Claim Offer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
             <div className="rounded-[3rem] overflow-hidden shadow-2xl">
               <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" 
                alt="Logistics" 
                className="w-full h-[500px] object-cover"
                referrerPolicy="no-referrer"
              />
             </div>
             {/* Road Line Graphic */}
             <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-20 h-[80%] bg-[repeating-linear-gradient(0deg,transparent,transparent_20px,#C62828_20px,#C62828_40px)] opacity-10 hidden md:block" />
          </div>
          
          <div className="space-y-10">
            <div>
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Our Commitment</span>
              <h2 className="text-4xl md:text-6xl font-bold serif italic text-secondary leading-tight">
                Why Choose EasyMove Kenya?
              </h2>
            </div>
            
            <div className="space-y-8">
              {[
                { title: 'Real-Time Tracking', icon: MapPin, desc: 'Know exactly where your parcel or driver is at any moment with our live tracking system.' },
                { title: 'Professional Fleet', icon: Shield, desc: 'Our vehicles are regularly maintained and our drivers are highly trained professionals.' },
                { title: 'Transparent Pricing', icon: Clock, desc: 'No hidden costs. We provide clear, upfront pricing for all our services.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-bg-light rounded-2xl flex items-center justify-center shrink-0 text-primary">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-secondary mb-2">{item.title}</h4>
                    <p className="text-accent text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-32 px-6 bg-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Visual Journey</span>
            <h2 className="text-4xl md:text-6xl font-bold serif italic text-secondary">Experience EasyMove Kenya</h2>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
            {gallery.length > 0 ? gallery.map((item) => (
              <motion.div 
                key={item.id} 
                whileHover={{ scale: 1.02 }}
                className="break-inside-avoid rounded-[2rem] overflow-hidden group relative shadow-lg"
              >
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-white">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">{item.category}</span>
                  <h4 className="font-bold text-xl">{item.title}</h4>
                </div>
              </motion.div>
            )) : (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="break-inside-avoid rounded-[2rem] overflow-hidden bg-stone-200 aspect-[4/5] animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default React.memo(Home);
