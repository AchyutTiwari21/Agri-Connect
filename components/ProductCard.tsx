'use client';

import { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, User, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ProductCardProps = {
  product: Product & { avgRating?: number; reviewCount?: number };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return;
    }

    if (profile?.role !== 'consumer') {
      toast.error('Only consumers can purchase products');
      return;
    }

    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return;
    }

    if (profile?.role !== 'consumer') {
      toast.error('Only consumers can purchase products');
      return;
    }

    addToCart(product, 1);
    router.push('/cart');
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
        <Link href={`/products/${product.id}`}>
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        <CardHeader className="pb-3">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg line-clamp-1 hover:text-green-700 transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="line-clamp-1">{product.profiles?.name || 'Unknown Farmer'}</span>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {product.avgRating?.toFixed(1) || 'New'}
            </span>
            {product.reviewCount ? (
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-3 border-t">
          <div className="w-full">
            <p className="text-2xl font-bold text-green-700">
              ₹{product.price} / {product.category === 'Dairy' ? 'ltr' : 'kg'}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.quantity > 0 ? `${product.quantity} ${product.category === 'Dairy' ? 'ltr' : 'kg'} in stock` : 'Out of stock'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full">
            <Button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              variant="outline"
              className="flex-1"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={product.quantity === 0}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              Buy Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
