'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Product, Order } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Edit, Trash2, Package, DollarSign, Eye } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';

const categories = ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Dairy', 'Spices'];

export default function FarmerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<
    (Order & {
      products?: Product;
      buyer?: {
        id: string;
        name: string;
        phone?: string | null;
        address?: string | null;
        email?: string | null;
      };
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<
    (Order & {
      products?: Product;
      buyer?: {
        id: string;
        name: string;
        phone?: string | null;
        address?: string | null;
        email?: string | null;
      };
    }) | null
  >(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    price: '',
    quantity: '',
    category: 'Grains',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'farmer') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchData = async () => {
    const productList = await fetchProducts();
    await fetchOrders(productList);
    setLoading(false);
  };

  const fetchProducts = async (): Promise<Product[]> => {
    const res = await fetch(`/api/products?farmerId=${user?.id}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
      return data;
    }
    setProducts([]);
    return [];
  };

  const fetchOrders = async (productList?: Product[]) => {
    const source = productList ?? products;
    if (!user || source.length === 0) {
      setOrders([]);
      return;
    }

    const res = await fetch(
      `/api/farmer/orders?productIds=${source.map((p) => p.id).join(',')}`
    );
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    } else {
      setOrders([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const productData = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      category: formData.category,
      farmer_id: user.id,
    };

    let error;

    let ok = true; let errMsg = '';
    if (editingProduct) {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct.id, ...productData }),
      });
      ok = res.ok; if (!ok) { const d = await res.json(); errMsg = d.error; }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      ok = res.ok; if (!ok) { const d = await res.json(); errMsg = d.error; }
    }

    if (!ok) {
      toast.error(errMsg || 'Failed to save product');
    } else {
      toast.success(editingProduct ? 'Product updated!' : 'Product added!');
      setIsDialogOpen(false);
      resetForm();
      const latestProducts = await fetchProducts();
      await fetchOrders(latestProducts);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to delete');
    } else {
      toast.success('Product deleted!');
      const latestProducts = await fetchProducts();
      await fetchOrders(latestProducts);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      price: '',
      quantity: '',
      category: 'Grains',
    });
    setEditingProduct(null);
  };

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  if (authLoading || loading) {
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
              <p className="text-muted-foreground">Manage your products and orders</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update product details' : 'Add a new product to your store'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>Manage your product listings</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No products yet. Add your first product to get started!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders placed for your products</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.products?.name || 'Product'}</span>
                            <span className="text-sm text-muted-foreground">
                              {order.products?.category || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.payment_status === 'completed'
                                ? 'default'
                                : order.payment_status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDrawerOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders received yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>

      <Sheet
        open={orderDrawerOpen}
        onOpenChange={(open) => {
          setOrderDrawerOpen(open);
          if (!open) {
            setSelectedOrder(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              {selectedOrder ? `Order #${selectedOrder.id.slice(0, 8)}` : 'Select an order to view details'}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder ? (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium">{selectedOrder.buyer?.name ?? 'Unknown customer'}</p>
                  <p className="text-muted-foreground">{selectedOrder.buyer?.email ?? 'No email'}</p>
                  <p>{selectedOrder.buyer?.phone ?? 'No phone provided'}</p>
                  <p className="text-muted-foreground">
                    {selectedOrder.buyer?.address ?? 'No address added yet'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge
                      variant={
                        selectedOrder.payment_status === 'completed'
                          ? 'default'
                          : selectedOrder.payment_status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quantity</span>
                    <span className="font-medium">{selectedOrder.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Amount</span>
                    <span className="font-semibold text-green-700">₹{selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Placed On</span>
                    <span>
                      {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Product</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium">{selectedOrder.products?.name ?? 'Product'}</p>
                  <p className="text-muted-foreground">
                    Category: {selectedOrder.products?.category ?? 'N/A'}
                  </p>
                  {typeof selectedOrder.products?.price === 'number' && (
                    <p>Unit Price: ₹{selectedOrder.products.price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {selectedOrder.razorpay_order_id && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Reference</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Order ID: {selectedOrder.razorpay_order_id}</p>
                    {selectedOrder.razorpay_payment_id && <p>Payment ID: {selectedOrder.razorpay_payment_id}</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Select an order to view its full details.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
