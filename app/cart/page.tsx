'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SuccessModal from '@/components/SuccessModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

export default function CartPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('order') === 'success') {
      setShowOrderSuccess(true);
      router.replace('/cart');
    }
  }, [searchParams, router]);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Toaster position="top-center" />

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            {cart.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Start shopping to add items to your cart
                </p>
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.category}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.cartQuantity - 1)
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={item.cartQuantity}
                                  onChange={(e) =>
                                    updateQuantity(
                                      item.id,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="w-16 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.cartQuantity + 1)
                                  }
                                  disabled={item.cartQuantity >= item.quantity}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-700">
                                  ₹{(item.price * item.cartQuantity).toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{item.price} / {item.category === 'Dairy' ? 'ltr' : 'kg'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-700">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </div>

      <SuccessModal
        open={showOrderSuccess}
        title="Order Confirmed"
        description="Your order has been placed successfully. We will update you when it ships."
        primaryLabel="View Orders"
        onPrimary={() => {
          setShowOrderSuccess(false);
          router.push('/orders');
        }}
        secondaryLabel="Continue Shopping"
        onSecondary={() => {
          setShowOrderSuccess(false);
          router.push('/');
        }}
        onClose={() => setShowOrderSuccess(false)}
      />
    </>
  );
}
