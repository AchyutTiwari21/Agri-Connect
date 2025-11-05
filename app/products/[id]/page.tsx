'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Product, Review } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Star, User, ShoppingCart, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<(Review & { profiles?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchReviews();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    const res = await fetch(`/api/products/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setProduct({
        ...data,
        profiles: data.farmer ? { id: '', name: data.farmer.name, role: 'farmer', created_at: '', updated_at: '' } : undefined,
      });
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const res = await fetch(`/api/products/${params.id}/reviews`);
    if (res.ok) {
      const data = await res.json();
      setReviews(
        data.map((r: any) => ({
          ...r,
          profiles: r.user ? { name: r.user.name } : undefined,
        }))
      );
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    if (profile?.role !== 'consumer') {
      toast.error('Only consumers can purchase products');
      return;
    }

    if (product) {
      addToCart(product, quantity);
      toast.success('Added to cart!');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to leave a review');
      router.push('/auth/login');
      return;
    }

    setSubmittingReview(true);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: params.id as string,
        user_id: user.id,
        rating,
        comment,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409) toast.error('You have already reviewed this product');
      else toast.error(data.error || 'Failed to submit review');
    } else {
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      fetchReviews();
    }

    setSubmittingReview(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-center" />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="relative h-96 bg-white rounded-lg overflow-hidden shadow-md">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{avgRating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">
                  ({reviews.length} reviews)
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <User className="h-4 w-4" />
                <span>Sold by {product.profiles?.name || 'Unknown Farmer'}</span>
              </div>

              <p className="text-3xl font-bold text-green-700 mb-4">
                ₹{product.price}
              </p>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-lg">{product.category}</p>
                </div>

                <div>
                  <Label>Availability</Label>
                  <p className="text-lg">
                    {product.quantity > 0
                      ? `${product.quantity} in stock`
                      : 'Out of stock'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{review.profiles?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 cursor-pointer transition-colors ${
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Share your experience..."
                      />
                    </div>
                    <Button type="submit" disabled={submittingReview || !user}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
