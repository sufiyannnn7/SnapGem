# 💎 SnapGem Store & WhatsApp E-Commerce Platform

A commercial-grade, modern luxury e-commerce web application built for fine jewelry, handcrafted accessories, and direct WhatsApp ordering. Built with React 19, TypeScript, Vite, TailwindCSS, React Query, and Supabase.

---

## 🌟 Key Features

### 🛒 Customer Storefront
- **Luxury Visual Aesthetics**: Modern dark/light UI, smooth animations, glassmorphism, responsive grid layouts.
- **Dynamic Homepage**: Hero Banner, Featured Categories, Trending Products, Featured Products, Flash Sale (with countdown timer), New Arrivals, Best Sellers, Why Choose Us perks, Testimonials, and Newsletter subscription.
- **Global Search**: Header search popup with real-time product autocomplete by name or category.
- **Catalog Filtering & Sorting**: Filter by category, status, and stock level. Sort by Price, Name, and Date.
- **Product Details & Direct WhatsApp Inquiry**: Image gallery with click-to-zoom, thumbnail selector, discount calculation, stock status badges, specifications, related products, and **"Enquire via WhatsApp"** button.
- **No-Login Shopping Cart & Checkout**: LocalStorage-backed cart via Zustand persist. Collects address, notes, and automatically generates pre-formatted WhatsApp orders.

### ⚙️ Admin CMS Panel
- **Shopify-Style Metric Dashboard**: Real-time cards for Products, Categories, Pending, Confirmed, Paid, Delivered, Cancelled orders, Low Stock, and Recent Orders table.
- **Product Catalog Management**: Inline price/stock editing, pagination, CSV Export, CSV Import with preview validation, and multi-select **Bulk Actions** (Feature, Unfeature, Mark Trending, Archive, Restore, Delete).
- **Dedicated Inventory Control**: Color-coded stock level badges and instant stock updates.
- **Order Management & Printing**: Order status updates, printable official invoices with GST and logo, and **Auto WhatsApp Status Notification** buttons.
- **Homepage Builder**: Drag & drop section reordering, section visibility toggles, section duplication, and live preview canvas.
- **Media Library**: Supabase Storage bucket browser (*Products, Categories, Homepage, Logos, Banners, CMS*) with file upload, URL copying, and file deletion.
- **Store Settings & Backup**: Custom logo, favicon, WhatsApp number, GST number, store timings, COD toggle, shipping rates, theme color reset, and JSON settings backup/restore.

---

## 🚀 Tech Stack

- **Frontend Framework**: React 19, TypeScript, Vite 8
- **Styling & Animation**: TailwindCSS, Framer Motion, Lucide Icons
- **State & Data Fetching**: React Query (@tanstack/react-query), Zustand
- **Backend & Database**: Supabase (PostgreSQL, Supabase Storage, Supabase Auth)
- **Deployment Target**: Netlify / Vercel

---

## 🛠️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_WHATSAPP_NUMBER=918669210030
```

---

## 💻 Local Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Production build test (0 TypeScript errors)
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Database Schema Documentation](docs/DATABASE_SCHEMA.md)
- [Admin User Guide](docs/USER_GUIDE.md)

---

## 📄 License
© 2026 SnapGem Store. All rights reserved.
