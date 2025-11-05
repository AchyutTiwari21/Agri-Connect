# AgriConnect - Farm to Table Direct

A full-stack web portal connecting local farmers directly with consumers for sustainable shopping and fair trade.

## Features

### For Consumers
- Browse and search agricultural products
- Filter by category, price range, and ratings
- View detailed product information with reviews
- Add products to cart and checkout
- Integrated payment system with Razorpay
- View order history
- Leave reviews and ratings

### For Farmers
- Create and manage product listings
- Upload product photos and details
- Track sales and orders
- View dashboard with analytics
- Manage inventory

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: TailwindCSS, ShadCN/UI
- **Database**: PostgreSQL (Neon) via Prisma
- **Authentication**: NextAuth (Credentials, Prisma Adapter)
- **Payments**: Razorpay
- **Animations**: Framer Motion
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A PostgreSQL database (Neon or similar)
- A Razorpay account (optional, for payment integration)

### Setup Instructions

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Database**
   - Set `DATABASE_URL` in your environment to your PostgreSQL URI

3. **Configure Environment Variables**

   Update `.env.local` with your credentials:
   ```env
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Seed Sample Data (Optional)**
   - Create a farmer account through the signup flow
   - Copy the farmer's user ID from the Supabase profiles table
   - Edit `scripts/seed.sql` and replace `YOUR_FARMER_ID` with the actual ID
   - Run the SQL in Supabase SQL Editor

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **profiles**: User profiles with role (consumer/farmer)
- **products**: Product listings by farmers
- **orders**: Order records with payment status
- **reviews**: Product reviews and ratings

All tables have Row Level Security (RLS) enabled for data protection.

## User Roles

### Consumer
- Can browse and purchase products
- Can add items to cart
- Can place orders and make payments
- Can leave reviews on products
- Can view order history

### Farmer
- Can create and manage product listings
- Can view sales analytics
- Can see order details for their products
- Cannot purchase products

## Payment Integration

The application supports two payment methods:

1. **Demo Payment**: For testing without Razorpay setup
2. **Razorpay**: Full payment gateway integration

To enable Razorpay:
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get your API keys from the dashboard
3. Add them to `.env.local`

## Sample Product Images

The seed script includes links to free stock photos from Pexels for:
- Grains (Rice, Wheat)
- Vegetables (Tomatoes, Potatoes, Chillies)
- Fruits (Mangoes)
- Dairy (Milk)
- Spices (Turmeric)
- Pulses (Lentils)

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout page
│   ├── farmer/              # Farmer dashboard
│   ├── orders/              # Order history
│   └── products/            # Product details
├── components/              # React components
│   ├── ui/                  # ShadCN UI components
│   ├── Navbar.tsx           # Navigation bar
│   └── ProductCard.tsx      # Product card component
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   └── CartContext.tsx      # Shopping cart state
├── lib/                     # Utility functions
│   └── types.ts             # Shared type definitions
└── scripts/                 # Database scripts
    └── seed.sql             # Sample data

```

## Building for Production

```bash
npm run build
```

The application uses static export, so it can be deployed to any static hosting service.

## Deployment

This application can be deployed to:
- Vercel (recommended)
- Netlify
- Any static hosting service

Make sure to set environment variables in your deployment platform.

## Security Features

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- Protected routes for authenticated users
- Role-based access control
- Secure payment processing

## Support

For issues or questions, please create an issue in the repository.

## License

MIT License
