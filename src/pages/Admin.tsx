import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, Users, CreditCard, Image as ImageIcon, 
  Tag, Plus, Trash2, CheckCircle2, XCircle, Loader2, LogOut, ShieldAlert, Pencil, Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { bookingService, driverService, galleryService, promoService, mpesaService, settingsService, faqService } from '../services/api';

const Admin = () => {
  const { stats, bookings, drivers, promotions, galleryItems, refreshData } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Modal States
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editingGallery, setEditingGallery] = useState<any>(null);

  // Form States
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', vehicle: '', image: null as File | null, status: 'Available' });
  const [promoForm, setPromoForm] = useState({ title: '', description: '', image: null as File | null });
  const [galleryForm, setGalleryForm] = useState({ category: 'tour', title: '', image: null as File | null });
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDriver) {
        const formData = new FormData();
        formData.append('name', driverForm.name);
        formData.append('phone', driverForm.phone);
        formData.append('vehicle', driverForm.vehicle);
        formData.append('status', driverForm.status);
        if (driverForm.image) formData.append('image', driverForm.image);
        await driverService.update(editingDriver.id, formData);
      } else {
        const formData = new FormData();
        formData.append('name', driverForm.name);
        formData.append('phone', driverForm.phone);
        formData.append('vehicle', driverForm.vehicle);
        if (driverForm.image) formData.append('image', driverForm.image);
        await driverService.create(formData);
      }
      setShowDriverModal(false);
      setEditingDriver(null);
      setDriverForm({ name: '', phone: '', vehicle: '', image: null, status: 'Available' });
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPromo) {
        await promoService.update(editingPromo.id, {
          title: promoForm.title,
          description: promoForm.description
        });
      } else {
        const formData = new FormData();
        formData.append('title', promoForm.title);
        formData.append('description', promoForm.description);
        if (promoForm.image) formData.append('image', promoForm.image);
        await promoService.create(formData);
      }
      
      setShowPromoModal(false);
      setEditingPromo(null);
      setPromoForm({ title: '', description: '', image: null });
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingGallery) {
        const formData = new FormData();
        formData.append('category', galleryForm.category);
        formData.append('title', galleryForm.title);
        if (galleryForm.image) formData.append('image', galleryForm.image);
        await galleryService.update(editingGallery.id, formData);
      } else {
        const formData = new FormData();
        formData.append('category', galleryForm.category);
        formData.append('title', galleryForm.title);
        if (galleryForm.image) formData.append('image', galleryForm.image);
        await galleryService.upload(formData);
      }
      setShowGalleryModal(false);
      setEditingGallery(null);
      setGalleryForm({ category: 'tour', title: '', image: null });
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'booking') await bookingService.delete(id);
      if (type === 'driver') await driverService.delete(id);
      if (type === 'promo') await promoService.delete(id);
      if (type === 'gallery') await galleryService.delete(id);
      refreshData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      faqService.getAll().then(setFaqs);
    }
  }, [isAuthenticated]);

  // Simple password protection as requested to "hide" the panel
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Placeholder password
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setLoading(true);
    try {
      await bookingService.update(id, { status });
      refreshData();
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingFaq) {
        await faqService.update(editingFaq.id, faqForm);
      } else {
        await faqService.create(faqForm);
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '' });
      faqService.getAll().then(setFaqs);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      await faqService.delete(id);
      faqService.getAll().then(setFaqs);
    }
  };

  const renderFaqs = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold serif italic text-secondary">FAQ Management</h2>
        <button 
          onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '' }); setShowFaqModal(true); }}
          className="bg-primary-gradient text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex items-start justify-between gap-6">
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-secondary">{faq.question}</h4>
              <p className="text-accent leading-relaxed">{faq.answer}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setEditingFaq(faq); setFaqForm({ question: faq.question, answer: faq.answer }); setShowFaqModal(true); }}
                className="p-3 text-stone-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDeleteFaq(faq.id)}
                className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 bg-secondary">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold serif italic mb-4 text-secondary">Restricted Access</h2>
          <p className="text-accent mb-10">Please enter the administrator password to continue.</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all text-center font-bold tracking-widest"
            />
            <button className="w-full bg-primary-gradient text-white py-5 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              Unlock Panel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Package },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'promos', label: 'Promotions', icon: Tag },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-bg-light flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-secondary text-white p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white font-bold text-2xl italic serif">K</div>
          <div>
            <h1 className="font-bold text-xl leading-none">Admin Hub</h1>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Control Center</p>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-stone-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setIsAuthenticated(false)}
          className="mt-12 flex items-center gap-4 px-6 py-4 text-stone-500 hover:text-white font-bold text-sm transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 md:p-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-end mb-16">
            <div>
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-2 block">Management</span>
              <h2 className="text-4xl font-bold serif italic text-secondary capitalize">{activeTab}</h2>
            </div>
            <div className="flex gap-4">
              <button onClick={refreshData} className="px-6 py-3 bg-white border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-bg-light transition-all">
                Refresh Data
              </button>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Total Bookings', value: stats.totalBookings, color: 'primary' },
                  { label: 'Active Drivers', value: stats.activeDrivers, color: 'emerald' },
                  { label: 'Revenue (KES)', value: stats.totalRevenue?.toLocaleString(), color: 'secondary' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">{stat.label}</p>
                    <p className={`text-5xl font-bold serif italic text-${stat.color === 'primary' ? 'primary' : stat.color === 'emerald' ? 'emerald-600' : 'secondary'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[3rem] border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-primary font-bold text-xs uppercase tracking-widest">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-light">
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Customer</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Service</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-bg-light/50 transition-colors">
                          <td className="px-10 py-6 font-bold text-secondary">{b.customer_name}</td>
                          <td className="px-10 py-6"><span className="text-xs font-bold uppercase tracking-widest text-stone-500">{b.type}</span></td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              b.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-10 py-6 font-bold">KES {b.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-[3rem] border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-light">
                      <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">ID</th>
                      <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Customer</th>
                      <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Service</th>
                      <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                      <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-bg-light/50 transition-colors">
                        <td className="px-10 py-6 font-mono text-xs text-stone-400">{b.tracking_id}</td>
                        <td className="px-10 py-6">
                          <p className="font-bold text-secondary">{b.customer_name}</p>
                          <p className="text-xs text-stone-400">{b.customer_phone}</p>
                        </td>
                        <td className="px-10 py-6"><span className="text-xs font-bold uppercase tracking-widest text-stone-500">{b.type}</span></td>
                        <td className="px-10 py-6">
                          <select 
                            value={b.status} 
                            onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                            className="bg-bg-light border-none rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in-transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-10 py-6 flex items-center gap-3">
                          <button 
                            onClick={() => handleDelete('booking', b.id)}
                            className="p-2 text-stone-400 hover:text-primary transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Driver Fleet</h3>
                  <button 
                    onClick={() => setShowDriverModal(true)}
                    className="flex items-center gap-2 bg-primary-gradient text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" /> Add Driver
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {drivers.map((driver: any) => (
                    <div key={driver.id} className="bg-bg-light p-8 rounded-[2.5rem] border border-stone-100">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm overflow-hidden">
                          {driver.image_url ? (
                            <img src={driver.image_url} alt={driver.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Users className="w-8 h-8" />
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            driver.status === 'Available' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-500'
                          }`}>
                            {driver.status}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingDriver(driver);
                                setDriverForm({ 
                                  name: driver.name, 
                                  phone: driver.phone, 
                                  vehicle: driver.vehicle, 
                                  status: driver.status,
                                  image: null 
                                });
                                setShowDriverModal(true);
                              }}
                              className="p-2 text-stone-400 hover:text-primary transition-colors"
                            >
                              <Tag className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete('driver', driver.id)}
                              className="p-2 text-stone-400 hover:text-primary transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-secondary mb-1">{driver.name}</h4>
                      <p className="text-stone-500 text-sm mb-4">{driver.vehicle}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                        <ShieldAlert className="w-4 h-4" /> {driver.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-12">
              <div className="bg-white rounded-[3rem] border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-stone-100">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Payment Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-light">
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Reference</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-stone-400">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bookings.filter((b: any) => b.payment_status === 'SUCCESS').map((b: any) => (
                        <tr key={b.id} className="hover:bg-bg-light/50 transition-colors">
                          <td className="px-10 py-6 font-mono text-xs text-stone-500">{b.payment_reference || `PAY-${b.id}`}</td>
                          <td className="px-10 py-6 font-bold text-secondary">KES {b.amount?.toLocaleString()}</td>
                          <td className="px-10 py-6">
                            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              SUCCESS ✅
                            </span>
                          </td>
                          <td className="px-10 py-6 text-xs text-stone-400">{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {bookings.filter((b: any) => b.payment_status === 'FAILED' || b.payment_status === 'CANCELLED').map((b: any) => (
                        <tr key={b.id} className="hover:bg-bg-light/50 transition-colors">
                          <td className="px-10 py-6 font-mono text-xs text-stone-500">{b.payment_reference || `PAY-${b.id}`}</td>
                          <td className="px-10 py-6 font-bold text-secondary">KES {b.amount?.toLocaleString()}</td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              b.payment_status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {b.payment_status} {b.payment_status === 'FAILED' ? '❌' : '⚠️'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-xs text-stone-400">{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Gallery Management</h3>
                  <button 
                    onClick={() => {
                      setEditingGallery(null);
                      setGalleryForm({ category: 'tour', title: '', image: null });
                      setShowGalleryModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary-gradient text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" /> Upload Image
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {galleryItems?.map((item: any) => (
                    <div key={item.id} className="group relative aspect-square rounded-[2.5rem] overflow-hidden bg-bg-light border border-stone-100">
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => {
                            setEditingGallery(item);
                            setGalleryForm({ category: item.category, title: item.title, image: null });
                            setShowGalleryModal(true);
                          }}
                          className="p-3 bg-white text-secondary rounded-2xl hover:scale-110 transition-transform shadow-xl"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete('gallery', item.id)}
                          className="p-3 bg-white text-primary rounded-2xl hover:scale-110 transition-transform shadow-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promos' && (
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-bold serif italic text-secondary">Promotions & Offers</h3>
                  <button 
                    onClick={() => setShowPromoModal(true)}
                    className="flex items-center gap-2 bg-primary-gradient text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    <Plus className="w-4 h-4" /> New Promotion
                  </button>
                </div>
                <div className="space-y-6">
                  {promotions.map((promo: any) => (
                    <div key={promo.id} className="flex items-center justify-between p-8 bg-bg-light rounded-[2.5rem] border border-stone-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm overflow-hidden">
                          {promo.image_url ? (
                            <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Tag className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-secondary mb-1">{promo.title}</h4>
                          <p className="text-stone-500 text-xs">{promo.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          onClick={() => {
                            setEditingPromo(promo);
                            setPromoForm({ title: promo.title, description: promo.description, image: null });
                            setShowPromoModal(true);
                          }}
                          className="p-3 text-stone-400 hover:text-primary transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete('promo', promo.id)}
                          className="p-3 text-stone-400 hover:text-primary transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faqs' && renderFaqs()}

          {activeTab === 'settings' && (
            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <h3 className="text-2xl font-bold serif italic text-secondary mb-8">API Credentials</h3>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      await settingsService.update(settings);
                      alert("Settings saved successfully!");
                    } catch (err) {
                      console.error("Error saving settings:", err);
                      alert("Failed to save settings.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-12"
                >
                  {/* M-Pesa Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                      <CreditCard className="w-6 h-6 text-primary" />
                      <h4 className="text-xl font-bold text-secondary">M-Pesa Daraja API</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Consumer Key</label>
                        <input 
                          type="password"
                          value={settings.mpesa_consumer_key || ''} 
                          onChange={e => setSettings({...settings, mpesa_consumer_key: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="Your M-Pesa Consumer Key" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Consumer Secret</label>
                        <input 
                          type="password"
                          value={settings.mpesa_consumer_secret || ''} 
                          onChange={e => setSettings({...settings, mpesa_consumer_secret: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="Your M-Pesa Consumer Secret" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Shortcode</label>
                        <input 
                          value={settings.mpesa_shortcode || ''} 
                          onChange={e => setSettings({...settings, mpesa_shortcode: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="174379 (Sandbox Default)" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Passkey</label>
                        <input 
                          type="password"
                          value={settings.mpesa_passkey || ''} 
                          onChange={e => setSettings({...settings, mpesa_passkey: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="Your M-Pesa Passkey" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Callback URL</label>
                        <input 
                          value={settings.mpesa_callback_url || ''} 
                          onChange={e => setSettings({...settings, mpesa_callback_url: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="https://your-domain.com/api/mpesa/callback" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                      <ShieldAlert className="w-6 h-6 text-primary" />
                      <h4 className="text-xl font-bold text-secondary">WhatsApp API (External)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">API Endpoint URL</label>
                        <input 
                          value={settings.whatsapp_api_url || ''} 
                          onChange={e => setSettings({...settings, whatsapp_api_url: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="https://api.ultramsg.com/instance123/messages/chat" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">API Token / Key</label>
                        <input 
                          type="password"
                          value={settings.whatsapp_api_key || ''} 
                          onChange={e => setSettings({...settings, whatsapp_api_key: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="Your API Token" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Admin WhatsApp Number</label>
                        <input 
                          value={settings.whatsapp_admin_number || ''} 
                          onChange={e => setSettings({...settings, whatsapp_admin_number: e.target.value})} 
                          className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" 
                          placeholder="254712345678" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full md:w-auto bg-primary-gradient text-white px-12 py-5 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-4"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save All Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modals */}
          <AnimatePresence>
            {showDriverModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[3rem] max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-bold serif italic text-secondary mb-8">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
                  <form onSubmit={handleAddDriver} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name</label>
                      <input required value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="Driver Name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone Number</label>
                      <input required value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="+254..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Vehicle Details</label>
                      <input required value={driverForm.vehicle} onChange={e => setDriverForm({...driverForm, vehicle: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="Make, Model, Plate" />
                    </div>
                    {editingDriver && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</label>
                        <select value={driverForm.status} onChange={e => setDriverForm({...driverForm, status: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4">
                          <option value="Available">Available</option>
                          <option value="On Trip">On Trip</option>
                          <option value="Offline">Offline</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Driver Photo {editingDriver && '(Optional)'}</label>
                      <input type="file" accept="image/*" onChange={e => setDriverForm({...driverForm, image: e.target.files?.[0] || null})} className="w-full text-xs text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-stone-400 hover:bg-bg-light transition-all">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 bg-primary-gradient text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Driver'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {showPromoModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[3rem] max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-bold serif italic text-secondary mb-8">New Promotion</h3>
                  <form onSubmit={handleAddPromo} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Title</label>
                      <input required value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="Promo Title" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Description</label>
                      <textarea required value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 min-h-[100px]" placeholder="Promo Details" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Image</label>
                      <input type="file" accept="image/*" onChange={e => setPromoForm({...promoForm, image: e.target.files?.[0] || null})} className="w-full text-xs text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-stone-400 hover:bg-bg-light transition-all">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 bg-primary-gradient text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Promo'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {showGalleryModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[3rem] max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-bold serif italic text-secondary mb-8">{editingGallery ? 'Edit Gallery Item' : 'Upload to Gallery'}</h3>
                  <form onSubmit={handleAddGallery} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Title</label>
                      <input required value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="Image Title" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Category</label>
                      <select value={galleryForm.category} onChange={e => setGalleryForm({...galleryForm, category: e.target.value})} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4">
                        <option value="tour">Tour</option>
                        <option value="delivery">Delivery</option>
                        <option value="fleet">Fleet</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Image {!editingGallery && '(Required)'}</label>
                      <input required={!editingGallery} type="file" accept="image/*" onChange={e => setGalleryForm({...galleryForm, image: e.target.files?.[0] || null})} className="w-full text-xs text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowGalleryModal(false)} className="flex-1 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-stone-400 hover:bg-bg-light transition-all">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 bg-primary-gradient text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingGallery ? 'Update Item' : 'Upload Now')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {showFaqModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/80 backdrop-blur-sm p-6">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[3rem] max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-bold serif italic text-secondary mb-8">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                  <form onSubmit={handleAddFaq} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Question</label>
                      <input required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4" placeholder="Question" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Answer</label>
                      <textarea required value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} className="w-full bg-bg-light border-none rounded-2xl px-6 py-4 min-h-[150px]" placeholder="Answer" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowFaqModal(false)} className="flex-1 py-4 rounded-full font-bold text-xs uppercase tracking-widest text-stone-400 hover:bg-bg-light transition-all">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 bg-primary-gradient text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingFaq ? 'Update FAQ' : 'Add FAQ')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Admin;
