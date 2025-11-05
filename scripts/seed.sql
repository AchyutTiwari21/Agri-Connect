-- Sample data for AgriConnect
-- Note: You'll need to manually create users through the signup flow first

-- Sample Products (replace farmer_id with actual farmer user IDs)
-- These are examples - farmers will add their own products through the dashboard

-- Example product structure:
-- INSERT INTO products (name, description, image, price, quantity, category, farmer_id)
-- VALUES
--   ('Organic Basmati Rice', 'Premium quality organic basmati rice from Punjab farms', 'https://images.pexels.com/photos/3297882/pexels-photo-3297882.jpeg', 120.00, 50, 'Grains', 'YOUR_FARMER_ID'),
--   ('Fresh Tomatoes', 'Farm fresh tomatoes harvested daily', 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg', 40.00, 100, 'Vegetables', 'YOUR_FARMER_ID'),
--   ('Green Chillies', 'Organic green chillies with natural spice', 'https://images.pexels.com/photos/7656720/pexels-photo-7656720.jpeg', 80.00, 30, 'Vegetables', 'YOUR_FARMER_ID'),
--   ('Alphonso Mangoes', 'Sweet Alphonso mangoes from Maharashtra', 'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg', 250.00, 40, 'Fruits', 'YOUR_FARMER_ID'),
--   ('Fresh Milk', 'Pure A2 cow milk delivered daily', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg', 60.00, 200, 'Dairy', 'YOUR_FARMER_ID'),
--   ('Turmeric Powder', 'Pure organic turmeric powder', 'https://images.pexels.com/photos/5340266/pexels-photo-5340266.jpeg', 150.00, 25, 'Spices', 'YOUR_FARMER_ID'),
--   ('Red Lentils', 'High protein red lentils', 'https://images.pexels.com/photos/4022092/pexels-photo-4022092.jpeg', 90.00, 60, 'Pulses', 'YOUR_FARMER_ID'),
--   ('Fresh Potatoes', 'Farm fresh potatoes', 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg', 30.00, 150, 'Vegetables', 'YOUR_FARMER_ID');

-- To use this seed data:
-- 1. First, create farmer and consumer accounts through the signup flow
-- 2. Get the farmer's user ID from the profiles table
-- 3. Replace 'YOUR_FARMER_ID' with the actual farmer UUID
-- 4. Run this SQL in your Supabase SQL editor
