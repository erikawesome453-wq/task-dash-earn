-- Add image_url and description columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN image_url text,
ADD COLUMN description text,
ADD COLUMN category text DEFAULT 'general',
ADD COLUMN platform text DEFAULT 'website';

-- Update existing tasks with images and details
UPDATE public.tasks 
SET 
  image_url = 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=300&fit=crop',
  description = 'Explore millions of products on Amazon and discover great deals',
  category = 'E-commerce',
  platform = 'Amazon'
WHERE title = 'Visit Amazon';

UPDATE public.tasks 
SET 
  image_url = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
  description = 'Browse unique items and bid on auctions at eBay marketplace',
  category = 'E-commerce', 
  platform = 'eBay'
WHERE title = 'Browse eBay';

UPDATE public.tasks 
SET 
  image_url = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
  description = 'Connect with suppliers and manufacturers on Alibaba',
  category = 'B2B',
  platform = 'Alibaba'
WHERE title = 'Check Alibaba';

UPDATE public.tasks 
SET 
  image_url = 'https://images.unsplash.com/photo-1601598851547-4302969d0e5b?w=400&h=300&fit=crop',
  description = 'Save money and live better with Walmart shopping',
  category = 'Retail',
  platform = 'Walmart'  
WHERE title = 'Visit Walmart';

UPDATE public.tasks 
SET 
  image_url = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
  description = 'Latest electronics and tech gadgets at Best Buy',
  category = 'Electronics',
  platform = 'Best Buy'
WHERE title = 'Browse Best Buy';