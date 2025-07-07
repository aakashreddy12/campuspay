# Student Wallet Platform - Supabase Database Schema

## Overview

This document outlines the complete database schema for the Student Wallet Platform using Supabase PostgreSQL.

## Database Setup Instructions

### 1. Create the Database Tables

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handles all user types: student, vendor, storekeeper, admin, advertiser)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'vendor', 'storekeeper', 'admin', 'advertiser')),
    name VARCHAR(255) NOT NULL,
    -- Student specific fields
    college VARCHAR(255),
    course VARCHAR(255),
    year INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    rfid_id VARCHAR(50) UNIQUE,
    college_id VARCHAR(50) UNIQUE,
    reward_points INTEGER DEFAULT 0,
    ad_consent BOOLEAN DEFAULT true,
    parent_contact VARCHAR(20),
    -- Storekeeper specific field
    vendor_id UUID REFERENCES users(id), -- For storekeepers assigned to vendors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT true,
    discount DECIMAL(5,2) DEFAULT 0.00, -- Percentage discount
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'payment', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    vendor_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id VARCHAR(100) UNIQUE, -- External payment gateway transaction ID
    payment_method VARCHAR(50), -- UPI, Card, Cash, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor orders table
CREATE TABLE vendor_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storekeeper_id UUID REFERENCES users(id), -- Who processed the order
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table (items in each order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- Price at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad campaigns table
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'gif')),
    placement VARCHAR(50) CHECK (placement IN ('top-banner', 'inline-card', 'sidebar', 'footer-banner', 'floating-cta', 'interstitial', 'dashboard-card')),
    target_audience JSONB DEFAULT '{}', -- Targeting criteria
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed')),
    website_url TEXT,
    call_to_action VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad events table (impressions, clicks, views)
CREATE TABLE ad_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('impression', 'click', 'view')),
    metadata JSONB DEFAULT '{}', -- Additional event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor discounts table
CREATE TABLE vendor_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    min_order_value DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create Indexes for Performance

```sql
-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_rfid ON users(rfid_id);
CREATE INDEX idx_users_college_id ON users(college_id);

CREATE INDEX idx_menu_items_vendor ON menu_items(vendor_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_menu_items_category ON menu_items(category);

CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_vendor ON wallet_transactions(vendor_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at);

CREATE INDEX idx_vendor_orders_vendor ON vendor_orders(vendor_id);
CREATE INDEX idx_vendor_orders_student ON vendor_orders(student_id);
CREATE INDEX idx_vendor_orders_storekeeper ON vendor_orders(storekeeper_id);
CREATE INDEX idx_vendor_orders_status ON vendor_orders(status);
CREATE INDEX idx_vendor_orders_created ON vendor_orders(created_at);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

CREATE INDEX idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_placement ON ad_campaigns(placement);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE INDEX idx_ad_events_user ON ad_events(user_id);
CREATE INDEX idx_ad_events_ad ON ad_events(ad_id);
CREATE INDEX idx_ad_events_type ON ad_events(type);
CREATE INDEX idx_ad_events_created ON ad_events(created_at);

CREATE INDEX idx_vendor_discounts_vendor ON vendor_discounts(vendor_id);
CREATE INDEX idx_vendor_discounts_active ON vendor_discounts(active);
CREATE INDEX idx_vendor_discounts_dates ON vendor_discounts(start_date, end_date);
```

### 3. Create Triggers for Updated_at Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_orders_updated_at BEFORE UPDATE ON vendor_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_discounts_updated_at BEFORE UPDATE ON vendor_discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Insert Sample Data

