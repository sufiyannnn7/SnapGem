import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Tags, AlertCircle, Clock, Truck, CheckCircle2, Flame, Star, Plus, ArrowRight, Warehouse, LayoutTemplate, Settings, Image as ImageIcon } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { productService } from '@/services/productService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_dashboard_stats'],
    queryFn: analyticsService.getDashboardStats
  });

  const { data: recentProducts = [] } = useQuery({
    queryKey: ['admin_recent_products'],
    queryFn: async () => {
      const all = await productService.getProducts();
      return all.slice(0, 5);
    }
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading dashboard overview...</div>;
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SnapGem Store Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time catalog metrics and customer order tracking from Supabase.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate('/admin/products/new')} className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-2 rounded-xl text-xs font-semibold hover:bg-foreground/90 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
          <button onClick={() => navigate('/admin/categories')} className="inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors">
            <Tags className="w-3.5 h-3.5" /> Add Category
          </button>
          <button onClick={() => navigate('/admin/homepage-builder')} className="inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors">
            <LayoutTemplate className="w-3.5 h-3.5" /> Homepage
          </button>
          <button onClick={() => navigate('/admin/inventory')} className="inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors">
            <Warehouse className="w-3.5 h-3.5" /> Inventory
          </button>
          <button onClick={() => navigate('/admin/settings')} className="inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* 1. Total Products */}
        <Card className="shadow-sm hover:border-foreground/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Catalog items</p>
          </CardContent>
        </Card>

        {/* 2. Categories */}
        <Card className="shadow-sm hover:border-foreground/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/categories')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</CardTitle>
            <Tags className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCategories}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Active categories</p>
          </CardContent>
        </Card>

        {/* 3. Pending Orders */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:border-amber-500 transition-colors cursor-pointer" onClick={() => navigate('/admin/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.pendingOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting seller confirmation</p>
          </CardContent>
        </Card>

        {/* 4. Confirmed Orders */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:border-blue-500 transition-colors cursor-pointer" onClick={() => navigate('/admin/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmed Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.confirmedOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Stock deducted</p>
          </CardContent>
        </Card>

        {/* 5. Delivered Orders */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:border-green-500 transition-colors cursor-pointer" onClick={() => navigate('/admin/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivered Orders</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.deliveredOrders}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Fulfillment completed</p>
          </CardContent>
        </Card>

        {/* 6. Low Stock Products */}
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:border-red-500 transition-colors cursor-pointer" onClick={() => navigate('/admin/inventory')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Low Stock Products</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.lowStockCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Stock &le; 5 items</p>
          </CardContent>
        </Card>

        {/* 7. Featured Products */}
        <Card className="shadow-sm hover:border-foreground/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Products</CardTitle>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.featuredProductsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Promoted on homepage</p>
          </CardContent>
        </Card>

        {/* 8. Trending Products */}
        <Card className="shadow-sm hover:border-foreground/30 transition-colors cursor-pointer" onClick={() => navigate('/admin/products')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trending Products</CardTitle>
            <Flame className="h-4 w-4 text-purple-600 fill-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.trendingProductsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Trending badge active</p>
          </CardContent>
        </Card>

      </div>

      {/* Split Columns: Latest Orders & Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latest Orders (2 Cols) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Latest Customer Orders</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Click any order row to open full Order Details page.</p>
            </div>
            <button onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b uppercase">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No orders placed yet.
                      </td>
                    </tr>
                  ) : (
                    stats?.recentOrders.slice(0, 5).map((order: any) => (
                      <tr 
                        key={order.id} 
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                      >
                        <td className="p-3 font-mono font-bold">#{order.order_number || order.id.slice(0, 8)}</td>
                        <td className="p-3 font-semibold">{order.customer_name || 'Guest'}</td>
                        <td className="p-3 font-bold">₹{(order.total || 0).toFixed(2)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary border">
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Products (1 Col) */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recently Added</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Newest catalog additions.</p>
            </div>
            <button onClick={() => navigate('/admin/products')} className="text-xs font-bold text-primary hover:underline">
              Catalog &rarr;
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No products added yet.</p>
            ) : (
              recentProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors border">
                  <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0 border">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground m-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.category?.name || 'Jewelry'}</p>
                  </div>
                  <span className="font-bold text-xs">₹{p.selling_price.toFixed(2)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}