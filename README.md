# EasyMove Kenya - Booking & Logistics Platform

EasyMove Kenya is a comprehensive full-stack web application for managing tours, deliveries, and chauffeur services.

## Admin Panel Credentials

- **URL:** `/admin`
- **Password:** `admin123`

## Setup Instructions

1.  **Firebase Setup:**
    -   The application uses Firebase for authentication and Firestore for the database.
    -   Ensure `firebase-applet-config.json` is correctly configured with your Firebase project details.
    -   Deploy the security rules using `npx firebase deploy --only firestore:rules`.

2.  **API Configuration (Admin Panel):**
    -   Log in to the Admin panel at `/admin`.
    -   Navigate to the **Settings** tab.
    -   Enter your **M-Pesa Daraja API** credentials (Consumer Key, Consumer Secret, Shortcode, Passkey, Callback URL).
    -   Enter your **WhatsApp API** credentials (API Endpoint URL, API Token/Key, Admin WhatsApp Number).
    -   Save the settings.

3.  **FAQ Management:**
    -   Navigate to the **FAQs** tab in the Admin panel.
    -   Add common questions and answers to populate the smart chat assistant.

4.  **Gallery & Promotions:**
    -   Manage your visual content and active promotions through the **Gallery** and **Promotions** tabs.

## Features

-   **Smart Chat Assistant:** FAQ-integrated chat with WhatsApp fallback.
-   **M-Pesa STK Push:** Seamless mobile payments with instant confirmation.
-   **Real-time Tracking:** Customers can track their bookings using a unique tracking ID.
-   **Admin Dashboard:** Centralized management for bookings, drivers, and settings.
-   **Responsive Design:** Optimized for both desktop and mobile devices.

## Branding

The application is branded as **EasyMove Kenya**. All logos, titles, and messages reflect this identity.
