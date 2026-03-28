import React from 'react';
import { motion } from 'motion/react';
import { Check, Truck, Compass, User, Package, MapPin, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const deliveryPlans = [
    {
      name: "Local Express",
      price: "500",
      period: "per delivery",
      desc: "Perfect for small parcels within the city.",
      features: ["Same-day delivery", "Real-time tracking", "Up to 5kg", "Insurance included"]
    },
    {
      name: "Inter-City",
      price: "1,500",
      period: "per delivery",
      desc: "Reliable transport between major towns.",
      features: ["24-48h delivery", "Secure handling", "Up to 20kg", "Door-to-door service"]
    },
    {
      name: "Bulk Logistics",
      price: "5,000",
      period: "starting from",
      desc: "For large shipments and business needs.",
      features: ["Dedicated truck", "Priority handling", "Unlimited weight", "Custom scheduling"]
    }
  ];

  const tourPackages = [
    {
      name: "City Explorer",
      price: "3,500",
      period: "per person",
      desc: "A full day exploring Nairobi's landmarks.",
      features: ["Professional guide", "Entry fees included", "Lunch provided", "Transport included"]
    },
    {
      name: "Safari Adventure",
      price: "15,000",
      period: "per person",
      desc: "3-day trip to Maasai Mara or Amboseli.",
      features: ["Luxury 4x4 vehicle", "Full board meals", "Game drives", "Park entry fees"]
    },
    {
      name: "Coastal Escape",
      price: "25,000",
      period: "per person",
      desc: "5-day relaxing trip to Diani or Watamu.",
      features: ["Flight included", "Beachfront hotel", "Water sports", "Airport transfers"]
    }
  ];

  return (
    <div className="pb-32 bg-white">
      {/* Header */}
      <section className="bg-secondary py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#C62828_20px,#C62828_21px)]" />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-bold uppercase tracking-[0.4em] text-xs mb-6 block"
          >
            Transparent Rates
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold serif italic text-white mb-8"
          >
            Simple <span className="text-primary">Pricing.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-stone-400 text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Choose the plan that fits your needs with EasyMove Kenya. No hidden fees, just reliable service you can trust.
          </motion.p>
        </div>
      </section>

      {/* Delivery Pricing */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-16">
            <div className="w-16 h-16 bg-bg-light rounded-3xl flex items-center justify-center text-primary shadow-sm">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-bold serif italic text-secondary">Delivery Services</h2>
              <p className="text-accent font-medium">Fast and secure parcel logistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deliveryPlans.map((plan, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-bg-light p-12 rounded-[3rem] border border-stone-200 hover:border-primary/30 transition-all group flex flex-col"
              >
                <h3 className="text-xl font-bold text-secondary mb-2">{plan.name}</h3>
                <p className="text-accent text-sm mb-8 leading-relaxed">{plan.desc}</p>
                <div className="mb-10">
                  <span className="text-4xl font-bold text-secondary">KES {plan.price}</span>
                  <span className="text-stone-400 text-sm ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-stone-600 font-medium">
                      <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/book?type=delivery" className="w-full bg-white text-secondary border border-stone-200 py-4 rounded-full font-bold text-center hover:bg-primary-gradient hover:text-white hover:border-transparent transition-all shadow-sm">
                  Book Delivery
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Pricing */}
      <section className="py-32 px-6 bg-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-16">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary shadow-sm">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-bold serif italic text-secondary">Tour Packages</h2>
              <p className="text-accent font-medium">Explore the magic of Kenya</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tourPackages.map((plan, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-12 rounded-[3rem] border border-stone-200 hover:border-primary/30 transition-all group flex flex-col shadow-sm"
              >
                <h3 className="text-xl font-bold text-secondary mb-2">{plan.name}</h3>
                <p className="text-accent text-sm mb-8 leading-relaxed">{plan.desc}</p>
                <div className="mb-10">
                  <span className="text-4xl font-bold text-secondary">KES {plan.price}</span>
                  <span className="text-stone-400 text-sm ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-stone-600 font-medium">
                      <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/book?type=tour" className="w-full bg-secondary text-white py-4 rounded-full font-bold text-center hover:bg-primary-gradient transition-all shadow-lg shadow-secondary/10">
                  Book Tour
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chauffeur Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-secondary rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1000" 
              alt="Chauffeur" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="text-primary font-bold uppercase tracking-[0.4em] text-xs mb-6 block">Premium Service</span>
            <h2 className="text-4xl md:text-6xl font-bold serif italic mb-8">Professional Chauffeur</h2>
            <p className="text-stone-400 text-xl mb-12 leading-relaxed">
              Experience luxury and comfort with our professional chauffeur services. Available for airport transfers, corporate events, and private travel.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">KES 1,500</p>
                  <p className="text-xs text-stone-500 uppercase tracking-widest">Per Hour</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">KES 10,000</p>
                  <p className="text-xs text-stone-500 uppercase tracking-widest">Full Day (8h)</p>
                </div>
              </div>
            </div>
            
            <Link to="/book?type=chauffeur" className="inline-block bg-primary-gradient text-white px-12 py-5 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              Book a Chauffeur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
