-- ==========================================
-- SEED DATA FOR LUXE STORE DEMO
-- Run this in the Supabase SQL Editor!
-- ==========================================

-- 1. Insert Demo Categories
INSERT INTO public.categories (id, name, slug, image, description)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', 'Premium accessories collection.'),
  ('c2000000-0000-0000-0000-000000000002', 'Bags', 'bags', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80', 'Luxury handbags and totes.'),
  ('c3000000-0000-0000-0000-000000000003', 'Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80', 'State of the art technology.'),
  ('c4000000-0000-0000-0000-000000000004', 'Clothing', 'clothing', 'https://images.unsplash.com/photo-1489987707023-af0825f5c8f8?w=800&q=80', 'High-end minimalist apparel.'),
  ('c5000000-0000-0000-0000-000000000005', 'Home', 'home', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80', 'Minimalist home decor.'),
  ('c6000000-0000-0000-0000-000000000006', 'Footwear', 'footwear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 'Performance and luxury footwear.')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Demo Products
INSERT INTO public.products (id, name, slug, description, price, compare_at_price, stock, category_id, thumbnail, status, featured)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Aura Minimalist Watch', 'aura-minimalist-watch', 'A beautifully crafted minimalist watch featuring a seamless unibody design and sapphire glass.', 299, 350, 50, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'active', true),
  ('p2000000-0000-0000-0000-000000000002', 'Luxe Leather Tote', 'luxe-leather-tote', 'Premium full-grain leather tote with soft structure and expansive interior.', 590, null, 25, 'c2000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80', 'active', true),
  ('p3000000-0000-0000-0000-000000000003', 'Aero Noise-Cancelling Headphones', 'aero-headphones', 'Industry-leading noise cancellation with spatial audio and a refined glass-and-aluminum finish.', 349, 399, 100, 'c3000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', 'active', true),
  ('p4000000-0000-0000-0000-000000000004', 'Silk Blend Lounge Set', 'silk-blend-lounge-set', 'Ultra-soft silk blend lounge set designed for ultimate comfort and elegance.', 185, null, 15, 'c4000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80', 'active', true),
  ('p5000000-0000-0000-0000-000000000005', 'Matte Ceramic Vase', 'matte-ceramic-vase', 'A sculptural ceramic vase with a smooth matte finish, perfect for minimal spaces.', 120, null, 0, 'c5000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1612152505975-64536767eb32?w=800&q=80', 'active', false),
  ('p6000000-0000-0000-0000-000000000006', 'Velocity Running Shoes', 'velocity-running-shoes', 'Performance running shoes with responsive cushioning and a breathable knit upper.', 180, null, 200, 'c6000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 'active', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Homepage Builder Sections
INSERT INTO public.homepage_sections (id, section_type, display_order, is_enabled, settings)
VALUES
  ('h1000000-0000-0000-0000-000000000001', 'hero', 0, true, '{
    "heading": "Redefining Luxury",
    "subheading": "Discover our curated collection of premium essentials designed for modern living.",
    "buttonText": "Shop Collection",
    "buttonLink": "/shop",
    "backgroundImage": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80"
  }'),
  ('h2000000-0000-0000-0000-000000000002', 'featured_collections', 1, true, '{}'),
  ('h3000000-0000-0000-0000-000000000003', 'trending_products', 2, true, '{
    "title": "Trending Now",
    "subtitle": "Discover our most coveted pieces this season."
  }'),
  ('h4000000-0000-0000-0000-000000000004', 'testimonials', 3, true, '{"title": "What Our Clients Say"}')
ON CONFLICT (id) DO NOTHING;

-- 4. Promote all current users to Admin (so you can login to the dashboard)
INSERT INTO public.admin_users (id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (id) DO NOTHING;
