import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const bookingService = {
  getAll: () => api.get('/bookings').then(res => res.data),
  getTrack: (trackingId: string) => api.get(`/bookings/track/${trackingId}`).then(res => res.data),
  create: (data: any) => api.post('/bookings', data).then(res => res.data),
  update: (id: number, data: any) => api.patch(`/bookings/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/bookings/${id}`).then(res => res.data),
};

export const driverService = {
  getAll: () => api.get('/drivers').then(res => res.data),
  create: (formData: FormData) => api.post('/drivers', formData).then(res => res.data),
  update: (id: number, data: any) => api.patch(`/drivers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/drivers/${id}`).then(res => res.data),
};

export const galleryService = {
  getAll: () => api.get('/gallery').then(res => res.data),
  upload: (formData: FormData) => api.post('/gallery', formData).then(res => res.data),
  update: (id: number, formData: FormData) => api.patch(`/gallery/${id}`, formData).then(res => res.data),
  delete: (id: number) => api.delete(`/gallery/${id}`).then(res => res.data),
};

export const promoService = {
  getAll: () => api.get('/promotions').then(res => res.data),
  create: (formData: FormData) => api.post('/promotions', formData).then(res => res.data),
  update: (id: number, data: any) => api.patch(`/promotions/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/promotions/${id}`).then(res => res.data),
};

export const statsService = {
  get: () => api.get('/stats').then(res => res.data),
};

export const paymentService = {
  getAll: () => api.get('/payments').then(res => res.data),
  verify: (data: { reference: string; booking_id: number }) => api.post('/payments/verify', data).then(res => res.data),
};

export const mpesaService = {
  stkPush: (data: { phone: string; amount: number; booking_id: number }) => api.post('/mpesa/stkpush', data).then(res => res.data),
  verify: (checkoutRequestId: string) => api.post(`/mpesa/verify/${checkoutRequestId}`).then(res => res.data),
};

export const settingsService = {
  get: () => api.get('/settings').then(res => res.data),
  update: (settings: Record<string, string>) => api.post('/settings', settings).then(res => res.data),
};

export const faqService = {
  getAll: () => api.get('/faqs').then(res => res.data),
  create: (data: any) => api.post('/faqs', data).then(res => res.data),
  update: (id: number, data: any) => api.patch(`/faqs/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/faqs/${id}`).then(res => res.data),
};

export const chatService = {
  sendMessage: (message: string) => api.post('/chat', { message }).then(res => res.data),
};

export default api;
