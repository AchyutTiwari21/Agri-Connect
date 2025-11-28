'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SuccessModal from '@/components/SuccessModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successSubtitle, setSuccessSubtitle] = useState(
    'Your payment has been processed successfully.'
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (cart.length === 0) {
        router.push('/cart');
      }
    }
  }, [user, authLoading, cart, router]);

  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone);
    }
    if (profile?.address) {
      setAddress(profile.address);
    }
  }, [profile?.phone, profile?.address]);

  const placeOrderRecords = async (payment: { order_id: string; payment_id: string }) => {
    for (const item of cart) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.id,
          buyer_id: user?.id,
          quantity: item.cartQuantity,
          total_amount: item.price * item.cartQuantity,
          payment_status: 'completed',
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.payment_id,
          address,
          phone
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Order failed');
      }
    }
  };

  const openRazorpay = (orderId: string) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: cartTotal * 100,
      currency: 'INR',
      name: 'AgriConnect',
      description: 'Purchase from local farmers',
      order_id: orderId,
      prefill: {
        name: profile?.name,
        email: user?.email,
        contact: phone,
      },
      notes: {
        address
      },
      theme: { color: '#16a34a' },
      handler: async (response: any) => {
        try {
          setProcessing(true);
          // Verify signature on server
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error(verifyJson?.error || 'Payment verification failed');
          }

          await placeOrderRecords({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
          });

          clearCart();
          toast.success('Payment successful!');
          setSuccessSubtitle('Your payment has been received and your order is on the way.');
          setSuccessOpen(true);
        } catch (err: any) {
          toast.error(err?.message || 'Payment failed');
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          toast.error('Payment cancelled');
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const saveContactInfo = async () => {
    if (!user) return;
    const res = await fetch(`/api/profiles/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, address }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Unable to save contact info');
    }

    await refreshProfile();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !phone) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setProcessing(true);
      await saveContactInfo();
      // Create Razorpay order on server
      const orderRes = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(cartTotal * 100),
          currency: 'INR',
          receipt: `agri_${Date.now()}`,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson?.orderId) {
        throw new Error(orderJson?.error || 'Failed to initialize payment');
      }
      openRazorpay(orderJson.orderId);
    } catch (error: any) {
      setProcessing(false);
      toast.error(error.message || 'Unable to start payment');
    }
  };

  const initRazorpayPayment = () => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: cartTotal * 100,
      currency: 'INR',
      name: 'AgriConnect',
      description: 'Purchase from local farmers',
      handler: async function (response: any) {
        setProcessing(true);
        try {
          for (const item of cart) {
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: item.id,
                buyer_id: user?.id,
                quantity: item.cartQuantity,
                total_amount: item.price * item.cartQuantity,
                payment_status: 'completed',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              }),
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Order failed');
            }
          }

          clearCart();
          toast.success('Payment successful!');
          setSuccessSubtitle('Your payment has been received and your order is on the way.');
          setSuccessOpen(true);
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setProcessing(false);
        }
      },
      prefill: {
        name: profile?.name,
        email: user?.email,
        contact: phone,
      },
      theme: {
        color: '#16a34a',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (authLoading || cart.length === 0) {
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Toaster position="top-center" />

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePayment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile?.name || ''}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 1234567890"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Input
                          id="address"
                          placeholder="Enter your full address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name} x {item.cartQuantity}
                        </span>
                        <span>₹{(item.price * item.cartQuantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
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

                    <div className="pt-4 space-y-2">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                        onClick={handlePayment}
                        disabled={processing || !address || !phone}
                      >
                        {processing ? 'Processing...' : 'Place Order'}
                      </Button>

                      {/* {typeof window !== 'undefined' && window.Razorpay && (
                        <Button
                          className="w-full"
                          size="lg"
                          variant="outline"
                          onClick={initRazorpayPayment}
                          disabled={processing || !address || !phone}
                        >
                          Pay with Razorpay
                        </Button>
                      )} */}

                      <p className="text-xs text-center text-muted-foreground">
                        Your payment information is secure
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <SuccessModal
        open={successOpen}
        title="Payment Successful"
        description={successSubtitle}
        primaryLabel="View Orders"
        onPrimary={() => {
          setSuccessOpen(false);
          router.push('/orders');
        }}
        secondaryLabel="Back to Cart"
        onSecondary={() => {
          setSuccessOpen(false);
          router.push('/cart?order=success');
        }}
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}
