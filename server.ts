import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import cors from "cors";

dotenv.config();

// --- Database Setup ---
const db = new Database("kinyua.db");

// Helper to add columns if they don't exist
function addColumnIfNotExists(table: string, column: string, type: string) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const exists = info.some(col => col.name === column);
    if (!exists) {
      console.log(`Adding column ${column} to table ${table}...`);
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  } catch (err) {
    console.error(`Error checking/adding column ${column} to ${table}:`, err);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    vehicle TEXT,
    status TEXT DEFAULT 'Available',
    lat REAL,
    lng REAL,
    last_update DATETIME
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    tracking_id TEXT UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    pickup_location TEXT,
    delivery_location TEXT,
    destination TEXT,
    package_description TEXT,
    tour_package TEXT,
    num_people INTEGER,
    num_hours INTEGER,
    date TEXT,
    time TEXT,
    status TEXT DEFAULT 'Pending',
    payment_status TEXT DEFAULT 'Unpaid',
    payment_reference TEXT,
    amount REAL,
    driver_id INTEGER,
    last_lat REAL,
    last_lng REAL,
    dest_lat REAL,
    dest_lng REAL,
    rating INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    payment_reference TEXT UNIQUE,
    amount REAL,
    customer_phone TEXT,
    payment_status TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    category TEXT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Auto-update schema
addColumnIfNotExists('drivers', 'image_url', 'TEXT');
addColumnIfNotExists('bookings', 'payment_reference', 'TEXT'); // Ensure it exists
addColumnIfNotExists('bookings', 'last_lat', 'REAL');
addColumnIfNotExists('bookings', 'last_lng', 'REAL');
addColumnIfNotExists('bookings', 'dest_lat', 'REAL');
addColumnIfNotExists('bookings', 'dest_lng', 'REAL');
addColumnIfNotExists('bookings', 'rating', 'INTEGER');

// --- Helper Functions ---
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("254")) {
    // Already correct
  } else if (cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// --- Settings Helper ---
function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any;
  return row ? row.value : null;
}

function setSetting(key: string, value: string) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

// --- WhatsApp API Logic ---
async function sendWhatsApp(message: string, to?: string) {
  const apiUrl = getSetting("whatsapp_api_url");
  const apiKey = getSetting("whatsapp_api_key");
  const adminNumber = getSetting("whatsapp_admin_number");
  
  const targetNumber = to || adminNumber;
  
  if (!apiUrl || !apiKey || !targetNumber) {
    console.log("WhatsApp API not configured. Message:", message);
    return;
  }

  try {
    // Generic WhatsApp API call (e.g. UltraMsg, Twilio, or custom)
    // We'll assume a standard POST request with token and body
    await axios.post(apiUrl, {
      token: apiKey,
      to: formatPhoneNumber(targetNumber),
      body: message
    });
    console.log(`WhatsApp message sent successfully to ${targetNumber}`);
  } catch (err) {
    console.error("Error sending WhatsApp via API:", err);
  }
}

