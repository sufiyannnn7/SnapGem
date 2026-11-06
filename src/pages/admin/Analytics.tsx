import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Tags, Sparkles, Flame, Star, Award, Info } from 'lucide-react';

export function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_real_catalog_stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: activeProducts },
        { count: totalCategories },
        { count: featuredProducts },
        { count: trendingProducts },
        { count: newArrivals },
        { count: bestSellers }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
        supabase.from('categories').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_trending', true).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_new_arrival', true).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_best_seller', true).is('deleted_at', null)
      ]);

      return {
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalCategories: totalCategories || 0,
        featuredProducts: featuredProducts || 0,
        trendingProducts: trendingProducts || 0,
        newArrivals: newArrivals || 0,
        bestSellers: bestSellers || 0
      };
    }
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading catalog analytics...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Catalog & Product Analytics</h2>
        <p className="text-muted-foreground mt-2">Real-time statistics sourced directly from your store catalog.</p>
      </div>

      {/* WhatsApp Revenue Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Revenue & Financial Metrics Notice</h4>
          <p className="text-xs leading-relaxed mt-0.5">
            Revenue unavailable because orders are completed manually via WhatsApp.
          </p>
        </div>
      </div>

      {/* Real Catalog Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Total items in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Products</CardTitle>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible on storefront</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured Items</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.featuredProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Highlighted items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trending Products</p>
            <p className="text-2xl font-bold mt-1">{stats?.trendingProducts}</p>
          </div>
          <Flame className="w-8 h-8 text-orange-500/80" />
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Arrivals</p>
            <p className="text-2xl font-bold mt-1">{stats?.newArrivals}</p>
          </div>
          <Sparkles className="w-8 h-8 text-blue-500/80" />
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best Sellers</p>
            <p className="text-2xl font-bold mt-1">{stats?.bestSellers}</p>
          </div>
          <Award className="w-8 h-8 text-purple-500/80" />
        </Card>
      </div>
    </div>
  );
}
