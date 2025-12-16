'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Dairy', 'Spices'];

export default function Home() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<(Product & { avgRating?: number; reviewCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/products');
    if (res.ok) {
      const productsData = await res.json();
      const productsWithRatings = productsData.map((product: any) => {
        const avgRating = product.reviews?.length
          ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
          : 0;

        const mapped = {
          ...product,
          avgRating,
          reviewCount: product.reviews?.length || 0,
        } as Product & { avgRating?: number; reviewCount?: number };

        if (product.farmer?.name && !mapped.profiles) {
          mapped.profiles = {
            id: '',
            name: product.farmer.name,
            role: 'farmer',
            created_at: '',
            updated_at: '',
          };
        }

        return mapped;
      });

      setProducts(productsWithRatings);

      const prices = productsData.map((p: any) => p.price);
      const max = Math.max(...prices, 10000);
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPrice && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16"
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Farm Fresh, Direct to Your Door
          </h1>
          <p className="text-xl text-green-50 max-w-2xl mx-auto">
            Connect with local farmers and buy fresh, sustainable agricultural products
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-lg mb-4">Filters</h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Category</Label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </Label>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceRange([0, maxPrice]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} products found
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-4">
                  No products found
                </p>
                <Button onClick={() => {
                  setSelectedCategory('All');
                  setPriceRange([0, maxPrice]);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">AgriConnect</h3>
              <p className="text-gray-400">
                Connecting farmers directly with consumers for fresh, sustainable products.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <Link href="/auth/signup?role=farmer" className="text-gray-400 hover:text-white block">
                Sell Your Products
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4 text-gray-400">
                <a href="#" className="hover:text-white">Facebook</a>
                <a href="#" className="hover:text-white">Twitter</a>
                <a href="#" className="hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgriConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