// --- Express & Socket.io Setup ---
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  // Ensure uploads directory exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  // --- Multer for File Uploads ---
  const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // --- API Routes ---

  // FAQ Management
  app.get("/api/faqs", (req, res) => {
    try {
      const faqs = db.prepare("SELECT * FROM faq ORDER BY created_at DESC").all();
      res.json(faqs);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/faqs", (req, res) => {
    const { question, answer } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO faq (question, answer) VALUES (?, ?)");
      const result = stmt.run(question, answer);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/faqs/:id", (req, res) => {
    const { question, answer } = req.body;
    try {
      const stmt = db.prepare("UPDATE faq SET question = ?, answer = ? WHERE id = ?");
      stmt.run(question, answer, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/faqs/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM faq WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Smart Chat
  app.post("/api/chat", (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
      // Simple keyword matching for FAQ
      const faqs = db.prepare("SELECT * FROM faq").all() as any[];
      const lowerMsg = message.toLowerCase();
      
      const match = faqs.find(f => 
        lowerMsg.includes(f.question.toLowerCase()) || 
        f.question.toLowerCase().includes(lowerMsg)
      );

      if (match) {
        res.json({ reply: match.answer });
      } else {
        res.json({ 
          reply: "I'm not sure about that. Let’s continue on WhatsApp for personalized assistance.",
          fallback: true 
        });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, value);
      }
    })();
    
    res.json({ success: true });
  });

  // Bookings
  app.post("/api/bookings", (req, res) => {
    const { type, customer_name, customer_phone, pickup_location, delivery_location, destination, package_description, tour_package, num_people, num_hours, date, time, amount, dest_lat, dest_lng } = req.body;
    
    // Generate unique trackingId: EM-XXXXXX
    const generateTrackingId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'EM-';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let tracking_id = generateTrackingId();
    // Ensure uniqueness
    let exists = db.prepare("SELECT id FROM bookings WHERE tracking_id = ?").get(tracking_id);
    while (exists) {
      tracking_id = generateTrackingId();
      exists = db.prepare("SELECT id FROM bookings WHERE tracking_id = ?").get(tracking_id);
    }

    const mpesaKey = getSetting("mpesa_consumer_key");
    const mpesaSecret = getSetting("mpesa_consumer_secret");
    const mpesaPasskey = getSetting("mpesa_passkey");
    const mpesaCallback = getSetting("mpesa_callback_url");

    if (!mpesaKey || !mpesaSecret || !mpesaPasskey || !mpesaCallback) {
      return res.status(500).json({ error: "M-Pesa payment system is currently not configured by the administrator. Please contact support." });
    }

    const stmt = db.prepare(`
      INSERT INTO bookings (type, tracking_id, customer_name, customer_phone, pickup_location, delivery_location, destination, package_description, tour_package, num_people, num_hours, date, time, amount, dest_lat, dest_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(type, tracking_id, customer_name, customer_phone, pickup_location, delivery_location, destination, package_description, tour_package, num_people, num_hours, date, time, amount, dest_lat, dest_lng);
      
      // WhatsApp notification moved to payment confirmation
      
      res.json({ success: true, id: result.lastInsertRowid, tracking_id });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Paystack Verification
  app.post("/api/payments/verify", async (req, res) => {
    const { reference, booking_id } = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({ error: "Paystack secret key not configured" });
    }

    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const data = response.data.data;

      if (data.status === "success") {
        // Update booking
        db.prepare("UPDATE bookings SET payment_status = 'Paid', payment_reference = ? WHERE id = ?")
          .run(reference, booking_id);

        // Record payment
        db.prepare(`
          INSERT INTO payments (booking_id, payment_reference, amount, customer_phone, payment_status, payment_method)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(booking_id, reference, data.amount / 100, data.customer.phone, data.status, data.channel);

        // Notify Admin
        const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking_id) as any;
        const location = booking.type === 'tour' ? booking.pickup_location : (booking.type === 'delivery' ? `${booking.pickup_location} to ${booking.delivery_location}` : `${booking.pickup_location} to ${booking.destination}`);

        // Notify Customer
        const customerMsg = `Hello ${booking.customer_name}, your payment of KES ${data.amount / 100} for your ${booking.type} booking has been received successfully! ✅\nTracking ID: ${booking.tracking_id}\nThank you for choosing EasyMove Kenya.`;
        sendWhatsApp(customerMsg, booking.customer_phone);

        const message = `💰 *Payment Confirmed*\n\n` +
          `*Service Type:* ${booking.type.toUpperCase()}\n` +
          `*Customer Name:* ${booking.customer_name}\n` +
          `*Phone Number:* ${booking.customer_phone}\n` +
          `*Location:* ${location}\n` +
          `*Date:* ${booking.date}\n` +
          `*Time:* ${booking.time}\n` +
          (booking.tracking_id ? `*Tracking ID:* ${booking.tracking_id}\n` : '') +
          `*Amount:* KES ${data.amount / 100}\n` +
          `*Payment Status:* Paid (${data.channel})\n` +
          `*Reference:* ${reference}`;
        
        sendWhatsApp(message);

        res.json({ success: true, data });
      } else {
        res.json({ success: false, message: "Payment not successful" });
      }
    } catch (err) {
      console.error("Paystack verification error:", err);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Paystack Webhook
  app.post("/api/paystack/webhook", (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.sendStatus(500);

    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.sendStatus(400);
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, metadata, amount, customer, channel } = event.data;
      const booking_id = metadata?.booking_id;

      if (booking_id) {
        db.prepare("UPDATE bookings SET payment_status = 'Paid', payment_reference = ? WHERE id = ?")
          .run(reference, booking_id);

        db.prepare(`
          INSERT OR IGNORE INTO payments (booking_id, payment_reference, amount, customer_phone, payment_status, payment_method)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(booking_id, reference, amount / 100, customer.phone, 'success', channel);

        // Notify Customer and Admin
        const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking_id) as any;
        if (booking) {
          const customerMsg = `Hello ${booking.customer_name}, your payment of KES ${amount / 100} for your ${booking.type} booking has been received successfully! ✅\nTracking ID: ${booking.tracking_id}\nThank you for choosing EasyMove Kenya.`;
          sendWhatsApp(customerMsg, booking.customer_phone);

          const location = booking.type === 'tour' ? booking.pickup_location : (booking.type === 'delivery' ? `${booking.pickup_location} to ${booking.delivery_location}` : `${booking.pickup_location} to ${booking.destination}`);
          const adminMsg = `💰 *Payment Confirmed (Webhook)*\n\n` +
            `*Service Type:* ${booking.type.toUpperCase()}\n` +
            `*Customer Name:* ${booking.customer_name}\n` +
            `*Phone Number:* ${booking.customer_phone}\n` +
            `*Location:* ${location}\n` +
            `*Date:* ${booking.date}\n` +
            `*Time:* ${booking.time}\n` +
            `*Tracking ID:* ${booking.tracking_id}\n` +
            `*Amount:* KES ${amount / 100}\n` +
            `*Reference:* ${reference}`;
          sendWhatsApp(adminMsg);
        }
      }
    }

    res.sendStatus(200);
  });

  app.get("/api/bookings", (req, res) => {
    const { phone } = req.query;
    let query = `
      SELECT b.*, d.name as driver_name, d.vehicle as driver_vehicle 
      FROM bookings b 
      LEFT JOIN drivers d ON b.driver_id = d.id
    `;
    const params: any[] = [];
    
    if (phone) {
      query += " WHERE b.customer_phone = ?";
      params.push(phone);
    }
    
    query += " ORDER BY b.created_at DESC";
    
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  });

  app.post("/api/bookings/:id/rate", (req, res) => {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }
    try {
      db.prepare("UPDATE bookings SET rating = ? WHERE id = ?").run(rating, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/bookings/track/:trackingId", (req, res) => {
    const booking = db.prepare(`
      SELECT b.*, d.name as driver_name, d.vehicle as driver_vehicle, d.lat, d.lng
      FROM bookings b 
      LEFT JOIN drivers d ON b.driver_id = d.id
      WHERE b.tracking_id = ?
    `).get(req.params.trackingId);
    
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ error: "Tracking ID not found" });
    }
  });

  app.patch("/api/bookings/:id", (req, res) => {
    const { status, driver_id, payment_status, payment_reference } = req.body;
    
    let query = "UPDATE bookings SET ";
    const params: any[] = [];
    const updates: string[] = [];

    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (driver_id !== undefined) { updates.push("driver_id = ?"); params.push(driver_id); }
    if (payment_status !== undefined) { updates.push("payment_status = ?"); params.push(payment_status); }
    if (payment_reference !== undefined) { updates.push("payment_reference = ?"); params.push(payment_reference); }

    if (updates.length === 0) return res.json({ success: true });

    query += updates.join(", ") + " WHERE id = ?";
    params.push(req.params.id);

    const stmt = db.prepare(query);
    stmt.run(...params);
    res.json({ success: true });
  });

  app.delete("/api/bookings/:id", (req, res) => {
    db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Drivers
  app.patch("/api/drivers/:id", (req, res) => {
    const { status, lat, lng } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }
    if (lat !== undefined) {
      updates.push("lat = ?");
      params.push(lat);
    }
    if (lng !== undefined) {
      updates.push("lng = ?");
      params.push(lng);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    try {
      db.prepare(`UPDATE drivers SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/drivers/:id/bookings", (req, res) => {
    const bookings = db.prepare(`
      SELECT * FROM bookings 
      WHERE driver_id = ? AND status != 'Arrived' AND status != 'Cancelled'
      ORDER BY created_at DESC
    `).all(req.params.id);
    res.json(bookings);
  });

  app.get("/api/drivers", (req, res) => {
    const drivers = db.prepare("SELECT * FROM drivers").all();
    res.json(drivers);
  });

  app.post("/api/drivers", upload.single("image"), (req: any, res) => {
    const { name, phone, vehicle } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare("INSERT INTO drivers (name, phone, vehicle, image_url) VALUES (?, ?, ?, ?)");
    const result = stmt.run(name, phone, vehicle, image_url);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.patch("/api/drivers/:id", upload.single("image"), (req: any, res) => {
    const { status, name, phone, vehicle } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    let query = "UPDATE drivers SET status = ?, name = ?, phone = ?, vehicle = ?";
    const params = [status, name, phone, vehicle];
    
    if (image_url) {
      query += ", image_url = ?";
      params.push(image_url);
    }
    
    query += " WHERE id = ?";
    params.push(req.params.id);
    
    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete("/api/drivers/:id", (req, res) => {
    db.prepare("DELETE FROM drivers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Gallery
  app.get("/api/gallery", (req, res) => {
    const items = db.prepare("SELECT * FROM gallery ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.post("/api/gallery", upload.single("image"), (req: any, res) => {
    const { category, title } = req.body;
    const url = `/uploads/${req.file?.filename}`;
    const stmt = db.prepare("INSERT INTO gallery (url, category, title) VALUES (?, ?, ?)");
    stmt.run(url, category, title);
    res.json({ success: true, url });
  });

  app.patch("/api/gallery/:id", upload.single("image"), (req: any, res) => {
    const { category, title } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    let query = "UPDATE gallery SET category = ?, title = ?";
    const params = [category, title];
    
    if (image_url) {
      query += ", url = ?";
      params.push(image_url);
    }
    
    query += " WHERE id = ?";
    params.push(req.params.id);
    
    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete("/api/gallery/:id", (req, res) => {
    db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Promotions
  app.get("/api/promotions", (req, res) => {
    const promos = db.prepare("SELECT * FROM promotions WHERE is_active = 1").all();
    res.json(promos);
  });

  app.post("/api/promotions", upload.single("image"), (req: any, res) => {
    const { title, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare("INSERT INTO promotions (title, description, image_url) VALUES (?, ?, ?)");
    stmt.run(title, description, image_url);
    res.json({ success: true });
  });

  app.patch("/api/promotions/:id", (req, res) => {
    const { title, description, is_active } = req.body;
    let query = "UPDATE promotions SET ";
    const params: any[] = [];
    const updates: string[] = [];

    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (is_active !== undefined) { updates.push("is_active = ?"); params.push(is_active); }

    if (updates.length === 0) return res.json({ success: true });

    query += updates.join(", ") + " WHERE id = ?";
    params.push(req.params.id);

    const stmt = db.prepare(query);
    stmt.run(...params);
    res.json({ success: true });
  });

  app.delete("/api/promotions/:id", (req, res) => {
    db.prepare("DELETE FROM promotions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Stats for Admin
  app.get("/api/stats", (req, res) => {
    const totalBookings = db.prepare("SELECT COUNT(*) as count FROM bookings").get() as any;
    const totalDeliveries = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE type = 'delivery'").get() as any;
    const totalTours = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE type = 'tour'").get() as any;
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'Available'").get() as any;
    const pendingPackages = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE type = 'delivery' AND status = 'Pending'").get() as any;
    
    const revenue = db.prepare("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'success' OR payment_status = 'Paid'").get() as any;
    const paidBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'Paid'").get() as any;
    const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'Unpaid'").get() as any;

    res.json({
      totalBookings: totalBookings.count,
      totalDeliveries: totalDeliveries.count,
      totalTours: totalTours.count,
      activeDrivers: activeDrivers.count,
      pendingPackages: pendingPackages.count,
      totalRevenue: revenue.total || 0,
      paidBookings: paidBookings.count,
      pendingPayments: pendingPayments.count
    });
  });

  app.get("/api/payments", (req, res) => {
    const payments = db.prepare("SELECT * FROM payments ORDER BY created_at DESC").all();
    res.json(payments);
  });

  // --- M-Pesa Integration ---
  const getMpesaAccessToken = async () => {
    const consumerKey = getSetting("mpesa_consumer_key");
    const consumerSecret = getSetting("mpesa_consumer_secret");
    
    if (!consumerKey || !consumerSecret) {
      throw new Error("M-Pesa credentials not configured in settings.");
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
      const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: { Authorization: `Basic ${auth}` },
      });
      return response.data.access_token;
    } catch (error) {
      console.error("M-Pesa Access Token Error:", error);
      throw error;
    }
  };

  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phone, amount, booking_id } = req.body;
    const shortCode = getSetting("mpesa_shortcode") || "174379";
    const passkey = getSetting("mpesa_passkey");
    const callbackUrl = getSetting("mpesa_callback_url");
    
    if (!passkey || !callbackUrl) {
      return res.status(500).json({ success: false, error: "M-Pesa settings (passkey/callback) not configured." });
    }

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const formattedPhone = formatPhoneNumber(phone);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const accessToken = await getMpesaAccessToken();
        const response = await axios.post(
          "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
          {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `EMK-${booking_id}`,
            TransactionDesc: `EasyMove Kenya Booking ${booking_id}`,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        return res.json({ success: true, data: response.data });
      } catch (error: any) {
        const errorMessage = error.response?.data?.errorMessage || error.message;
        console.error(`M-Pesa STK Push Attempt ${attempts + 1} Error:`, errorMessage);
        
        if (errorMessage.includes("busy") || errorMessage.includes("System error")) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            continue;
          }
        }
        
        return res.status(500).json({ success: false, error: errorMessage });
      }
    }
  });

  app.post("/api/mpesa/verify/:checkoutRequestId", async (req, res) => {
    const { checkoutRequestId } = req.params;
    const shortCode = getSetting("mpesa_shortcode") || "174379";
    const passkey = getSetting("mpesa_passkey");
    
    if (!passkey) {
      return res.status(500).json({ success: false, error: "M-Pesa passkey not configured." });
    }

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    try {
      const accessToken = await getMpesaAccessToken();
      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
        {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const resultCode = response.data.ResultCode;
      if (resultCode === "0") {
        // Update booking
        const booking = db.prepare("SELECT id FROM bookings WHERE payment_reference = ?").get(checkoutRequestId) as any;
        if (booking) {
          db.prepare("UPDATE bookings SET payment_status = 'SUCCESS' WHERE id = ?").run(booking.id);
        }
      } else if (resultCode === "1032" || resultCode === "1") {
        const booking = db.prepare("SELECT id FROM bookings WHERE payment_reference = ?").get(checkoutRequestId) as any;
        if (booking) {
          db.prepare("UPDATE bookings SET payment_status = 'CANCELLED', status = 'Cancelled' WHERE id = ?").run(booking.id);
        }
      } else {
        const booking = db.prepare("SELECT id FROM bookings WHERE payment_reference = ?").get(checkoutRequestId) as any;
        if (booking) {
          db.prepare("UPDATE bookings SET payment_status = 'FAILED', status = 'Cancelled' WHERE id = ?").run(booking.id);
        }
      }

      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error("M-Pesa Verify Error:", error.response?.data || error.message);
      res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
  });

  app.post("/api/mpesa/callback", (req, res) => {
    const { Body } = req.body;
    const result = Body.stkCallback;
    const checkoutRequestID = result.CheckoutRequestID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    console.log(`M-Pesa Callback received: ${checkoutRequestID}, ResultCode: ${resultCode}, Desc: ${resultDesc}`);

    const booking = db.prepare("SELECT * FROM bookings WHERE payment_reference = ?").get(checkoutRequestID) as any;

    if (!booking) {
      console.error(`Booking not found for CheckoutRequestID: ${checkoutRequestID}`);
      return res.json({ success: true });
    }

    if (resultCode === 0) {
      const metadata = result.CallbackMetadata.Item;
      const amount = metadata.find((i: any) => i.Name === "Amount").Value;
      const mpesaReceiptNumber = metadata.find((i: any) => i.Name === "MpesaReceiptNumber").Value;
      const phoneNumber = metadata.find((i: any) => i.Name === "PhoneNumber").Value;
      
      console.log(`Payment Successful: ${mpesaReceiptNumber}, Amount: ${amount}, Phone: ${phoneNumber}`);
      
      db.prepare("UPDATE bookings SET payment_status = 'SUCCESS' WHERE id = ?").run(booking.id);
      db.prepare("INSERT INTO payments (booking_id, payment_reference, amount, customer_phone, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?)")
        .run(booking.id, mpesaReceiptNumber, amount, phoneNumber, "SUCCESS", "M-Pesa");

      // Send WhatsApp Notification to Customer
      const customerMsg = `Hello ${booking.customer_name}, your payment of KES ${amount} for your ${booking.type} booking has been received successfully! ✅
Tracking ID: ${booking.tracking_id}
Thank you for choosing EasyMove Kenya.`;
      sendWhatsApp(customerMsg, booking.customer_phone);

      // Send WhatsApp Notification to Admin (Finalized Booking)
      const location = booking.type === 'tour' ? booking.pickup_location : (booking.type === 'delivery' ? `${booking.pickup_location} to ${booking.delivery_location}` : `${booking.pickup_location} to ${booking.destination}`);
      const adminMsg = `🚀 *New Confirmed Booking*\n\n` +
        `*Service Type:* ${booking.type.toUpperCase()}\n` +
        `*Customer Name:* ${booking.customer_name}\n` +
        `*Phone Number:* ${booking.customer_phone}\n` +
        `*Location:* ${location}\n` +
        `*Date:* ${booking.date}\n` +
        `*Time:* ${booking.time}\n` +
        `*Tracking ID:* ${booking.tracking_id}\n` +
        `*Amount Paid:* KES ${amount}\n` +
        `*Receipt:* ${mpesaReceiptNumber}`;
      
      sendWhatsApp(adminMsg);

    } else {
      console.log(`Payment Failed/Cancelled: ${resultDesc}`);
      const status = (resultCode === 1032 || resultCode === 1) ? 'CANCELLED' : 'FAILED';
      db.prepare("UPDATE bookings SET payment_status = ?, status = 'Cancelled' WHERE id = ?").run(status, booking.id);
      
      // Notify customer of failure
      const failureMsg = `Hello ${booking.customer_name}, your payment for the ${booking.type} booking was ${status.toLowerCase()}. ⚠️\nStatus: ${resultDesc}.\nPlease try again or contact support.`;
      sendWhatsApp(failureMsg, booking.customer_phone);
    }

    res.json({ success: true });
  });

  // --- Socket.io Logic ---
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join room for specific tracking ID
    socket.on("joinRoom", (trackingId) => {
      const booking = db.prepare("SELECT id FROM bookings WHERE tracking_id = ?").get(trackingId);
      if (booking) {
        socket.join(trackingId);
        console.log(`Socket ${socket.id} joined room ${trackingId}`);
      } else {
        console.log(`Socket ${socket.id} failed to join room ${trackingId}: Invalid ID`);
      }
    });

    socket.on("driverLocation", (data) => {
      // data: { driverId, trackingId, lat, lng }
      const { driverId, trackingId, lat, lng } = data;
      
      // Update driver's global location
      db.prepare("UPDATE drivers SET lat = ?, lng = ?, last_update = CURRENT_TIMESTAMP WHERE id = ?")
        .run(lat, lng, driverId);
      
      // Update specific booking's last known location
      if (trackingId) {
        db.prepare("UPDATE bookings SET last_lat = ?, last_lng = ? WHERE tracking_id = ?")
          .run(lat, lng, trackingId);
        
        // Broadcast to specific room
        io.to(trackingId).emit("locationUpdate", { driverId, lat, lng });
      }
      
      // Also broadcast to admin for general monitoring
      io.emit("admin:drivers_update", { driverId, lat, lng });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
