# Student Wallet Platform - Setup Instructions

## 🚀 Getting Started

This is a comprehensive student wallet platform for closed campus canteens with role-based access, Supabase backend, and advanced features.

## 📋 Prerequisites

- Node.js 18+ installed
- Access to Supabase (account created)
- Modern web browser

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. ⚠️ **CRITICAL: Set Up Supabase Database First**

**The application will NOT work without setting up the Supabase database!**

Go to your Supabase dashboard: https://supabase.com/dashboard/projects

1. **Navigate to SQL Editor**
2. **Run the Database Schema** - Copy and paste the entire SQL schema from `DATABASE_SCHEMA.md` into the SQL editor
3. **Execute the queries** to create all tables, indexes, triggers, and sample data

**Important:** The application now uses ONLY Supabase data - no mock data fallbacks!

### 3. Environment Setup

The Supabase credentials are already configured in the code:

- **URL**: `https://sknfoewscuvalrhsbmvh.supabase.co`
- **Anon Key**: Already integrated

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 5. ⚠️ First Time Login

After setting up the database, you can login using the sample data created by the schema:

- **Email/Phone**: Use the email addresses from the sample data in `DATABASE_SCHEMA.md`
- **Password**: Any non-empty password will work (demo mode)
- **Roles**: Select the appropriate role that matches the user data

## 🔐 Demo Login Credentials

**⚠️ IMPORTANT: These credentials only work AFTER setting up the Supabase database with the provided schema!**

Use these credentials to test different user roles (from the sample data in the database):

### Student Login

- **Email**: `alex.johnson@techuni.edu` or `sarah.wilson@techuni.edu` or `mike.chen@engineering.edu`
- **Password**: `CampusPay@2024`
- **Role**: Student

### Vendor Login

- **Email**: `vendor@campuscanteen.com` or `vendor@librarycoffee.com`
- **Password**: `CampusPay@2024`
- **Role**: Vendor

### Storekeeper Login

- **Email**: `storekeeper1@campuscanteen.com` or `storekeeper2@librarycoffee.com`
- **Password**: `CampusPay@2024`
- **Role**: Storekeeper

### Admin Login

- **Email**: `admin@campuspay.com`
- **Password**: `CampusPay@2024`
- **Role**: Admin

### Advertiser Login

- **Email**: `advertiser@example.com` or `advertiser2@example.com`
- **Password**: `CampusPay@2024`
- **Role**: Advertiser

**Note**: All sample user data is created when you run the database schema. Check `DATABASE_SCHEMA.md` for the complete list of sample users.

## 🎯 Platform Features

### 👨‍🎓 Student Dashboard

- **Digital Wallet**: Real-time balance, recharge functionality
- **Transaction History**: Complete payment records
- **NFC/RFID Support**: Quick payment via card scanning
- **Personalized Ads**: Targeted advertisements based on profile
- **Profile Management**: Update personal information
- **Rewards System**: Points and tier progression
- **Campus Services**: News, coupons, nearby vendors

### 🏪 Vendor Dashboard

- **Sales Analytics**: Revenue tracking and growth metrics
- **Menu Management**: Add, edit, and manage food items
- **Inventory Control**: Stock management with low-stock alerts
- **Order Processing**: Real-time order management
- **Discount Management**: Create and manage promotional offers
- **Performance Metrics**: Detailed business insights

### 👥 Storekeeper Dashboard

- **POS System**: Complete point-of-sale interface
- **Student Lookup**: Search by roll number, RFID, or name
- **Cart Management**: Add items, adjust quantities
- **Payment Processing**: Wallet-based payments
- **Receipt Generation**: Digital and printable receipts
- **Inventory Updates**: Real-time stock adjustments
- **Transaction Recording**: Complete transaction logs

### 👑 Admin Dashboard

- **User Management**: Comprehensive user administration
- **Vendor Oversight**: Approve and manage vendors
- **System Analytics**: Platform-wide metrics and insights
- **Transaction Monitoring**: Real-time payment oversight
- **Ad Campaign Management**: Approve and monitor advertisements
- **System Health**: Monitor platform performance
- **Report Generation**: Export comprehensive reports