```sql
-- Insert sample users
INSERT INTO users (id, email, phone, role, name, college, course, year, gender, wallet_balance, rfid_id, college_id, reward_points, ad_consent, parent_contact) VALUES
('11111111-1111-1111-1111-111111111111', 'alex.johnson@techuni.edu', '2025112233', 'student', 'Alex Johnson', 'Tech University', 'Computer Science', 3, 'male', 2500.00, 'RFID-AX12345', 'TU21CS001', 850, true, '+1234567890'),
('22222222-2222-2222-2222-222222222222', 'sarah.wilson@techuni.edu', '2025112234', 'student', 'Sarah Wilson', 'Tech University', 'Business Administration', 2, 'female', 1800.00, 'RFID-SW67890', 'TU22BA002', 620, true, '+1234567891'),
('33333333-3333-3333-3333-333333333333', 'mike.chen@engineering.edu', '2025112235', 'student', 'Mike Chen', 'Engineering College', 'Mechanical Engineering', 1, 'male', 950.00, 'RFID-MC11111', 'EC24ME003', 180, false, '+1234567892');

INSERT INTO users (id, email, role, name) VALUES
('44444444-4444-4444-4444-444444444444', 'vendor@campuscanteen.com', 'vendor', 'Campus Canteen'),
('55555555-5555-5555-5555-555555555555', 'vendor@librarycoffee.com', 'vendor', 'Library Coffee'),
('66666666-6666-6666-6666-666666666666', 'advertiser@example.com', 'advertiser', 'Local Business Ads'),
('77777777-7777-7777-7777-777777777777', 'admin@campuspay.com', 'admin', 'CampusPay Admin');

-- Insert storekeepers
INSERT INTO users (id, email, role, name, vendor_id) VALUES
('88888888-8888-8888-8888-888888888888', 'storekeeper1@campuscanteen.com', 'storekeeper', 'John Store Manager', '44444444-4444-4444-4444-444444444444'),
('99999999-9999-9999-9999-999999999999', 'storekeeper2@librarycoffee.com', 'storekeeper', 'Mary Coffee Manager', '55555555-5555-5555-5555-555555555555');

-- Insert menu items
INSERT INTO menu_items (vendor_id, name, description, price, category, available, discount, stock_quantity) VALUES
('44444444-4444-4444-4444-444444444444', 'Masala Dosa', 'Crispy dosa with spiced potato filling', 60.00, 'South Indian', true, 0.00, 50),
('44444444-4444-4444-4444-444444444444', 'Veg Burger', 'Fresh veggie burger with cheese', 85.00, 'Fast Food', true, 10.00, 30),
('44444444-4444-4444-4444-444444444444', 'Chole Bhature', 'Spicy chickpeas with fried bread', 75.00, 'North Indian', true, 0.00, 20),
('44444444-4444-4444-4444-444444444444', 'Filter Coffee', 'Traditional South Indian filter coffee', 25.00, 'Beverages', true, 0.00, 100),
('55555555-5555-5555-5555-555555555555', 'Cappuccino', 'Rich espresso with steamed milk', 45.00, 'Beverages', true, 0.00, 40),
('55555555-5555-5555-5555-555555555555', 'Sandwich', 'Grilled vegetable sandwich', 55.00, 'Snacks', true, 5.00, 25);

-- Insert sample wallet transactions
INSERT INTO wallet_transactions (user_id, type, amount, description, vendor_id, status) VALUES
('11111111-1111-1111-1111-111111111111', 'recharge', 1000.00, 'Wallet Recharge via UPI', NULL, 'completed'),
('11111111-1111-1111-1111-111111111111', 'payment', -85.00, 'Campus Canteen Purchase', '44444444-4444-4444-4444-444444444444', 'completed'),
('22222222-2222-2222-2222-222222222222', 'recharge', 500.00, 'Wallet Recharge via Card', NULL, 'completed'),
('22222222-2222-2222-2222-222222222222', 'payment', -45.00, 'Library Coffee Purchase', '55555555-5555-5555-5555-555555555555', 'completed');

-- Insert sample ad campaigns
INSERT INTO ad_campaigns (advertiser_id, title, description, media_type, placement, start_date, end_date, budget, status) VALUES
('66666666-6666-6666-6666-666666666666', 'Campus Bookstore Sale', 'Get 20% off on all textbooks this week!', 'image', 'top-banner', NOW() - INTERVAL '7 days', NOW() + INTERVAL '30 days', 5000.00, 'active'),
('66666666-6666-6666-6666-666666666666', 'Pizza Palace', 'Free delivery on orders above ₹200', 'image', 'inline-card', NOW() - INTERVAL '5 days', NOW() + INTERVAL '15 days', 3000.00, 'active');
```

### 5. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_discounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Students can read menu items
CREATE POLICY "Students can read menu items" ON menu_items FOR SELECT USING (true);

-- Vendors can manage their menu items
CREATE POLICY "Vendors can manage own menu items" ON menu_items FOR ALL USING (vendor_id::text = auth.uid()::text);

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions" ON wallet_transactions FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions" ON wallet_transactions FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Similar policies for other tables...
```

## API Endpoints Structure

The following API endpoints should be created to interact with this database:

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration (admin only)

### Users

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users (admin/storekeeper)

### Wallet

- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/recharge` - Recharge wallet
- `GET /api/wallet/transactions` - Get transaction history

### Menu Items

- `GET /api/menu` - Get all menu items
- `GET /api/menu/vendor/:vendorId` - Get vendor menu items
- `POST /api/menu` - Create menu item (vendor)
- `PUT /api/menu/:id` - Update menu item (vendor)
- `DELETE /api/menu/:id` - Delete menu item (vendor)

### Orders

- `POST /api/orders` - Create order (storekeeper)
- `GET /api/orders/vendor/:vendorId` - Get vendor orders
- `GET /api/orders/student/:studentId` - Get student orders

### Advertisements

- `GET /api/ads` - Get active ads for user
- `POST /api/ads/event` - Track ad event (impression/click)
- `POST /api/ads` - Create ad campaign (advertiser)
- `GET /api/ads/campaigns` - Get advertiser campaigns

### Analytics

- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/ads` - Ad performance analytics

## Environment Variables

Add these to your `.env` file:

```
VITE_SUPABASE_URL=https://sknfoewscuvalrhsbmvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbmZvZXdzY3V2YWxyaHNibXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTk5NjQsImV4cCI6MjA2NzM3NTk2NH0.9p4S-T8c4PXP9xLOf6wcwuO68J16BMYKQ-UuqofRRu0
```

## Authentication Setup

For authentication, you can use either:

1. Supabase Auth (recommended for production)
2. Custom email/password auth with your database

The sample implementation uses custom authentication for simplicity.
