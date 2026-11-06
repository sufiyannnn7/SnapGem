import { supabase } from '../lib/supabase';

export const analyticsService = {
  async getDashboardStats() {
    try {
      const [
        { count: totalProducts },
        { count: totalCategories },
        { count: totalOrders },
        { count: pendingOrdersCount },
        { count: confirmedOrdersCount },
        { count: deliveredOrdersCount },
        { count: cancelledOrdersCount },
        { count: featuredProductsCount },
        { count: trendingProductsCount },
        { data: lowStockProducts },
        { data: recentOrders },
        { data: paidOrders }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('categories').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true).is('deleted_at', null),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_trending', true).is('deleted_at', null),
        supabase.from('products').select('*').lte('stock', 5).is('deleted_at', null),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('id, total, shipping, discount').eq('payment_status', 'paid')
      ]);

      return {
        totalProducts: totalProducts || 0,
        totalCategories: totalCategories || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrdersCount || 0,
        confirmedOrders: confirmedOrdersCount || 0,
        paidOrdersCount: paidOrders?.length || 0,
        deliveredOrders: deliveredOrdersCount || 0,
        cancelledOrders: cancelledOrdersCount || 0,
        featuredProductsCount: featuredProductsCount || 0,
        trendingProductsCount: trendingProductsCount || 0,
        recentOrders: recentOrders || [],
        lowStockCount: lowStockProducts?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};