### 📢 Advertiser Dashboard

- **Campaign Creation**: Design targeted ad campaigns
- **Audience Targeting**: Demographic and behavioral targeting
- **Performance Analytics**: Click-through rates and engagement
- **Budget Management**: Control advertising spend
- **Creative Assets**: Upload and manage ad content

## 🛠 Technical Architecture

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Router** for navigation
- **React Query** for data fetching

### Backend

- **Express.js** server
- **Supabase** PostgreSQL database
- **Real-time** data synchronization
- **File upload** support

### Database Schema

- **Users**: Students, vendors, storekeepers, admins
- **Menu Items**: Food items with pricing and inventory
- **Transactions**: Wallet recharges and payments
- **Orders**: Purchase records with items
- **Ad Campaigns**: Targeted advertising system
- **Discounts**: Promotional offers

## 🔄 Application Flow

1. **User Login** → Role-based dashboard redirect
2. **Student** → Wallet management, campus services, ad viewing
3. **Vendor** → Menu and sales management
4. **Storekeeper** → POS system for processing orders
5. **Admin** → Platform oversight and management
6. **Real-time Updates** → Instant synchronization across all dashboards

## 📱 Key Features Implemented

### Digital Wallet System

- Real-time balance tracking
- Multiple recharge options (UPI, Card, Net Banking)
- Transaction history with filtering
- Low balance alerts

### NFC/RFID Integration

- Student card scanning for quick identification
- Contactless payment processing
- RFID-based student lookup

### Advertising Engine

- Dynamic ad placement across dashboards
- Targeting based on demographics and behavior
- Performance tracking (impressions, clicks, CTR)
- Multiple ad formats and placements

### Inventory Management

- Real-time stock tracking
- Low stock alerts
- Automatic inventory updates on purchases
- Category-based organization

### Analytics & Reporting

- Revenue tracking and growth metrics
- User behavior analytics
- Transaction monitoring
- Export capabilities

## 🚨 Important Notes

1. **Demo Mode**: The authentication is simplified for demo purposes
2. **Sample Data**: Pre-populated with realistic test data
3. **Real-time Features**: Some features use mock data for demonstration
4. **Production Setup**: Additional security measures needed for production

## 🛡 Security Features

- Role-based access control
- Protected routes for each user type
- Transaction validation
- Session management
- Data encryption (Supabase handles this)

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile and desktop
- **Dark/Light Mode**: Theme switching capability
- **Animated Components**: Smooth transitions and interactions
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Professional loading indicators
- **Error Handling**: User-friendly error messages

## 📊 Sample Scenarios to Test

### Student Experience

1. Login as a student
2. Check wallet balance
3. Recharge wallet using preset amounts
4. View transaction history
5. Interact with advertisements
6. Update profile information

### Storekeeper Experience

1. Login as storekeeper
2. Search for a student (try "alex", "TU21CS001", or "RFID-AX12345")
3. Add items to cart
4. Process payment
5. Generate receipt
6. View transaction history

### Vendor Experience

1. Login as vendor
2. View sales analytics
3. Manage menu items
4. Create discount offers
5. Monitor order status

### Admin Experience

1. Login as admin
2. View platform analytics
3. Manage users and vendors
4. Monitor system health
5. Export reports

## 🔧 Customization

The platform is highly customizable:

- **Theming**: Modify `client/global.css` for custom colors
- **Components**: All UI components are in `client/components/ui/`
- **Database**: Add new tables by updating the schema
- **API Routes**: Extend functionality in `server/routes/`

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify Supabase connection
3. Ensure all dependencies are installed
4. Check the database schema is properly created

## 🎉 You're Ready!

Your comprehensive student wallet platform is now set up and ready to use. Explore all the dashboards and features to see the full capabilities of the system.

**Happy coding! 🚀**
