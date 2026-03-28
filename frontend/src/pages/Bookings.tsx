import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Compass, User, CheckCircle2, Loader2, DollarSign, Calendar, Clock, MapPin, Package, ShieldCheck, Smartphone } from 'lucide-react';
import { bookingService, paymentService, mpesaService } from '../services/api';

const Bookings = () => {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'tour');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    pickup_location: '',
    delivery_location: '',
    destination: '',
    package_description: '',
    tour_package: 'Maasai Mara Safari',
    num_people: 1,
    num_hours: 1,
    date: '',
    time: ''
  });

  const amount = useMemo(() => {
    if (type === 'tour') return 5000;
    if (type === 'delivery') return 500;
    if (type === 'chauffeur') return 1500 * formData.num_hours;
    return 0;
  }, [type, formData.num_hours]);

  const pollPaymentStatus = async (bookingId: number) => {
    const interval = setInterval(async () => {
      try {
        const bookings = await bookingService.getAll();
        const booking = bookings.find((b: any) => b.id === bookingId);
        
          if (booking) {
          if (booking.payment_status === 'SUCCESS') {
            clearInterval(interval);
            setIsWaitingForPayment(false);
            setSuccess(`Your ${type} booking has been confirmed and paid via M-Pesa! ✅`);
            if (booking.tracking_id) setTrackingId(booking.tracking_id);
            if (booking.payment_reference) setPaymentRef(booking.payment_reference);
            setLoading(false);
          } else if (booking.payment_status === 'FAILED') {
            clearInterval(interval);
            setIsWaitingForPayment(false);
            setLoading(false);
            alert("Payment Failed ❌. Please try again.");
          } else if (booking.payment_status === 'CANCELLED' || booking.status === 'Cancelled') {
            clearInterval(interval);
            setIsWaitingForPayment(false);
            setLoading(false);
            alert("Payment Cancelled ⚠️. Please try again.");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (isWaitingForPayment) {
        setIsWaitingForPayment(false);
        setLoading(false);
        setSuccess("Payment confirmation timed out. The transaction has been marked as cancelled. ⚠️");
      }
    }, 30000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await bookingService.create({ ...formData, type, amount });
      
      if (data.success) {
        const bookingId = data.id;
        
        // Trigger M-Pesa STK Push
        setIsWaitingForPayment(true);
        const mpesaResponse = await mpesaService.stkPush({
          phone: formData.customer_phone,
          amount: amount,
          booking_id: bookingId
        });

        if (mpesaResponse.success) {
          const checkoutRequestID = mpesaResponse.data.CheckoutRequestID;
          // Update booking with payment reference
          await bookingService.update(bookingId, { payment_reference: checkoutRequestID });
          
          // Start polling for payment status
          pollPaymentStatus(bookingId);
        } else {
          alert("M-Pesa STK Push failed. Please try again.");
          setIsWaitingForPayment(false);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setIsWaitingForPayment(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 bg-bg-light">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-stone-100"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold serif italic mb-2 text-secondary">Payment Successful! ✅</h2>
          <p className="text-emerald-600 font-bold mb-6 text-sm uppercase tracking-widest">Transaction Confirmed</p>
          
          <div className="space-y-4 mb-8">
            <p className="text-accent text-lg leading-relaxed">{success}</p>
            
            {paymentRef && (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">M-Pesa Reference</span>
                <span className="text-lg font-mono font-bold text-secondary">{paymentRef}</span>
              </div>
            )}
          </div>

          {trackingId && (
            <div className="bg-bg-light p-8 rounded-3xl mb-8 border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] block mb-3">Your Tracking ID</span>
              <code className="text-3xl font-mono font-bold text-primary tracking-tighter">{trackingId}</code>
              <p className="text-[10px] text-stone-400 mt-4">Save this ID to track your {type} in real-time.</p>
            </div>
          )}
          
          <button 
            onClick={() => { setSuccess(null); setTrackingId(null); setPaymentRef(null); }}
            className="w-full bg-primary-gradient text-white py-5 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            Make Another Booking
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6 bg-white">
      <AnimatePresence>
        {isWaitingForPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Smartphone className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-bold serif italic text-secondary mb-4">Check Your Phone</h3>
              <p className="text-accent mb-8">
                An M-Pesa STK Push has been sent to <strong>{formData.customer_phone}</strong>. 
                Please enter your PIN to complete the payment of <strong>KES {amount.toLocaleString()}</strong>.
              </p>
              <div className="flex items-center justify-center gap-3 text-primary font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="uppercase tracking-widest text-xs">Waiting for Confirmation...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Reservation</span>
          <h1 className="text-5xl md:text-7xl font-bold serif italic text-secondary mb-6">Book a Service</h1>
          <p className="text-accent max-w-xl mx-auto text-lg">
            Experience seamless logistics and travel. Select your service and provide the details below.
          </p>
        </div>

        <div className="flex flex-wrap bg-bg-light p-3 rounded-[2.5rem] mb-16 gap-2">
          {[
            { id: 'tour', label: 'Tours', icon: Compass },
            { id: 'delivery', label: 'Deliveries', icon: Truck },
            { id: 'chauffeur', label: 'Chauffeur', icon: User }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${
                type === t.id ? 'bg-primary-gradient text-white shadow-xl shadow-primary/20' : 'text-accent hover:text-secondary'
              }`}
            >
              <t.icon className="w-5 h-5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-10 md:p-12 rounded-[3rem] border border-stone-200 shadow-sm space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <User className="w-3 h-3 text-primary" /> Full Name
                  </label>
                  <input 
                    required name="customer_name" value={formData.customer_name} onChange={handleChange}
                    className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Truck className="w-3 h-3 text-primary" /> Phone Number
                  </label>
                  <input 
                    required name="customer_phone" value={formData.customer_phone} onChange={handleChange}
                    className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
              </div>

              {type === 'tour' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                      <Compass className="w-3 h-3 text-primary" /> Tour Package
                    </label>
                    <select 
                      name="tour_package" value={formData.tour_package} onChange={handleChange}
                      className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                    >
                      <option>Maasai Mara Safari</option>
                      <option>Amboseli National Park</option>
                      <option>Diani Beach Getaway</option>
                      <option>Mount Kenya Trek</option>
                      <option>Nairobi City Tour</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                      <User className="w-3 h-3 text-primary" /> Number of People
                    </label>
                    <input 
                      type="number" min="1" name="num_people" value={formData.num_people} onChange={handleChange}
                      className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {type === 'delivery' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" /> Pickup Location
                      </label>
                      <input 
                        required name="pickup_location" value={formData.pickup_location} onChange={handleChange}
                        className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="Street, Area, City"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" /> Delivery Location
                      </label>
                      <input 
                        required name="delivery_location" value={formData.delivery_location} onChange={handleChange}
                        className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="Street, Area, City"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                      <Package className="w-3 h-3 text-primary" /> Package Description
                    </label>
                    <textarea 
                      required name="package_description" value={formData.package_description} onChange={handleChange}
                      className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[120px]"
                      placeholder="What are we delivering?"
                    />
                  </div>
                </div>
              )}

              {type === 'chauffeur' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" /> Pickup Location
                      </label>
                      <input 
                        required name="pickup_location" value={formData.pickup_location} onChange={handleChange}
                        className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" /> Destination
                      </label>
                      <input 
                        required name="destination" value={formData.destination} onChange={handleChange}
                        className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary" /> Number of Hours
                    </label>
                    <input 
                      type="number" min="1" name="num_hours" value={formData.num_hours} onChange={handleChange}
                      className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {type === 'tour' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-primary" /> Pickup Location
                  </label>
                  <input 
                    required name="pickup_location" value={formData.pickup_location} onChange={handleChange}
                    className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="Hotel or Residence"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-primary" /> Date
                  </label>
                  <input 
                    required type="date" name="date" value={formData.date} onChange={handleChange}
                    className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-primary" /> Time
                  </label>
                  <input 
                    required type="time" name="time" value={formData.time} onChange={handleChange}
                    className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-primary-gradient text-white py-6 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-primary/30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Pay Now'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-secondary p-10 rounded-[3rem] text-white sticky top-32 shadow-2xl">
              <h3 className="text-2xl font-bold serif italic mb-8">Booking Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-white/10">
                  <span className="text-stone-400 text-sm">Service Type</span>
                  <span className="font-bold uppercase tracking-widest text-xs text-primary">{type}</span>
                </div>
                <div className="flex justify-between items-center pb-6 border-b border-white/10">
                  <span className="text-stone-400 text-sm">Base Rate</span>
                  <span className="font-bold">KES {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-3xl font-bold text-primary">KES {amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">Secure Payment</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  Your payment is processed securely via M-Pesa Daraja. We support STK Push for instant confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Bookings);
